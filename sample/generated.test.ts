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
            test(BasicType[bf.type] + ' with ' + BasicType[p.type], () => expect(bf.func(p.value)).toBe(p.value))
        } else {
            test(BasicType[bf.type] + ' with ' + BasicType[p.type], () => expect(() => bf.func(p.value)).toThrow())
        }
    }
}

//test("number", () => expect(g.parseN(0)).toBe(0))
//test("not number", () => expect(() => g.parseN('a')).toThrow())

// let json = JSON.parse('{ "n": 1, "s": "a", "b": true, "u": null, "x": { "n": 1 } }');
// let v = parseT(json);

// let r = parseX({});
