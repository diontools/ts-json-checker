import * as ts from 'typescript'
import * as fs from 'fs'
import * as path from 'path'

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

const DEBUG = true
if (!DEBUG) {
    console.log = function () { }
}

const configFile = process.argv.length > 3 ? process.argv[2] : 'ts-json-config.ts'
console.log('config:', configFile)

console.log(FgWhite + 'initialize...' + Reset)

const compilerOptions: ts.CompilerOptions = {
    module: ts.ModuleKind.CommonJS,
    strict: true,
}

const tsJsonFile = path.join(__dirname, 'ts-json.ts')
console.log('tsJson:', tsJsonFile)

const files = [tsJsonFile, configFile]

const servicesHost: ts.LanguageServiceHost = {
    getScriptFileNames: () => files,
    getScriptVersion: fileName => fileName,
    getScriptSnapshot: fileName => {
        if (!fs.existsSync(fileName)) return undefined
        return ts.ScriptSnapshot.fromString(fs.readFileSync(fileName).toString())
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

const tsJsonConfigSource = program.getSourceFile(files[1])
if (!tsJsonConfigSource) throw new Error("tsJsonConfigSource is undefined.")

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

interface GenerationInfo {
    typeNode: ts.TypeNode
    name: string
}

const genInfos: GenerationInfo[] = []

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

function isAny(type: ts.Type) {
    return (type.flags & ts.TypeFlags.Any) !== 0
}

function isObject(type: ts.Type) {
    return (type.flags & ts.TypeFlags.NonPrimitive) !== 0
}

function getElementTypeOfArrayType(type: ts.Type): ts.Type | undefined {
    return (typeChecker as any).getElementTypeOfArrayType(type)
}

function parseNodeType(parseds: ParsedInfo[], node: ts.Node, type: ts.Type): ParsedInfo {
    let parsed = parseds.find(p => p.keyType === type)
    if (parsed) {
        return parsed
    }

    const typeName = typeChecker.typeToString(type)
    parsed = {
        name: typeName,
        keyType: type,
        kind: ParsedKind.Any,
        types: [],
        members: [],
    }
    parseds.push(parsed)
    console.log(FgWhite + 'parse ' + typeName + Reset)

    if (isBoolean(type)) {
        parsed.kind = ParsedKind.Boolean
    } else if (isNumber(type)) {
        parsed.kind = ParsedKind.Number
    } else if (isString(type)) {
        parsed.kind = ParsedKind.String
    } else if (isNull(type)) {
        parsed.kind = ParsedKind.Null
    } else if (isUndefined(type)) {
        parsed.kind = ParsedKind.Undefined
    } else if (isObject(type)) {
        parsed.kind = ParsedKind.Object
    } else if (isAny(type)) {
        parsed.kind = ParsedKind.Any
    } else if (type.isUnion()) {
        parsed.kind = ParsedKind.Union
        parsed.types = type.types.reverse()
        for (const t of type.types) {
            //console.log(typeChecker.typeToString(t))
            parseNodeType(parseds, node, t)
        }
    } else if (type.isClassOrInterface()) {
        parsed.kind = ParsedKind.Complex
        console.info('complex type:', Bright + FgCyan + typeName + Reset)

        for (const prop of type.getProperties()) {
            const propType = typeChecker.getTypeOfSymbolAtLocation(prop, node)
            const propTypeName = typeChecker.typeToString(propType)
            parsed.members.push({ name: prop.name, type: propType })
            console.info(typeName + '.' + prop.name + ':', Bright + FgGreen + propTypeName + Reset)
            parseNodeType(parseds, prop.valueDeclaration, propType)
        }
    } else {
        const eType = getElementTypeOfArrayType(type)
        if (eType) {
            parsed.kind = ParsedKind.Array
            parsed.elementType = eType
            console.log(FgWhite + 'array of', typeChecker.typeToString(eType) + Reset)
            parseNodeType(parseds, node, eType)
        } else {
            console.log(ts.TypeFlags[type.flags])
            throw new Error("unknown type: " + typeName)
        }
    }

    return parsed
}

enum ParsedKind {
    Number,
    String,
    Boolean,
    Object,
    Undefined,
    Null,
    Any,

    Array,
    Union,
    Complex,
}

interface MemberInfo {
    name: string
    type: ts.Type
}

interface ParsedInfo {
    name: string
    keyType: ts.Type
    kind: ParsedKind
    elementType?: ts.Type
    types: ts.Type[]
    members: MemberInfo[]
}

function isPrimitiveKind(kind: ParsedKind) {
    switch (kind) {
        case ParsedKind.Number:
        case ParsedKind.String:
        case ParsedKind.Boolean:
        case ParsedKind.Object:
        case ParsedKind.Undefined:
            return true
        default:
            return false
    }
}

function getPrimitiveKindName(kind: ParsedKind) {
    switch (kind) {
        case ParsedKind.Number: return 'number'
        case ParsedKind.String: return 'string'
        case ParsedKind.Boolean: return 'boolean'
        case ParsedKind.Object: return 'object'
        case ParsedKind.Undefined: return 'undefined'
        default: throw new Error('non primitive')
    }
}

function isBaseKind(kind: ParsedKind) {
    switch (kind) {
        case ParsedKind.Number:
        case ParsedKind.String:
        case ParsedKind.Boolean:
        case ParsedKind.Object:
        case ParsedKind.Undefined:
        case ParsedKind.Null:
            return true
        default:
            return false
    }
}

const printingSource = ts.createSourceFile(
    'printing',
    '',
    ts.ScriptTarget.ES5,
    false,
    ts.ScriptKind.TS
)

const printer = ts.createPrinter({
    newLine: ts.NewLineKind.LineFeed
})

function printNode(node: ts.Node) {
    const text = printer.printNode(ts.EmitHint.Unspecified, node, printingSource)
    console.log(text)
    return text
}

const outputTexts: string[] = []

const exportKeywordToken = ts.createToken(ts.SyntaxKind.ExportKeyword)

// export class TypeError implements Error {}
const typeErrorClassName = ts.createIdentifier('TypeError')
const typeErrorClass = ts.createClassDeclaration(
    undefined,
    [exportKeywordToken],
    typeErrorClassName,
    undefined,
    [ts.createHeritageClause(ts.SyntaxKind.ImplementsKeyword, [ts.createExpressionWithTypeArguments(undefined, ts.createIdentifier('Error'))])],
    [
        // public name = "TypeError"
        ts.createProperty(undefined, [ts.createModifier(ts.SyntaxKind.PublicKeyword)], 'name', undefined, undefined, ts.createStringLiteral('TypeError')),

        // constructor(public message: string) {}
        ts.createConstructor(undefined, undefined, [
            ts.createParameter(undefined, [ts.createModifier(ts.SyntaxKind.PublicKeyword)], undefined, 'message', undefined, ts.createKeywordTypeNode(ts.SyntaxKind.StringKeyword))
        ], ts.createBlock([])),

        // toString() { return this.name + ': ' + this.message }
        ts.createMethod(undefined, undefined, undefined, 'toString', undefined, undefined, [], undefined, ts.createBlock([
            ts.createReturn(ts.createAdd(ts.createAdd(ts.createPropertyAccess(ts.createThis(), 'name'), ts.createStringLiteral(': ')), ts.createPropertyAccess(ts.createThis(), 'message'))),
        ])),
    ]
)

outputTexts.push(printNode(typeErrorClass))

const parsedInfos: ParsedInfo[] = []

function getParsed(type: ts.Type) {
    return parsedInfos.find(p => p.keyType === type)
}

for (const gen of genInfos) {
    const type = typeChecker.getTypeAtLocation(gen.typeNode)
    console.info('generate', Bright + FgMagenta + gen.name + Reset + '<' + Bright + FgYellow + typeChecker.typeToString(type) + Reset + '>')
    const parsed = parseNodeType(parsedInfos, gen.typeNode, type)

    const vParamName = ts.createIdentifier('v')
    const vParam = ts.createParameter(undefined, undefined, undefined, vParamName, undefined, ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword))

    printParsed(parsed)

    const statements = createTypeCheckStatements(parsed, vParamName, vParamName.text);
    statements.push(ts.createReturn(ts.createTypeAssertion(gen.typeNode, vParamName)))

    const func = ts.createFunctionDeclaration(
        undefined,
        [exportKeywordToken],
        undefined,
        gen.name,
        undefined,
        [vParam],
        gen.typeNode,
        ts.createBlock(statements, true)
    )

    outputTexts.push(printNode(func))
}

const complexTypes = parsedInfos.filter(p => p.kind === ParsedKind.Complex)
for (const p of complexTypes) {
    const funcName = '__check_' + p.name
    console.info(Bright + FgWhite + 'generate', FgCyan + funcName + Reset)

    const vParamName = ts.createIdentifier('v')
    const vParam = ts.createParameter(undefined, undefined, undefined, vParamName, undefined, ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword))

    const rParamName = ts.createIdentifier('r')
    const rParam = ts.createParameter(undefined, undefined, undefined, rParamName, undefined, ts.createKeywordTypeNode(ts.SyntaxKind.StringKeyword))

    const statements: ts.Statement[] = []
    for (const member of p.members) {
        const p = getParsed(member.type)!
        const value = ts.createPropertyAccess(vParamName, member.name)
        const s = createTypeCheckStatements(p, value, member.name, rParamName)
        statements.push(...s)
    }

    const func = ts.createFunctionDeclaration(
        undefined,
        [exportKeywordToken],
        undefined,
        funcName,
        undefined,
        [vParam, rParam],
        undefined,
        ts.createBlock(statements, true)
    )

    outputTexts.push(printNode(func))
}

const imports: ts.ImportDeclaration[] = []
tsJsonConfigSource.forEachChild(node => {
    if (ts.isImportDeclaration(node)) {
        imports.push(node)
    }
})

outputTexts.unshift(...imports.map(d => d.getText()))

const variables: ts.VariableDeclaration[] = []
tsJsonConfigSource.forEachChild(node => {
    if (ts.isVariableStatement(node)) {
        if ((node.declarationList.flags & ts.NodeFlags.Const) !== 0) {
            for (const dec of node.declarationList.declarations) {
                if (ts.isIdentifier(dec.name)) {
                    variables.push(dec)
                }
            }
        }
    }
})

const fileNameVariable = variables.find(v => (<ts.Identifier>v.name).text === 'fileName')
if (!fileNameVariable) throw new Error('fileName variable not found.')
if (!fileNameVariable.initializer) throw new Error('fileName variable initializer is undefined.')
if (!ts.isStringLiteral(fileNameVariable.initializer)) throw new Error('fileName variable initializer is not string literal.')
const fileName = fileNameVariable.initializer.text

console.info(Bright + FgWhite + 'output:', FgGreen + fileName + Reset)
fs.writeFileSync(fileName, outputTexts.join('\n\n'))

function createTypeCheckStatements(parsed: ParsedInfo, value: ts.Expression, name: string, root?: ts.Identifier) {
    const statements: ts.Statement[] = []

    const baseKinds = getBaseKinds(parsed)
    if (baseKinds.length > 0) {
        statements.push(createBaseKindsCheckStatement(value, baseKinds, name, root))
    }

    const complexType = getComplexType(parsed);
    if (complexType) {
        const check = ts.createStatement(ts.createCall(ts.createIdentifier('__check_' + complexType.name), undefined, [
            value,
            root ? ts.createAdd(root, ts.createStringLiteral('.' + name)) : ts.createStringLiteral(name)
        ]))

        const notCallableKinds = getNotCallableKinds(baseKinds)
        if (notCallableKinds.length > 0) {
            statements.push(ts.createIf(createBaseKindsCheckExp(value, notCallableKinds), check))
        } else {
            statements.push(check)
        }
    }

    return statements
}

function getBaseKinds(parsed: ParsedInfo, types: ParsedKind[] = []): ParsedKind[] {
    if (isBaseKind(parsed.kind)) {
        types.push(parsed.kind)
    } else if (parsed.kind === ParsedKind.Union) {
        for (const t of parsed.types) {
            getBaseKinds(getParsed(t)!, types)
        }
    } else if (parsed.kind === ParsedKind.Complex) {
        types.push(ParsedKind.Object);
    }

    return types
}

function getComplexType(parsed: ParsedInfo) {
    if (parsed.kind === ParsedKind.Complex) {
        return parsed
    } else if (parsed.kind === ParsedKind.Union) {
        for (const t of parsed.types) {
            const p = getParsed(t)!
            if (getComplexType(p)) {
                return p
            }
        }
    }
}

function createBaseKindsCheckStatement(value: ts.Expression, kinds: ParsedKind[], name: string, root?: ts.Identifier): ts.Statement {
    const errorMessage = createBaseKindsCheckErrorMessage(name, kinds)
    const errorMessageExp = root ? ts.createAdd(root, ts.createStringLiteral('.' + errorMessage)) : ts.createStringLiteral(errorMessage)
    return ts.createIf(
        createBaseKindsCheckExp(value, kinds),
        ts.createThrow(ts.createNew(typeErrorClassName, undefined, [errorMessageExp]))
    )
}

function createBaseKindsCheckErrorMessage(name: string, kinds: ParsedKind[]) {
    return name + ' is not ' + kinds.map(k => ParsedKind[k]).join(' | ') + '.'
}

function createBaseKindsCheckExp(value: ts.Expression, kinds: ParsedKind[]): ts.Expression {
    let exp: ts.Expression | undefined = undefined
    for (const kind of kinds) {
        const checkExp =
            kind === ParsedKind.Null
                ? createNullCheckExp(value)
                : createCheckTypeOfExp(value, getPrimitiveKindName(kind))

        exp =
            exp
                ? ts.createLogicalAnd(checkExp, exp)
                : checkExp
    }

    return exp!
}

function createNullCheckExp(value: ts.Expression): ts.Expression {
    return ts.createStrictInequality(value, ts.createNull())
}

function createCheckTypeOfExp(value: ts.Expression, type: string): ts.Expression {
    return ts.createStrictInequality(ts.createTypeOf(value), ts.createStringLiteral(type))
}

function getNotCallableKinds(baseKinds: ParsedKind[]) {
    return baseKinds.filter(v => v === ParsedKind.Undefined || v === ParsedKind.Null)
}

// if (DEBUG) {
//     console.log('parsed infos')
//     for (const p of parsedInfos) {
//         printParsed(p)
//     }
// }

function printParsed(p: ParsedInfo) {
    console.log(p.name, ParsedKind[p.kind], p.elementType && typeChecker.typeToString(p.elementType), p.types.map(t => typeChecker.typeToString(t)), p.members.map(m => [m.name, typeChecker.typeToString(m.type)]))
}