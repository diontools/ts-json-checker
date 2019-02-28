import * as g from "./generated";

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
]

const createM = (): ReturnType<typeof g.parseM> => ({
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
    x: { n2: 1, xa: [] },
    xa: [],
    tl: { n: 1 },
    date: new Date(2000, 1, 1),
})

const createX = (): ReturnType<typeof g.parseXD> => ({
    n2: 1,
    xa: [{ n2: 1, xa: [] }],
})

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

test('parse M', () => expect(() => g.parseM(createM())).not.toThrow())

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
