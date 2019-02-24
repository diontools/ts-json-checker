import * as ts from 'typescript'
import { FgWhite, Reset, Bright, FgYellow, FgCyan, FgGreen, FgMagenta } from './colors';

interface GenerationInfo {
    typeNode: ts.TypeNode
    name: string
}

export interface GenerationParams {
    tsJsonFile: string
    configFile: string
    resolve: (fileName: string) => string | undefined
    defaultLibFileName?: string
    eol: "\r\n" | "\n"
}

export interface GenerationResult {
    fileName: string
    code: string
}

const printingSource = ts.createSourceFile(
    'printing',
    '',
    ts.ScriptTarget.ES5,
    false,
    ts.ScriptKind.TS
)

export function generate(params: GenerationParams): GenerationResult {
    const printer = ts.createPrinter({
        newLine: params.eol === "\r\n" ? ts.NewLineKind.CarriageReturnLineFeed : ts.NewLineKind.LineFeed
    })

    function printNode(node: ts.Node) {
        const text = printer.printNode(ts.EmitHint.Unspecified, node, printingSource)
        console.log(text)
        return text
    }

    const files = [params.tsJsonFile, params.configFile]

    const compilerOptions: ts.CompilerOptions = {
        module: ts.ModuleKind.CommonJS,
        strict: true,
        baseUrl: '.',
        paths: {
            'ts-json': ['./src/ts-json']
        }
    }

    const servicesHost: ts.LanguageServiceHost = {
        getScriptFileNames: () => files,
        getScriptVersion: fileName => fileName,
        getScriptSnapshot: fileName => {
            const v = params.resolve(fileName)
            return v ? ts.ScriptSnapshot.fromString(v) : undefined
            // if (!fs.existsSync(fileName)) return undefined
            // return ts.ScriptSnapshot.fromString(fs.readFileSync(fileName).toString())
        },
        getCurrentDirectory: () => "",
        getCompilationSettings: () => compilerOptions,
        getDefaultLibFileName: options => params.defaultLibFileName || ts.getDefaultLibFilePath(options),
        getNewLine: () => params.eol,
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

    const tsJsonSource = program.getSourceFile(params.tsJsonFile)
    if (!tsJsonSource) throw new Error("tsJsonSource is undefined.")

    const tsJsonConfigSource = program.getSourceFile(params.configFile)
    if (!tsJsonConfigSource) throw new Error("tsJsonConfigSource is undefined.")

    for (const diag of services.getCompilerOptionsDiagnostics()) {
        console.log(diag)
    }

    console.log(FgWhite + 'generate function finding...' + Reset)

    const generateFunc = getGenerateFunction(tsJsonSource)
    if (!generateFunc) throw new Error("generate function is undefined.")

    console.log(FgWhite + tsJsonSource.fileName, generateFunc.name!.getStart(), generateFunc.getText() + Reset)

    console.log(FgWhite + 'references finding...' + Reset)

    const refs = services.getReferencesAtPosition(tsJsonSource.fileName, generateFunc.name!.getStart())
    if (!refs) throw new Error("refs is undefined.")

    const genInfos = getGenerationInfos(refs, program);
    if (genInfos.length === 0) {
        console.log(Bright + FgYellow + "generate function not found." + Reset)
    }

    const outputTexts: string[] = []
    outputTexts.push(printNode(typeErrorClass))

    const parsedInfos: ParsedInfo[] = []
    for (const gen of genInfos) {
        const func = generateFunction(typeChecker, gen, parsedInfos)
        outputTexts.push(printNode(func))
    }

    const complexTypes = parsedInfos.filter(p => p.kind === ParsedKind.Complex)
    for (const p of complexTypes) {
        const func = generateComplexFunction(p)
        outputTexts.push(printNode(func))
    }

    const imports = getImports(tsJsonConfigSource);
    outputTexts.unshift(...imports.map(d => d.getText()))

    const variables = getConstVariables(tsJsonConfigSource);

    const fileNameVariable = variables.find(v => (<ts.Identifier>v.name).text === 'fileName')
    if (!fileNameVariable) throw new Error('fileName variable not found.')
    if (!fileNameVariable.initializer) throw new Error('fileName variable initializer is undefined.')
    if (!ts.isStringLiteral(fileNameVariable.initializer)) throw new Error('fileName variable initializer is not string literal.')
    const fileName = fileNameVariable.initializer.text

    return {
        fileName: fileName,
        code: outputTexts.join(params.eol + params.eol),
    }
}



function getGenerationInfos(refs: ts.ReferenceEntry[], program: ts.Program) {
    const genInfos: GenerationInfo[] = []

    for (const ref of refs) {
        if (!ref.isDefinition) {
            console.log(FgWhite + ref.fileName, ref.textSpan.start + Reset)

            const targetFile = program.getSourceFile(ref.fileName)
            if (!targetFile) throw new Error("targetFile is undefined.")

            const targetFunc = getReferencedCallExpression(targetFile, ref)
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

    return genInfos
}

function getReferencedCallExpression(node: ts.Node, ref: ts.ReferenceEntry) {
    return node.forEachChild(function visitor(n: ts.Node): ts.CallExpression | undefined {
        if (ref.textSpan.start === n.getStart() && ts.isCallExpression(n)) {
            return n
        }
        return n.forEachChild(visitor)
    });
}

function getGenerateFunction(node: ts.Node) {
    return node.forEachChild(node => {
        if (ts.isFunctionDeclaration(node) && node.name && node.name.text === "generate") {
            return node
        }
    })
}

function getConstVariables(node: ts.Node) {
    const variables: ts.VariableDeclaration[] = []
    node.forEachChild(node => {
        if (ts.isVariableStatement(node)) {
            if ((node.declarationList.flags & ts.NodeFlags.Const) !== 0) {
                for (const dec of node.declarationList.declarations) {
                    if (ts.isIdentifier(dec.name)) {
                        variables.push(dec)
                    }
                }
            }
        }
    });
    return variables
}

function getImports(node: ts.Node) {
    const imports: ts.ImportDeclaration[] = []
    node.forEachChild(node => {
        if (ts.isImportDeclaration(node)
            && ts.isStringLiteral(node.moduleSpecifier)
            && node.moduleSpecifier.text !== "ts-json") {
            imports.push(node)
        }
    })
    return imports
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

function getElementTypeOfArrayType(typeChecker: ts.TypeChecker, type: ts.Type): ts.Type | undefined {
    return (typeChecker as any).getElementTypeOfArrayType(type)
}

function parseNodeType(typeChecker: ts.TypeChecker, parseds: ParsedInfo[], node: ts.Node, type: ts.Type): ParsedInfo {
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
        for (const t of type.types) {
            //console.log(typeChecker.typeToString(t))
            const cp = parseNodeType(typeChecker, parseds, node, t)
            parsed.types.push(cp)
        }
    } else if (type.isClassOrInterface()) {
        parsed.kind = ParsedKind.Complex
        console.info('complex type:', Bright + FgCyan + typeName + Reset)

        for (const prop of type.getProperties()) {
            const propType = typeChecker.getTypeOfSymbolAtLocation(prop, node)
            const propTypeName = typeChecker.typeToString(propType)
            console.info(typeName + '.' + prop.name + ':', Bright + FgGreen + propTypeName + Reset)
            const cp = parseNodeType(typeChecker, parseds, prop.valueDeclaration, propType)
            parsed.members.push({ name: prop.name, type: cp })
        }
    } else {
        const eType = getElementTypeOfArrayType(typeChecker, type)
        if (eType) {
            parsed.kind = ParsedKind.Array
            parsed.elementType = eType
            console.log(FgWhite + 'array of', typeChecker.typeToString(eType) + Reset)
            parseNodeType(typeChecker, parseds, node, eType)
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
    type: ParsedInfo
}

interface ParsedInfo {
    name: string
    keyType: ts.Type
    kind: ParsedKind
    elementType?: ts.Type
    types: ParsedInfo[]
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


function generateFunction(typeChecker: ts.TypeChecker, gen: GenerationInfo, parsedInfos: ParsedInfo[]) {
    const type = typeChecker.getTypeAtLocation(gen.typeNode)
    console.info('generate', Bright + FgMagenta + gen.name + Reset + '<' + Bright + FgYellow + typeChecker.typeToString(type) + Reset + '>')
    const parsed = parseNodeType(typeChecker, parsedInfos, gen.typeNode, type)

    const vParamName = ts.createIdentifier('v')
    const vParam = ts.createParameter(undefined, undefined, undefined, vParamName, undefined, ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword))

    printParsed(typeChecker, parsed)

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

    return func
}

function generateComplexFunction(parsed: ParsedInfo) {
    const funcName = '__check_' + parsed.name
    console.info(Bright + FgWhite + 'generate', FgCyan + funcName + Reset)

    const vParamName = ts.createIdentifier('v')
    const vParam = ts.createParameter(undefined, undefined, undefined, vParamName, undefined, ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword))

    const rParamName = ts.createIdentifier('r')
    const rParam = ts.createParameter(undefined, undefined, undefined, rParamName, undefined, ts.createKeywordTypeNode(ts.SyntaxKind.StringKeyword))

    const statements: ts.Statement[] = []
    for (const member of parsed.members) {
        const value = ts.createPropertyAccess(vParamName, member.name)
        createTypeCheckStatements(member.type, value, member.name, rParamName, statements)
    }

    const func = ts.createFunctionDeclaration(
        undefined,
        undefined,
        undefined,
        funcName,
        undefined,
        [vParam, rParam],
        undefined,
        ts.createBlock(statements, true)
    )

    return func
}

function createTypeCheckStatements(parsed: ParsedInfo, value: ts.Expression, name: string, root?: ts.Identifier, statements: ts.Statement[] = []) {
    const checks = createTypeChecks(parsed, value, name, root)
    if (checks.length > 0) {
        const errorMessageExp = createNameWithRoot(name + ' is not ' + checks.map(c => ParsedKind[c.kind]).join(' | ') + '.', root)

        let st = checks[checks.length - 1]
        st.if.elseStatement = ts.createThrow(ts.createNew(typeErrorClassName, undefined, [errorMessageExp]))

        for (let i = checks.length - 2; i >= 0; i--) {
            checks[i].if.elseStatement = st.if
            st = checks[i]
        }

        statements.push(st.if)
    }

    return statements
}

function createTypeChecks(parsed: ParsedInfo, value: ts.Expression, name: string, root?: ts.Identifier, checks: { if: ts.IfStatement, kind: ParsedKind }[] = []) {
    if (isPrimitiveKind(parsed.kind)) {
        checks.push({
            if: ts.createIf(
                ts.createStrictEquality(ts.createTypeOf(value), ts.createStringLiteral(getPrimitiveKindName(parsed.kind))),
                ts.createBlock([])
            ),
            kind: parsed.kind,
        })
    } else if (parsed.kind === ParsedKind.Array) {
        checks.push({
            if: ts.createIf(
                ts.createCall(ts.createPropertyAccess(ts.createIdentifier('Array'), 'isArray'), undefined, [value]),
                ts.createBlock([])
            ),
            kind: parsed.kind,
        })
    } else if (parsed.kind === ParsedKind.Complex) {
        checks.push({
            if: ts.createIf(
                ts.createStrictEquality(ts.createTypeOf(value), ts.createStringLiteral('object')),
                ts.createBlock([
                    ts.createStatement(ts.createCall(ts.createIdentifier('__check_' + parsed.name), undefined, [
                        value,
                        createNameWithRoot(name, root)
                    ]))
                ])
            ),
            kind: ParsedKind.Object,
        })
    } else if (parsed.kind === ParsedKind.Union) {
        for (const p of parsed.types) {
            createTypeChecks(p, value, name, root, checks)
        }
    }

    return checks
}

function createNameWithRoot(name: string, root?: ts.Identifier): ts.Expression {
    return root ? ts.createAdd(root, ts.createStringLiteral('.' + name)) : ts.createStringLiteral(name)
}

function printParsed(typeChecker: ts.TypeChecker, p: ParsedInfo) {
    console.log(p.name, ParsedKind[p.kind], p.elementType && typeChecker.typeToString(p.elementType), p.types.map(t => t.name), p.members.map(m => [m.name, m.type.name]))
}