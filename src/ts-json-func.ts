import * as ts from 'typescript'
import { FgWhite, Reset, Bright, FgYellow, FgCyan, FgGreen, FgMagenta, FgRed } from './colors';
import { debug, info, err } from './logger'

const TSJsonCheckerName = 'ts-json-checker'

interface GenerationInfo {
    typeNode: ts.TypeNode
    name: string
}

interface ConvertInfo {
    typeNode: ts.TypeNode
    func: ts.ArrowFunction
    resultType: ts.Type
    name: string
    number: number
}

export interface GenerationParams {
    tsJsonFile: string
    configFile: string
    resolve: (fileName: string) => string | undefined
    defaultLibFileName?: string
    fixImportPath: (outputFileName: string, importPath: string) => string
    eol: "\r\n" | "\n"
}

export interface GenerationResult {
    fileName: string
    code: string
}

export function generate(params: GenerationParams): GenerationResult {
    const files = [params.tsJsonFile, params.configFile]

    const compilerOptions: ts.CompilerOptions = {
        module: ts.ModuleKind.CommonJS,
        strict: true,
        baseUrl: '.',
        paths: {
            [TSJsonCheckerName]: [params.tsJsonFile]
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

    const booleanNode = tsJsonConfigSource.forEachChild(function visit(node): ts.Node | undefined {
        if (node.kind === ts.SyntaxKind.BooleanKeyword)
            return node
        else 
            return node.forEachChild(visit)
    })

    const diagnostics =
        services
            .getCompilerOptionsDiagnostics()
            .concat(
                ...program.getSourceFiles().map(f =>
                    services
                        .getSemanticDiagnostics(f.fileName)
                        .concat(services.getSyntacticDiagnostics(f.fileName))))
    
    if (diagnostics.length > 0) {
        for (const diag of diagnostics) {
            err(Bright + FgRed + 'Error', diag.code, ':', FgWhite + ts.flattenDiagnosticMessageText(diag.messageText, servicesHost.getNewLine!()) + Reset)
        }
        throw new Error('invalid source code.')
    }

    const printer = ts.createPrinter({
        newLine: params.eol === "\r\n" ? ts.NewLineKind.CarriageReturnLineFeed : ts.NewLineKind.LineFeed
    })

    function printNode(node: ts.Node) {
        const text = printer.printNode(ts.EmitHint.Unspecified, node, tsJsonConfigSource!)
        debug(text)
        return text
    }

    debug(FgWhite + 'generate function finding...' + Reset)

    const generateFunc = getGenerateFunction(tsJsonSource)
    if (!generateFunc) throw new Error("generate function is undefined.")

    debug(FgWhite + tsJsonSource.fileName, generateFunc.name!.getStart(), generateFunc.getText() + Reset)

    const convertFunc = getConvertFunction(tsJsonSource)
    if (!convertFunc) throw new Error('convert function is undefined.')

    debug(FgWhite + tsJsonSource.fileName, convertFunc.name!.getStart(), convertFunc.getText() + Reset)

    debug(FgWhite + 'references finding...' + Reset)

    const genInfos = getGenerationInfos(services, tsJsonSource, generateFunc, program);
    if (genInfos.length === 0) {
        debug(Bright + FgYellow + "generate function not found." + Reset)
    }

    const convInfos = getConvertInfos(services, tsJsonSource, convertFunc, program, typeChecker)
    if (convInfos.length === 0) {
        debug(Bright + FgYellow + "convert function not found." + Reset)
    }

    const outputTexts: string[] = []

    const parsedInfos: ParsedInfo[] = []
    if (booleanNode) {
        parseNodeType(typeChecker, parsedInfos, convInfos, booleanNode, typeChecker.getTypeAtLocation(booleanNode))
    }

    for (const gen of genInfos) {
        const func = generateFunction(typeChecker, gen, parsedInfos, convInfos)
        outputTexts.push(printNode(func))
    }

    const complexTypes = parsedInfos.filter(p => p.kind === ParsedKind.Complex)
    for (const p of complexTypes) {
        const func = generateComplexFunction(p)
        outputTexts.push(printNode(func))
    }

    for (const conv of convInfos) {
        const func = generateConvertFunction(conv)
        outputTexts.push(printNode(func))
    }

    const variables = getConstVariables(tsJsonConfigSource);

    const fileNameVariable = variables.find(v => (<ts.Identifier>v.name).text === 'fileName')
    if (!fileNameVariable) throw new Error('fileName variable not found.')
    if (!fileNameVariable.initializer) throw new Error('fileName variable initializer is undefined.')
    if (!ts.isStringLiteral(fileNameVariable.initializer)) throw new Error('fileName variable initializer is not string literal.')
    const fileName = fileNameVariable.initializer.text

    const imports = getImports(tsJsonConfigSource)
    for (let i = 0; i < imports.length; i++) {
        const imp = imports[i]
        if (ts.isStringLiteral(imp.moduleSpecifier)) {
            if (imp.moduleSpecifier.text.startsWith('.')) {
                const p = params.fixImportPath(fileName, imp.moduleSpecifier.text)
                const s = ts.createStringLiteral(p)
                imports[i] = ts.createImportDeclaration(imp.decorators, imp.modifiers, imp.importClause, s)
            }
        }
    }
    outputTexts.unshift(...imports.map(d => printNode(d)))

    return {
        fileName: fileName,
        code: outputTexts.join(params.eol + params.eol),
    }
}



function getGenerationInfos(services: ts.LanguageService, tsJsonSource: ts.SourceFile, generateFunc: ts.FunctionDeclaration, program: ts.Program): GenerationInfo[] {
    const generateFuncRefs = services.getReferencesAtPosition(tsJsonSource.fileName, generateFunc.name!.getStart())
    if (!generateFuncRefs) throw new Error("generateFuncRefs is undefined.")

    const callers = getReferencedCallers(generateFuncRefs, program)
    return callers.map(targetFunc => {
        const typeNode = targetFunc.typeArguments![0]
        const arg0 = targetFunc.arguments[0]
        if (!ts.isStringLiteral(arg0)) throw new Error("arg0 is not string literal.")

        return {
            typeNode: typeNode,
            name: arg0.text,
        }
    })
}

function getConvertInfos(services: ts.LanguageService, tsJsonSource: ts.SourceFile, convertFunc: ts.FunctionDeclaration, program: ts.Program, typeChecker: ts.TypeChecker): ConvertInfo[] {
    const convertFuncRefs = services.getReferencesAtPosition(tsJsonSource.fileName, convertFunc.name!.getStart())
    if (!convertFuncRefs) throw new Error('convertFuncRefs is undefined.')

    const callers = getReferencedCallers(convertFuncRefs, program)
    return callers.map((targetFunc, index) => {
        const typeNode = targetFunc.typeArguments![0]
        const arg0 = targetFunc.arguments[0]
        if (!ts.isArrowFunction(arg0)) throw new Error("arg0 is not arrow function.")

        const type = typeChecker.getTypeAtLocation(typeNode)
        const typeName = typeChecker.typeToString(type)

        return {
            typeNode: typeNode,
            func: arg0,
            resultType: type,
            name: typeName,
            number: index + 1,
        }
    })
}

function getReferencedCallers(refs: ts.ReferenceEntry[], program: ts.Program) {
    const callers: ts.CallExpression[] = []

    for (const ref of refs) {
        if (!ref.isDefinition) {
            debug(FgWhite + ref.fileName, ref.textSpan.start + Reset)

            const targetFile = program.getSourceFile(ref.fileName)
            if (!targetFile) throw new Error("targetFile is undefined.")

            const targetFunc = getReferencedCallExpression(targetFile, ref)
            if (!targetFunc) throw new Error("target function is undefined.")

            debug(FgWhite + targetFunc.getText() + Reset)

            callers.push(targetFunc)
        }
    }

    return callers
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

function getConvertFunction(node: ts.Node) {
    return node.forEachChild(node => {
        if (ts.isFunctionDeclaration(node) && node.name && node.name.text === "convert") {
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
            && node.moduleSpecifier.text !== TSJsonCheckerName) {
            imports.push(node)
        }
    })
    return imports
}

function isBoolean(type: ts.Type) {
    return (type.flags & ts.TypeFlags.Boolean) !== 0
}

function isBooleanLiteral(type: ts.Type) {
    return (type.flags & ts.TypeFlags.BooleanLiteral) !== 0
}

function isNumber(type: ts.Type) {
    return (type.flags & ts.TypeFlags.Number) !== 0
}

function isNumberLiteral(type: ts.Type): type is ts.NumberLiteralType {
    return (type.flags & ts.TypeFlags.NumberLiteral) !== 0
}

function isBigInt(type: ts.Type) {
    return (type.flags & ts.TypeFlags.BigInt) !== 0
}

function isBigIntLiteral(type: ts.Type): type is ts.BigIntLiteralType {
    return (type.flags & ts.TypeFlags.BigIntLiteral) !== 0
}

function isString(type: ts.Type) {
    return (type.flags & ts.TypeFlags.String) !== 0
}

function isStringLiteral(type: ts.Type): type is ts.StringLiteralType {
    return (type.flags & ts.TypeFlags.StringLiteral) !== 0
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

function parseNodeType(typeChecker: ts.TypeChecker, parseds: ParsedInfo[], converts: ConvertInfo[], node: ts.Node, type: ts.Type): ParsedInfo {
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
        complexNumber: -1,
        literalValue: undefined
    }
    parseds.push(parsed)
    debug(FgWhite + 'parse ' + typeName + Reset)

    const convert = converts.find(c => c.resultType === type)

    if (convert) {
        debug(FgWhite + 'convertion type' + Reset)
        parsed.kind = ParsedKind.Convertion
        parsed.convert = convert
    } else if (isBoolean(type)) {
        parsed.kind = ParsedKind.Boolean
    } else if (isBooleanLiteral(type)) {
        parsed.kind = ParsedKind.BooleanLiteral
        parsed.literalValue = typeChecker.typeToTypeNode(type)!.kind === ts.SyntaxKind.TrueKeyword
    } else if (isNumber(type)) {
        parsed.kind = ParsedKind.Number
    } else if (isNumberLiteral(type)) {
        parsed.kind = ParsedKind.NumberLiteral
        parsed.literalValue = type.value
    } else if (isBigInt(type)) {
        parsed.kind = ParsedKind.BigInt
    } else if (isBigIntLiteral(type)) {
        parsed.kind = ParsedKind.BigIntLiteral
        parsed.literalValue = type.value
    } else if (isString(type)) {
        parsed.kind = ParsedKind.String
    } else if (isStringLiteral(type)) {
        parsed.kind = ParsedKind.StringLiteral
        parsed.literalValue = type.value
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
            //debug(typeChecker.typeToString(t))
            const cp = parseNodeType(typeChecker, parseds, converts, node, t)
            if (cp.kind !== ParsedKind.Boolean || !parsed.types.some(t => t.kind === ParsedKind.Boolean)) {
                if (cp.kind === ParsedKind.Array) {
                    // array before complex
                    const idx = parsed.types.findIndex(p => p.kind === ParsedKind.Complex)
                    if (idx >= 0) parsed.types.splice(idx, 0, cp)
                    else parsed.types.push(cp)
                } else if (cp.kind === ParsedKind.BooleanLiteral) {
                    // true | false -> boolean
                    const otherBoolIndex = parsed.types.findIndex(t => t.kind === ParsedKind.BooleanLiteral && t.literalValue !== cp.literalValue)
                    if (otherBoolIndex >= 0) {
                        const boolType = parseds.find(p => p.kind === ParsedKind.Boolean)
                        if (!boolType) throw new Error('boolean type not found.')
                        parsed.types[otherBoolIndex] = boolType
                    } else {
                        parsed.types.push(cp)
                    }
                } else if (cp.kind === ParsedKind.Convertion && parsed.types.some(t => t.kind === ParsedKind.Convertion)) {
                    throw new Error('unable to use multiple convertion type in union.')
                } else {
                    parsed.types.push(cp)
                }
            }
        }
    } else if (type.isClassOrInterface() || ts.isTypeLiteralNode(node)) {
        parseComplexType(parsed, parseds, converts, typeName, type, typeChecker, node)
    } else {
        const eType = getElementTypeOfArrayType(typeChecker, type)
        if (eType) {
            parsed.kind = ParsedKind.Array
            debug(FgWhite + 'array of', typeChecker.typeToString(eType) + Reset)
            parsed.elementType = parseNodeType(typeChecker, parseds, converts, node, eType)
        } else {
            debug(ts.TypeFlags[type.flags])
            throw new Error("unknown type: " + typeName)
        }
    }

    return parsed
}

enum ParsedKind {
    Number,
    BigInt,
    String,
    Boolean,
    Object,
    Undefined,
    Null,
    Any,
    NumberLiteral,
    BigIntLiteral,
    StringLiteral,
    BooleanLiteral,

    Array,
    Union,
    Complex,

    Convertion,
}

interface MemberInfo {
    name: string
    type: ParsedInfo
}

interface ParsedInfo {
    name: string
    keyType: ts.Type
    kind: ParsedKind
    elementType?: ParsedInfo
    types: ParsedInfo[]
    members: MemberInfo[]
    complexNumber: number
    literalValue?: string | boolean | number | ts.PseudoBigInt
    convert?: ConvertInfo
}

function parseComplexType(parsed: ParsedInfo, parseds: ParsedInfo[], converts: ConvertInfo[], typeName: string, type: ts.Type, typeChecker: ts.TypeChecker, node: ts.Node) {
    parsed.kind = ParsedKind.Complex
    parsed.complexNumber = parseds.filter(p => p.kind === ParsedKind.Complex).length
    info('complex type:', Bright + FgCyan + typeName + Reset)

    for (const prop of type.getProperties()) {
        const propType = typeChecker.getTypeOfSymbolAtLocation(prop, node)
        const propTypeName = typeChecker.typeToString(propType)
        info(typeName + '.' + prop.name + ':', Bright + FgGreen + propTypeName + Reset)

        if (!ts.isPropertySignature(prop.valueDeclaration)) throw new Error('not property signature')
        if (!prop.valueDeclaration.type) throw new Error('type is undefined')
        const cp = parseNodeType(typeChecker, parseds, converts, prop.valueDeclaration.type, propType)
        parsed.members.push({ name: prop.name, type: cp })
    }
}

function printParsed(p: ParsedInfo) {
    debug(p.name, ParsedKind[p.kind], p.elementType && p.elementType.name, p.types.map(t => t.name), p.members.map(m => [m.name, m.type.name]))
}

function isPrimitiveKind(kind: ParsedKind) {
    switch (kind) {
        case ParsedKind.Number:
        case ParsedKind.BigInt:
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
        case ParsedKind.BigInt: return 'bigint'
        case ParsedKind.String: return 'string'
        case ParsedKind.Boolean: return 'boolean'
        case ParsedKind.Object: return 'object'
        case ParsedKind.Undefined: return 'undefined'
        default: throw new Error('non primitive')
    }
}

function isLiteralKind(kind: ParsedKind) {
    switch (kind) {
        case ParsedKind.BooleanLiteral:
        case ParsedKind.NumberLiteral:
        case ParsedKind.StringLiteral:
        case ParsedKind.BigIntLiteral:
            return true
        default:
            return false
    }
}

const exportKeywordToken = ts.createToken(ts.SyntaxKind.ExportKeyword)
const typeErrorClassName = ts.createIdentifier('TypeError')

function generateFunction(typeChecker: ts.TypeChecker, gen: GenerationInfo, parsedInfos: ParsedInfo[], converts: ConvertInfo[]) {
    const type = typeChecker.getTypeAtLocation(gen.typeNode)
    info('generate', Bright + FgMagenta + gen.name + Reset + '<' + Bright + FgYellow + typeChecker.typeToString(type) + Reset + '>')
    const parsed = parseNodeType(typeChecker, parsedInfos, converts, gen.typeNode, type)

    const vParamName = ts.createIdentifier('v')
    const vParam = ts.createParameter(undefined, undefined, undefined, vParamName, undefined, ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword))

    printParsed(parsed)

    const statement = createTypeCheckStatement(parsed, vParamName, ts.createStringLiteral(vParamName.text))
    const castRetrun = ts.createReturn(ts.createTypeAssertion(gen.typeNode, vParamName))
    const statements = statement ? [statement, castRetrun] : [castRetrun]

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
    const funcName = getCheckComplexFunctionName(parsed)
    info(Bright + FgWhite + 'generate', FgCyan + funcName, FgWhite + 'for', FgCyan + parsed.name + Reset)

    const vParamName = ts.createIdentifier('v')
    const vParam = ts.createParameter(undefined, undefined, undefined, vParamName, undefined, ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword))

    const rParamName = ts.createIdentifier('r')
    const rParam = ts.createParameter(undefined, undefined, undefined, rParamName, undefined, ts.createKeywordTypeNode(ts.SyntaxKind.StringKeyword))

    const statements: ts.Statement[] = []
    for (const member of parsed.members) {
        const value = ts.createPropertyAccess(vParamName, member.name)
        const st = createTypeCheckStatement(member.type, value, ts.createAdd(rParamName, ts.createStringLiteral('.' + member.name)))
        if (st) statements.push(st)
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

function getCheckComplexFunctionName(parsed: ParsedInfo) {
    return '__check_' + parsed.complexNumber
}

function createTypeCheckStatement(parsed: ParsedInfo, value: ts.Expression, name: ts.Expression, arrayNest: number = 0) {
    if (parsed.kind === ParsedKind.Convertion) {
        if (!parsed.convert) throw new Error('convert is undefined.')
        return createCallConvertStatement(value, parsed.convert)
    } else {
        const info = createTypeChecks(parsed, value, name, arrayNest)
        if (info.checks.length > 0) {
            const errorMessageExp = optimizeStringConcat(
                ts.createAdd(
                    name,
                    ts.createStringLiteral(
                        ' is not '
                        + info.checks
                            .map(c => isLiteralKind(c.kind) ? getLiteralString(c.kind, c.literal) : ParsedKind[c.kind])
                            .join(' | ')
                        + '.'
                    )
                )
            )

            let st = info.checks[info.checks.length - 1]
            st.if.elseStatement =
                info.convert
                    ? createCallConvertStatement(value, info.convert)
                    : ts.createThrow(ts.createNew(typeErrorClassName, undefined, [errorMessageExp]))

            for (let i = info.checks.length - 2; i >= 0; i--) {
                info.checks[i].if.elseStatement = st.if
                st = info.checks[i]
            }

            return st.if
        }
    }

    return undefined
}

function createCallConvertStatement(value: ts.Expression, convert: ConvertInfo) {
    return ts.createStatement(
        ts.createBinary(
            value,
            ts.SyntaxKind.EqualsToken,
            ts.createCall(
                ts.createIdentifier(getConvertFunctionName(convert)),
                undefined,
                [value]
            )
        )
    )
}

function getLiteralString(kind: ParsedKind, value: any) {
    switch (kind) {
        case ParsedKind.NumberLiteral:
        case ParsedKind.StringLiteral:
        case ParsedKind.BooleanLiteral:
            return value.toString()
        case ParsedKind.BigIntLiteral:
            const bi = <ts.PseudoBigInt>value
            return (bi.negative ? '-' : '') + bi.base10Value + 'n'
        default:
            throw new Error('not literal')
    }
}

interface CheckInfo {
    if: ts.IfStatement
    kind: ParsedKind
    literal?: any
}

interface TypeCheckInfo {
    checks: CheckInfo[]
    convert?: ConvertInfo
}

function createTypeChecks(parsed: ParsedInfo, value: ts.Expression, name: ts.Expression, arrayNest: number, typeCheckInfo: TypeCheckInfo = { checks: [] }) {
    const checks = typeCheckInfo.checks
    if (parsed.kind === ParsedKind.Object) {
        checks.push({
            if: ts.createIf(
                // value !== null && typeof value === "object"
                ts.createLogicalAnd(ts.createStrictInequality(value, ts.createNull()), ts.createStrictEquality(ts.createTypeOf(value), ts.createStringLiteral(getPrimitiveKindName(parsed.kind)))),
                ts.createBlock([])
            ),
            kind: parsed.kind,
        })
    } else if (isPrimitiveKind(parsed.kind)) {
        checks.push({
            if: ts.createIf(
                ts.createStrictEquality(ts.createTypeOf(value), ts.createStringLiteral(getPrimitiveKindName(parsed.kind))),
                ts.createBlock([])
            ),
            kind: parsed.kind,
        })
    } else if (parsed.kind === ParsedKind.Null) {
        checks.push({
            if: ts.createIf(
                ts.createStrictEquality(value, ts.createNull()),
                ts.createBlock([])
            ),
            kind: parsed.kind,
        })
    } else if (isLiteralKind(parsed.kind)) {
        checks.push({
            if: ts.createIf(
                ts.createStrictEquality(value, ts.createLiteral(parsed.literalValue!)),
                ts.createBlock([])
            ),
            kind: parsed.kind,
            literal: parsed.literalValue,
        })
    } else if (parsed.kind === ParsedKind.Array) {
        if (!parsed.elementType) throw new Error('elementType is undefined')
        const index = ts.createIdentifier(['i', 'j', 'k', 'l', 'm', 'n'][arrayNest])
        const check = createTypeCheckStatement(parsed.elementType, ts.createElementAccess(value, index), ts.createAdd(ts.createAdd(ts.createAdd(name, ts.createStringLiteral('[')), index), ts.createStringLiteral(']')), arrayNest + 1)
        const forStatement =
            check
                ? ts.createFor(
                    ts.createVariableDeclarationList([ts.createVariableDeclaration(index, undefined, ts.createNumericLiteral('0'))], ts.NodeFlags.Let),
                    ts.createLessThan(index, ts.createPropertyAccess(value, 'length')),
                    ts.createPostfixIncrement(index),
                    check
                )
                : ts.createBlock([])
        checks.push({
            if: ts.createIf(
                ts.createCall(ts.createPropertyAccess(ts.createIdentifier('Array'), 'isArray'), undefined, [value]),
                forStatement
            ),
            kind: parsed.kind,
        })
    } else if (parsed.kind === ParsedKind.Complex) {
        checks.push({
            if: ts.createIf(
                // value !== null && typeof value === "object"
                ts.createLogicalAnd(ts.createStrictInequality(value, ts.createNull()), ts.createStrictEquality(ts.createTypeOf(value), ts.createStringLiteral('object'))),
                ts.createStatement(ts.createCall(ts.createIdentifier(getCheckComplexFunctionName(parsed)), undefined, [
                    value,
                    optimizeStringConcat(name)
                ]))
            ),
            kind: ParsedKind.Object,
        })
    } else if (parsed.kind === ParsedKind.Union) {
        for (const p of parsed.types) {
            createTypeChecks(p, value, name, arrayNest, typeCheckInfo)
        }
    } else if (parsed.kind === ParsedKind.Any) {
    } else if (parsed.kind === ParsedKind.Convertion) {
        if (!parsed.convert) throw new Error('convert is undefined.')
        if (typeCheckInfo.convert) throw new Error('convert already exists')
        typeCheckInfo.convert = parsed.convert
    } else {
        throw new Error('not supported kind:' + ParsedKind[parsed.kind])
    }

    return typeCheckInfo
}

function optimizeStringConcat(exp: ts.Expression) {
    if (ts.isBinaryExpression(exp) && exp.operatorToken.kind === ts.SyntaxKind.PlusToken) {
        if (ts.isBinaryExpression(exp.left)) {
            exp.left = optimizeStringConcat(exp.left)
        }

        if (ts.isBinaryExpression(exp.right)) {
            exp.right = optimizeStringConcat(exp.right)
        }

        if (ts.isBinaryExpression(exp.left) && ts.isStringLiteral(exp.left.right) && ts.isStringLiteral(exp.right)) {
            exp = ts.createAdd(exp.left.left, ts.createStringLiteral(exp.left.right.text + exp.right.text))
        }

        if (ts.isBinaryExpression(exp) && ts.isStringLiteral(exp.left) && ts.isStringLiteral(exp.right)) {
            exp = ts.createStringLiteral(exp.left.text + exp.right.text)
        }
    }
    return exp
}

function generateConvertFunction(convert: ConvertInfo) {
    const funcName = getConvertFunctionName(convert)
    info(Bright + FgWhite + 'generate', FgCyan + funcName, FgWhite + 'for', FgCyan + convert.name + Reset)

    const body =
        ts.isBlock(convert.func.body)
            ? convert.func.body
            : ts.createBlock([
                ts.createReturn(convert.func.body)
            ])

    const vParamName = ts.createIdentifier('v')
    const vParam = ts.createParameter(undefined, undefined, undefined, vParamName, undefined, ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword))

    return ts.createFunctionDeclaration(
        undefined,
        undefined,
        undefined,
        funcName,
        undefined,
        [vParam],
        convert.typeNode,
        body
    )
}

function getConvertFunctionName(convert: ConvertInfo) {
    return '__convert_' + convert.number
}