import * as ts from 'typescript'
import { readFileSync, existsSync } from 'fs'

const Reset = "\x1b[0m";
const Bright = "\x1b[1m";
const Dim = "\x1b[2m";
const Underscore = "\x1b[4m";
const Blink = "\x1b[5m";
const Reverse = "\x1b[7m";
const Hidden = "\x1b[8m";

const FgBlack = "\x1b[30m";
const FgRed = "\x1b[31m";
const FgGreen = "\x1b[32m";
const FgYellow = "\x1b[33m";
const FgBlue = "\x1b[34m";
const FgMagenta = "\x1b[35m";
const FgCyan = "\x1b[36m";
const FgWhite = "\x1b[37m";

console.log(FgWhite + 'initialize...' + Reset)

const compilerOptions: ts.CompilerOptions = {
    module: ts.ModuleKind.CommonJS,
    strict: true,
}

const files = ['ts-json.ts', 'ts-json-config.ts', 'types.ts']

const servicesHost: ts.LanguageServiceHost = {
    getScriptFileNames: () => files,
    getScriptVersion: fileName => fileName,
    getScriptSnapshot: fileName => {
        if (!existsSync(fileName)) return undefined
        return ts.ScriptSnapshot.fromString(readFileSync(fileName).toString())
    },
    getCurrentDirectory: () => process.cwd(),
    getCompilationSettings: () => compilerOptions,
    getDefaultLibFileName: options => ts.getDefaultLibFilePath(options),
    fileExists: ts.sys.fileExists,
    readFile: ts.sys.readFile,
    readDirectory: ts.sys.readDirectory,
}

const services = ts.createLanguageService(
    servicesHost,
    ts.createDocumentRegistry()
)

const program = services.getProgram()
if (!program) throw new Error("program is undefined.")

const typeChecker = program.getTypeChecker()

const tsJsonSource = program.getSourceFile(files[0])
if (!tsJsonSource) throw new Error("tsJsonSource is undefined.")

for (const diag of services.getCompilerOptionsDiagnostics()) {
    console.log(diag)
}

console.log(FgWhite + 'generate function finding...' + Reset)

const generateFunc = tsJsonSource.forEachChild(node => {
    if (ts.isFunctionDeclaration(node) && node.name && node.name.text === "generate") {
        return node
    }
})

if (!generateFunc) throw new Error("generate function is undefined.")

console.log(FgWhite + tsJsonSource.fileName, generateFunc.name!.getStart(), generateFunc.getText() + Reset)

console.log(FgWhite + 'references finding...' + Reset)

const refs = services.getReferencesAtPosition(tsJsonSource.fileName, generateFunc.name!.getStart())
if (!refs) throw new Error("refs is undefined.")

interface GenInfo {
    typeNode: ts.TypeNode
    name: string
}

const genInfos: GenInfo[] = []

for (const ref of refs) {
    if (!ref.isDefinition) {
        console.log(FgWhite + ref.fileName, ref.textSpan.start + Reset)
            
        const targetFile = program.getSourceFile(ref.fileName)
        if (!targetFile) throw new Error("targetFile is undefined.")

        const targetFunc = targetFile.forEachChild(
            function visitor(n: ts.Node): ts.CallExpression | undefined {
                if (ref.textSpan.start === n.getStart() && ts.isCallExpression(n)) {
                    return n
                }

                return n.forEachChild(visitor)
            }
        )

        if (!targetFunc) throw new Error("target function is undefined.")

        console.log(FgWhite + targetFunc.getText() + Reset)

        const typeNode = targetFunc.typeArguments![0]

        const arg0 = targetFunc.arguments[0]
        if (!ts.isStringLiteral(arg0)) throw new Error("arg0 is not string literal.")


        genInfos.push({
            typeNode: typeNode,
            name: arg0.text,
        })
    }
}

if (genInfos.length === 0) {
    console.log(Bright + FgYellow + "references not found." + Reset)
}

function isBoolean(type: ts.Type) {
    return (type.flags & (ts.TypeFlags.Boolean | ts.TypeFlags.BooleanLiteral)) !== 0
}

function isNumber(type: ts.Type) {
    return (type.flags & (ts.TypeFlags.Number | ts.TypeFlags.NumberLiteral)) !== 0
}

function isString(type: ts.Type) {
    return (type.flags & (ts.TypeFlags.String | ts.TypeFlags.StringLiteral)) !== 0
}

function isNull(type: ts.Type) {
    return (type.flags & ts.TypeFlags.Null) !== 0
}

function isUndefined(type: ts.Type) {
    return (type.flags & ts.TypeFlags.Undefined) !== 0
}

function parseNodeType(parseds: ParsedInfo[], node: ts.Node, type: ts.Type) {
    let parsed = parseds.find(p => p.type === type)
    if (parsed) {
        console.log(FgWhite + parsed.name, 'parsed' + Reset)
        return parsed
    }

    const typeName = typeChecker.typeToString(type)
    parsed = {
        name: typeName,
        type: type,
        isUndefined: false,
        isNull: false,
        isObject: false,
        isBool: false,
        isNumber: false,
        isString: false,
        isArray: false,
        additionalInfos: [],
    }
    parseds.push(parsed)

    if (isBoolean(type)) {
        parsed.isBool = true
    } else if (isNumber(type)) {
        parsed.isNumber = true
    } else if (isString(type)) {
        parsed.isString = true
    } else if (isNull(type)) {
        parsed.isNull = true
    } else if (isUndefined(type)) {
        parsed.isUndefined = true
    } else if (type.isUnion()) {
        for (const t of type.types) {
            //console.log(typeChecker.typeToString(t))
            parseNodeType(parseds, node, t)
        }
    } else if (type.isClassOrInterface()) {
        console.log('type:', Bright + FgCyan + typeName + Reset)

        for (const prop of type.getProperties()) {
            const propType = typeChecker.getTypeOfSymbolAtLocation(prop, node)
            console.log(typeName + '.' + prop.name + ':', Bright + FgGreen + typeChecker.typeToString(propType) + Reset)
            parseNodeType(parseds, prop.valueDeclaration, propType)
        }
    } else {
        console.log(ts.TypeFlags[type.flags])

        const arr = typeChecker.typeToTypeNode(type)!
        if (ts.isArrayTypeNode(arr)) {
            console.log(ts.SyntaxKind[arr.elementType.kind], arr.elementType)
            console.log(typeChecker.getTypeFromTypeNode(arr.elementType))
            //console.log(typeChecker.getTypeFromTypeNode(arr.elementType))
            // const sym = typeChecker.getSymbolAtLocation(a.elementType)!
            // const t = typeChecker.getTypeOfSymbolAtLocation(sym, node)
            // console.log(typeChecker.typeToString(t))
        }
        
        //throw new Error("unknown type: " + typeName)
    }
}

interface ParsedInfo {
    name: string
    type: ts.Type
    isUndefined: boolean
    isNull: boolean
    isObject: boolean
    isBool: boolean
    isNumber: boolean
    isString: boolean
    isArray: boolean
    additionalInfos: ParsedInfo[]
}

const parsedInfos: ParsedInfo[] = []
for (const gen of genInfos) {
    const type = typeChecker.getTypeAtLocation(gen.typeNode)
    console.log('generate', Bright + FgMagenta + gen.name + Reset + '<' + Bright + FgYellow + typeChecker.typeToString(type) + Reset + '>')
    parseNodeType(parsedInfos, gen.typeNode, type)
}

