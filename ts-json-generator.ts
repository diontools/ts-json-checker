import * as ts from 'typescript'
import { readFileSync, fstat, existsSync } from 'fs'

interface GenInfo {
    typeNode: ts.TypeNode
    type: ts.Type
    name: string
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

const files = ['ts-json.ts', 'ts-json-config.ts']

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

const source = program.getSourceFile(files[0])
if (!source) throw new Error("source is undefined.")

for (const diag of services.getCompilerOptionsDiagnostics()) {
    console.log(diag)
}

console.log(FgWhite + 'generate function finding...' + Reset)

const generateFunc = source.forEachChild(node => {
    if (ts.isFunctionDeclaration(node) && node.name && node.name.text === "generate") {
        return node
    }
})

if (!generateFunc) throw new Error("generate function is undefined.")

console.log(FgWhite + source.fileName, generateFunc.name!.getStart(), generateFunc.getText() + Reset)

console.log(FgWhite + 'references finding...' + Reset)

const refs = services.getReferencesAtPosition(source.fileName, generateFunc.name!.getStart())
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
        const type = typeChecker.getTypeFromTypeNode(typeNode)

        const arg0 = targetFunc.arguments[0]
        if (!ts.isStringLiteral(arg0)) throw new Error("arg0 is not string literal.")


        genInfos.push({
            typeNode: typeNode,
            type: type,
            name: arg0.text,
        })
    }
}

if (genInfos.length === 0) {
    console.log(Bright + FgYellow + "references not found." + Reset)
}

for (const gen of genInfos) {
    const typeName = typeChecker.typeToString(gen.type)
    console.log('type:', Bright + FgCyan + typeName + Reset)
    console.log('name:', Bright + FgGreen + gen.name + Reset)

    for (const prop of gen.type.getProperties()) {
        const t = typeChecker.getTypeOfSymbolAtLocation(prop, gen.typeNode)
        const n = typeChecker.typeToTypeNode(t)!
        console.log(n)
        console.log(typeName + '.' + prop.name + ':', FgCyan + typeChecker.typeToString(t) + Reset)
        if (t.isClassOrInterface()) {
            const typeName2 = typeChecker.typeToString(t);
            for (const prop of t.getProperties()) {
                const d = typeChecker.symbolToParameterDeclaration(prop)
                console.log(d!.getSourceFile())
                const t2 = typeChecker.getDeclaredTypeOfSymbol(prop)
                //const t2 = typeChecker.getTypeOfSymbolAtLocation(prop, n)
                const n2 = typeChecker.typeToTypeNode(t2)
                console.log(n2)
                console.log(typeName2 + '.' + prop.name, typeChecker.typeToString(t2))
            }
        }
    }
}

