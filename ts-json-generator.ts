import * as ts from 'typescript'
import { readFileSync, existsSync } from 'fs'

interface GenInfo {
    typeNode: ts.TypeNode
    name: string
}

interface ParsedInfo {
    name: string
    type: ts.Type
}

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

function parseNodeType(parseds: ParsedInfo[], node: ts.Node) {
    const type = typeChecker.getTypeAtLocation(node)

    if (isBoolean(type)) {
    } else if (type.isUnion()) {
        for (const t of type.types) {
            if (!isBoolean(t)) {
                console.log(typeChecker.typeToString(t))
                if (t.isClassOrInterface()) {
                    parseInterfaceType(parseds, node, t)
                }
            }
        }
    } else if (type.isClassOrInterface()) {
        parseInterfaceType(parseds, node, type)
    }
}

function parseInterfaceType(parseds: ParsedInfo[], node: ts.Node, type: ts.Type) {
    if (parseds.some(v => v.type === type)) {
        console.log(FgWhite + 'parsed' + Reset)
        return
    }

    const typeName = typeChecker.typeToString(type)
    console.log('type:', Bright + FgCyan + typeName + Reset)

    parseds.push({
        name: typeName,
        type: type,
    })

    for (const prop of type.getProperties()) {
        const propType = typeChecker.getTypeOfSymbolAtLocation(prop, node)
        console.log(typeName + '.' + prop.name + ':', Bright + FgGreen + typeChecker.typeToString(propType) + Reset)
        parseNodeType(parseds, prop.declarations[0])
    }
}

const parsedInfos: ParsedInfo[] = []
for (const gen of genInfos) {
    console.log('generate', Bright + FgMagenta + gen.name + Reset)
    parseNodeType(parsedInfos, gen.typeNode)

    // const type = typeChecker.getTypeFromTypeNode(gen.typeNode)
    // const typeName = typeChecker.typeToString(type)
    // console.log('type:', Bright + FgCyan + typeName + Reset)
    // console.log('name:', Bright + FgGreen + gen.name + Reset)

    // for (const prop of type.getProperties()) {
    //     const t = typeChecker.getTypeOfSymbolAtLocation(prop, gen.typeNode)
    //     console.log(typeName + '.' + prop.name + ':', FgCyan + typeChecker.typeToString(t) + Reset)
    //     const n = typeChecker.typeToTypeNode(t)!
    //     console.log(n)
    //     if (t.isClassOrInterface()) {
    //         const decl = prop.declarations[0]
    //         const source = decl.getSourceFile()
    //         console.log(source.fileName)
    //         const t = typeChecker.getTypeAtLocation(decl)
    //         const typeName2 = typeChecker.typeToString(t);
    //         for (const prop of t.getProperties()) {
    //             const t2 = typeChecker.getTypeOfSymbolAtLocation(prop, decl)
    //             console.log(typeName2 + '.' + prop.name + ':', FgCyan + typeChecker.typeToString(t2) + Reset)
    //             const n2 = typeChecker.typeToTypeNode(t2)
    //             console.log(n2)
    //         }
    //     }
    // }
}

