import * as g from "../sample/outputs/generated";

enum BasicType {
    number,
    bigint,
    string,
    boolean,
    object,
    undefined,
    null,
    any,
    M,
    X,
}

const basicFuncs = [
    { type: BasicType.number, func: g.parseN },
    { type: BasicType.bigint, func: g.parseI },
    { type: BasicType.string, func: g.parseS },
    { type: BasicType.boolean, func: g.parseB },
    { type: BasicType.object, func: g.parseO },
    { type: BasicType.undefined, func: g.parseD },
    { type: BasicType.null, func: g.parseU },
    { type: BasicType.any, func: g.parseY },
    { type: BasicType.M, func: g.parseM },
    { type: BasicType.X, func: g.parseX },
]

type M = ReturnType<typeof g.parseM>
const createM = (edit?: (m: M) => void): M => {
    const m: M = {
        n: 1,
        s: 'a',
        b: true,
        u: null,
        d: undefined,
        a: 1,
        na: [1],
        sa: ['a'],
        ba: [true],
        ua: [null],
        da: [undefined],
        nad: [1],
        nd: 1,
        sd: 'a',
        bd: true,
        ud: null,
        x: { n2: 1, xa: [] },
        xd: { n2: 1, xa: [] },
        xud: { n2: 1, xa: [] },
        xa: [{ n2: 1, xa: [] }],
        tl: { n: 1 },
        date: new Date(2000, 1, 1),
        dateD: new Date(2001, 1, 1),
    }
    if (edit) edit(m)
    return m
}

type X = ReturnType<typeof g.parseX>
const createX = (edit?: (x: X) => void): X => {
    const x = {
        n2: 1,
        xa: [{ n2: 1, xa: [] }],
    }
    if (edit) edit(x)
    return x
}

const inputPatterns = [
    { type: BasicType.number, value: () => 1 },
    { type: BasicType.bigint, value: () => 123n },
    { type: BasicType.string, value: () => 'a' },
    { type: BasicType.boolean, value: () => true },
    { type: BasicType.object, value: () => ({}) },
    { type: BasicType.undefined, value: () => undefined },
    { type: BasicType.null, value: () => null },
    { type: BasicType.M, value: createM, isObject: true },
    { type: BasicType.X, value: createX, isObject: true },
]

type InputPattern = typeof inputPatterns[0]

function testBasicInputs(name: string, isCorrect: (p: InputPattern) => boolean, isArrayCorrect: (p: InputPattern) => boolean, func: (p: InputPattern) => Function, value: (p: InputPattern) => any) {
    for (const p of inputPatterns) {
        if (isCorrect(p)) {
            test('[Correct] ' + name + ' <- ' + BasicType[p.type], () => expect(func(p)(value(p))).toEqual(p.value()))
        } else {
            test('[Error]   ' + name + ' <- ' + BasicType[p.type], () => expect(() => func(p)(value(p))).toThrow())
        }

        if (isArrayCorrect(p)) {
            test('[Correct] ' + name + ' <- ' + BasicType[p.type] + '[]', () => expect(func(p)([value(p)])).toEqual([p.value()]))
        } else {
            test('[Error]   ' + name + ' <- ' + BasicType[p.type] + '[]', () => expect(() => func(p)([value(p)])).toThrow())
        }
    }
}


for (const bf of basicFuncs) {
    testBasicInputs(
        BasicType[bf.type],
        p => p.type === bf.type || bf.type === BasicType.any || (bf.type === BasicType.object && !!p.isObject),
        p => [BasicType.object, BasicType.any].some(t => t === bf.type),
        p => bf.func,
        p => p.value()
    )
}

function testComplex<T>(typeName: string, create: (edit?: (v: T) => void) => T, parse: (v: T) => T, name: string, key: keyof T, isCorrect: (p: InputPattern) => boolean, isArrayCorrect: (p: InputPattern) => boolean) {
    for (const p of inputPatterns) {
        const getValue = () => create(m => m[key] = p.value() as any)
        const getArrayValue = () => create(m => m[key] = [p.value()] as any)

        if (isCorrect(p)) {
            test('[Correct] ' + typeName + '.' + key + '(' + name + ') <- ' + BasicType[p.type], () => expect(parse(getValue())).toEqual(getValue()))
        } else {
            test('[Error]   '  + typeName + '.' + key + '(' + name + ') <- ' + BasicType[p.type], () => expect(() => parse(getValue())).toThrow())
        }

        if (isArrayCorrect(p)) {
            test('[Correct] ' + typeName + '.' + key + '(' + name + ') <- ' + BasicType[p.type] + '[]', () => expect(parse(getArrayValue())).toEqual(getArrayValue()))
        } else {
            test('[Error]   ' + typeName + '.' + key + '(' + name + ') <- ' + BasicType[p.type] + '[]', () => expect(() => parse(getArrayValue())).toThrow())
        }
    }
}

function testM(name: string, key: keyof M, isCorrect: (p: InputPattern) => boolean, isArrayCorrect: (p: InputPattern) => boolean) {
    testComplex('M', createM, g.parseM, name, key, isCorrect, isArrayCorrect)
}

function testX(name: string, key: keyof X, isCorrect: (p: InputPattern) => boolean, isArrayCorrect: (p: InputPattern) => boolean) {
    testComplex('X', createX, g.parseX, name, key, isCorrect, isArrayCorrect)
}

test('parse M', () => expect(() => g.parseM(createM())).not.toThrow())

testM('number', 'n', p => [BasicType.number].some(t => t === p.type), p => false)
testM('string', 's', p => [BasicType.string].some(t => t === p.type), p => false)
testM('boolean', 'b', p => [BasicType.boolean].some(t => t === p.type), p => false)
testM('null', 'u', p => [BasicType.null].some(t => t === p.type), p => false)
testM('undefined', 'd', p => [BasicType.undefined].some(t => t === p.type), p => false)
testM('number[]', 'na', p => false, p => [BasicType.number].some(t => t === p.type))
testM('string[]', 'sa', p => false, p => [BasicType.string].some(t => t === p.type))
testM('boolean[]', 'ba', p => false, p => [BasicType.boolean].some(t => t === p.type))
testM('null[]', 'ua', p => false, p => [BasicType.null].some(t => t === p.type))
testM('undefined[]', 'da', p => false, p => [BasicType.undefined].some(t => t === p.type))
testM('number[] | undefined', 'nad', p => [BasicType.undefined].some(t => t === p.type), p => [BasicType.number].some(t => t === p.type))
testM('number | undefined', 'nd', p => [BasicType.number, BasicType.undefined].some(t => t === p.type), p => false)
testM('string | undefined', 'sd', p => [BasicType.string, BasicType.undefined].some(t => t === p.type), p => false)
testM('boolean | undefined', 'bd', p => [BasicType.boolean, BasicType.undefined].some(t => t === p.type), p => false)
testM('null | undefined', 'ud', p => [BasicType.null, BasicType.undefined].some(t => t === p.type), p => false)
testM('X', 'x', p => [BasicType.X].some(t => t === p.type), p => false)
testM('X | undefined', 'xd', p => [BasicType.X, BasicType.undefined].some(t => t === p.type), p => false)
testM('X | null | undefined', 'xud', p => [BasicType.X, BasicType.null, BasicType.undefined].some(t => t === p.type), p => false)
testM('X[]', 'xa', p => false, p => [BasicType.X].some(t => t === p.type))
testM('{n:number}', 'tl', p => [BasicType.M].some(t => t === p.type), p => false)
testM('Date', 'date', p => false, p => false)
testM('Date | undefined', 'dateD', p => [BasicType.undefined].some(t => t === p.type), p => false)

testX('number', 'n2', p => [BasicType.number].some(t => t === p.type), p => false)
testX('X | undefined', 'xd', p => [BasicType.X, BasicType.undefined].some(t => t === p.type), p => false)
testX('X[]', 'xa', p => false, p => [BasicType.X].some(t => t === p.type))

const arrayFuncs = [
    { type: BasicType.number, func: g.parseNA },
    { type: BasicType.string, func: g.parseSA },
    { type: BasicType.boolean, func: g.parseBA },
    { type: BasicType.object, func: g.parseOA },
    { type: BasicType.undefined, func: g.parseDA },
    { type: BasicType.null, func: g.parseUA },
    { type: BasicType.any, func: g.parseYA },
    { type: BasicType.M, func: g.parseMA },
]

for (const bf of arrayFuncs) {
    testBasicInputs(
        BasicType[bf.type] + '[]',
        p => false,
        p => p.type === bf.type || bf.type === BasicType.any || (bf.type === BasicType.object && !!p.isObject),
        p => bf.func,
        p => p.value(),
    )
}

for (const p of inputPatterns) {
    test('[Error]   ' + 'number[][] <- ' + BasicType[p.type], () => expect(() => g.parseNAA(p.value())).toThrow())
    test('[Error]   ' + 'number[][] <- ' + BasicType[p.type] + '[]', () => expect(() => g.parseNAA([p.value()])).toThrow())

    if (p.type === BasicType.number) {
        test('[Correct] ' + 'number[][] <- number[][]', () => expect(g.parseNAA([[p.value()]])).toEqual([[p.value()]]))
    } else {
        test('[Error]   ' + 'number[][] <- ' + BasicType[p.type] + '[][]', () => expect(() => g.parseNAA([[p.value()]])).toThrow())
    }
}

testBasicInputs(
    'number | string | boolean | null | undefined',
    p => [BasicType.number, BasicType.string, BasicType.boolean, BasicType.null, BasicType.undefined].some(t => t === p.type),
    p => false,
    p => g.parseNSBUD,
    p => p.value(),
)

const date = new Date(2000, 1, 1)
test("parse date", () => expect(g.parseDate(date.toISOString())).toEqual(date))
test("parse invalid date", () => expect(() => g.parseDate('invalid')).toThrow())

testBasicInputs(
    'null | number[] | X | undefined',
    p => [BasicType.null, BasicType.undefined, BasicType.X].some(t => t === p.type),
    p => [BasicType.number].some(t => t === p.type),
    p => g.parseUNAXD,
    p => p.value(),
)

for (const p of inputPatterns) {
    if (p.type === BasicType.number) {
        test('[Correct] ' + 'null | number[] | X | undefined <- ' + BasicType[p.type] + '[]', () => expect(g.parseUNAXD([p.value()])).toEqual([p.value()]))
    } else {
        test('[Error]   ' + 'null | number[] | X | undefined <- ' + BasicType[p.type] + '[]', () => expect(() => g.parseUNAXD([p.value()])).toThrow())
    }
}

testBasicInputs(
    'M | null',
    p => [BasicType.null, BasicType.M].some(t => t === p.type),
    p => false,
    p => g.parseMU,
    p => p.value(),
)

testBasicInputs(
    'X | undefined',
    p => [BasicType.undefined, BasicType.X].some(t => t === p.type),
    p => false,
    p => g.parseXD,
    p => p.value(),
)

testBasicInputs(
    '(number[] | X)[] | X',
    p => [BasicType.X].some(t => t === p.type),
    p => [BasicType.X].some(t => t === p.type),
    p => g.parseXAX,
    p => p.value(),
)

test('[Error]   ' + "(number[] | X)[] | X <- ([number, string])[]", () => expect(() => g.parseXAX([[1, 'a']])).toThrow())

testBasicInputs(
    '{x: number}',
    p => false,
    p => false,
    p => g.parseTL,
    p => p.value(),
)

test('[Correct] ' + '{x: number} <- {x: number}', () => expect(g.parseTL({ x: 1 })).toEqual({ x: 1 }))

testBasicInputs(
    '"abc"',
    p => false,
    p => false,
    p => g.parseSL,
    p => p.value(),
)

test('[Correct] ' + '"abc" <- "abc"', () => expect(g.parseSL("abc")).toEqual("abc"))

testBasicInputs(
    '"abc" | "xyz"',
    p => false,
    p => false,
    p => g.parseSL2,
    p => p.value(),
)

test('[Correct] ' + '"abc" | "xyz" <- "abc"', () => expect(g.parseSL2("abc")).toEqual("abc"))
test('[Correct] ' + '"abc" | "xyz" <- "xyz"', () => expect(g.parseSL2("xyz")).toEqual("xyz"))

testBasicInputs(
    '1',
    p => p.type === BasicType.number,
    p => false,
    p => g.parseNL,
    p => p.value(),
)

test('[Correct] ' + '1 <- 1', () => expect(g.parseNL(1)).toEqual(1))

testBasicInputs(
    '1',
    p => p.type === BasicType.number,
    p => false,
    p => g.parseNL2,
    p => p.value(),
)

test('[Correct] ' + '1 | 2 <- 1', () => expect(g.parseNL2(1)).toEqual(1))
test('[Correct] ' + '1 | 2 <- 2', () => expect(g.parseNL2(2)).toEqual(2))
test('[Error]   ' + '1 | 2 <- 3', () => expect(() => g.parseNL2(3)).toThrow())

testBasicInputs(
    'true',
    p => p.type === BasicType.boolean,
    p => false,
    p => g.parseBL,
    p => p.value(),
)

test('[Error]   ' + 'true <- false', () => expect(() => g.parseBL(false)).toThrow())

testBasicInputs(
    'true | false',
    p => p.type === BasicType.boolean,
    p => false,
    p => g.parseBL2,
    p => p.value(),
)

test('[Correct] ' + 'true <- false', () => expect(g.parseBL2(false)).toEqual(false))

testBasicInputs(
    '"abc" | 1 | true',
    p => [BasicType.boolean, BasicType.number].some(t => t === p.type),
    p => false,
    p => g.parseL,
    p => p.value(),
)

test('[Correct] ' + '"abc" | 1 | true <- "abc"', () => expect(g.parseL("abc")).toEqual("abc"))
test('[Error]   ' + '"abc" | 1 | true <- 2', () => expect(() => g.parseL(2)).toThrow())
test('[Error]   ' + '"abc" | 1 | true <- false', () => expect(() => g.parseL(false)).toThrow())

testBasicInputs(
    '{c:{n:number}}',
    p => false,
    p => false,
    p => g.parseTLTL,
    p => p.value(),
)

test('[Correct] ' + '{c:{n:number}} <- {c:{n:number}}', () => expect(g.parseTLTL({ c: { n: 1 } })).toEqual({ c: { n: 1 } }))
test('[Error]   ' + '{c:{n:number}} <- {c:{n:string}}', () => expect(() => g.parseTLTL({ c: { n: 'a' } })).toThrow())
