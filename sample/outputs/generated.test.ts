import * as g from "./generated";

enum BasicType {
    number,
    string,
    boolean,
    object,
    undefined,
    null,
    complex,
}

const basicFuncs = [
    { type: BasicType.number, func: g.parseN },
    { type: BasicType.string, func: g.parseS },
    { type: BasicType.boolean, func: g.parseB },
    { type: BasicType.object, func: g.parseO },
    { type: BasicType.undefined, func: g.parseD },
    { type: BasicType.null, func: g.parseU },
    { type: BasicType.complex, func: g.parseM },
]

const inputPatterns = [
    { type: BasicType.number, value: 1 },
    { type: BasicType.string, value: 'a' },
    { type: BasicType.boolean, value: true },
    { type: BasicType.object, value: {} },
    { type: BasicType.undefined, value: undefined },
    { type: BasicType.null, value: null },
]

for (const bf of basicFuncs) {
    for (const p of inputPatterns) {
        if (p.type === bf.type) {
            test('[Correct] ' + BasicType[bf.type] + ' with ' + BasicType[p.type], () => expect(bf.func(p.value)).toBe(p.value))
        } else {
            test('[Error]   ' + BasicType[bf.type] + ' with ' + BasicType[p.type], () => expect(() => bf.func(p.value)).toThrow())
        }
    }
}

const arrayFuncs = [
    { type: BasicType.number, func: g.parseNA },
    { type: BasicType.string, func: g.parseSA },
    { type: BasicType.boolean, func: g.parseBA },
    { type: BasicType.object, func: g.parseOA },
    { type: BasicType.undefined, func: g.parseDA },
    { type: BasicType.null, func: g.parseUA },
    { type: BasicType.complex, func: g.parseMA },
]

for (const bf of arrayFuncs) {
    for (const p of inputPatterns) {
        test('[Error]   ' + BasicType[bf.type] + '[] with ' + BasicType[p.type], () => expect(() => bf.func(p.value)).toThrow())

        if (p.type === bf.type) {
            test('[Correct] ' + BasicType[bf.type] + '[] with ' + BasicType[p.type] + '[]', () => expect(bf.func([p.value])).toEqual([p.value]))
        } else {
            test('[Error]   ' + BasicType[bf.type] + '[] with ' + BasicType[p.type] + '[]', () => expect(() => bf.func([p.value])).toThrow())
        }
    }
}

for (const p of inputPatterns) {
    test('[Error]   ' + 'number[][] with ' + BasicType[p.type], () => expect(() => g.parseNAA(p.value)).toThrow())
    test('[Error]   ' + 'number[][] with ' + BasicType[p.type] + '[]', () => expect(() => g.parseNAA([p.value])).toThrow())

    if (p.type === BasicType.number) {
        test('[Correct] ' + 'number[][] with number[][]', () => expect(g.parseNAA([[p.value]])).toEqual([[p.value]]))
    } else {
        test('[Error]   ' + 'number[][] with ' + BasicType[p.type] + '[][]', () => expect(() => g.parseNAA([[p.value]])).toThrow())
    }
}

for (const p of inputPatterns) {
    if ([BasicType.number, BasicType.string, BasicType.boolean, BasicType.null, BasicType.undefined].some(t => t === p.type)) {
        test('[Correct] ' + 'number | string | boolean | null | undefined with ' + BasicType[p.type], () => expect(g.parseNSBUD(p.value)).toEqual(p.value))
    } else {
        test('[Error]   ' + 'number | string | boolean | null | undefined with ' + BasicType[p.type], () => expect(() => g.parseNSBUD(p.value)).toThrow())
    }
}

const date = new Date(2000, 1, 1)
test("parse date", () => expect(g.parseDate(date.toISOString())).toEqual(date))

//test("number", () => expect(g.parseN(0)).toBe(0))
//test("not number", () => expect(() => g.parseN('a')).toThrow())

// let json = JSON.parse('{ "n": 1, "s": "a", "b": true, "u": null, "x": { "n": 1 } }');
// let v = parseT(json);

// let r = parseX({});
