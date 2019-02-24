import { T as M, X } from './types'

export class TypeError implements Error {
    public name = "TypeError";
    constructor(public message: string) { }
    toString() { return this.name + ": " + this.message; }
}

export function parseN(v: any): number {
    if (typeof v !== "number")
        throw new TypeError("v is not Number.");
    return <number>v;
}

export function parseO(v: any): object {
    if (typeof v !== "object")
        throw new TypeError("v is not Object.");
    return <object>v;
}

export function parseNSD(v: any): number | string | undefined {
    if (typeof v !== "undefined" && (typeof v !== "string" && typeof v !== "number"))
        throw new TypeError("v is not Number | String | Undefined.");
    return <number | string | undefined>v;
}

export function parseNUD(v: any): number | null | undefined {
    if (typeof v !== "undefined" && (v !== null && typeof v !== "number"))
        throw new TypeError("v is not Number | Null | Undefined.");
    return <number | null | undefined>v;
}

export function parseNA(v: any): number[] {
    if (!Array.isArray(v))
        throw new TypeError("v is not Array.");
    return <number[]>v;
}

export function parseM(v: any): M {
    if (typeof v !== "object")
        throw new TypeError("v is not Object.");
    __check_T(v, "v");
    return <M>v;
}

export function parseT(v: any): M | null {
    if (v !== null && typeof v !== "object")
        throw new TypeError("v is not Object | Null.");
    if (v !== null)
        __check_T(v, "v");
    return <M | null>v;
}

export function parseX(v: any): X | undefined {
    if (typeof v !== "undefined" && typeof v !== "object")
        throw new TypeError("v is not Object | Undefined.");
    if (typeof v !== "undefined")
        __check_X(v, "v");
    return <X | undefined>v;
}

export function parseNSA(v: any): (number | string)[] | undefined | X {
    if (typeof v !== "undefined" && (typeof v !== "object" && !Array.isArray(v)))
        throw new TypeError("v is not Array | Object | Undefined.");
    if (typeof v !== "undefined")
        __check_X(v, "v");
    return <(number | string)[] | undefined | X>v;
}

function __check_T(v: any, r: string) {
    if (typeof v.n !== "number")
        throw new TypeError(r + ".n is not Number.");
    if (typeof v.s !== "string")
        throw new TypeError(r + ".s is not String.");
    if (typeof v.b !== "boolean")
        throw new TypeError(r + ".b is not Boolean.");
    if (v.u !== null)
        throw new TypeError(r + ".u is not Null.");
    if (typeof v.d !== "undefined")
        throw new TypeError(r + ".d is not Undefined.");
    if (!Array.isArray(v.na))
        throw new TypeError(r + ".na is not Array.");
    if (!Array.isArray(v.sa))
        throw new TypeError(r + ".sa is not Array.");
    if (!Array.isArray(v.ba))
        throw new TypeError(r + ".ba is not Array.");
    if (!Array.isArray(v.ua))
        throw new TypeError(r + ".ua is not Array.");
    if (!Array.isArray(v.da))
        throw new TypeError(r + ".da is not Array.");
    if (typeof v.nad !== "undefined" && !Array.isArray(v.nad))
        throw new TypeError(r + ".nad is not Array | Undefined.");
    if (typeof v.nd !== "undefined" && typeof v.nd !== "number")
        throw new TypeError(r + ".nd is not Number | Undefined.");
    if (typeof v.sd !== "undefined" && typeof v.sd !== "string")
        throw new TypeError(r + ".sd is not String | Undefined.");
    if (typeof v.bd !== "undefined" && (typeof v.bd !== "boolean" && typeof v.bd !== "boolean"))
        throw new TypeError(r + ".bd is not Boolean | Boolean | Undefined.");
    if (typeof v.ud !== "undefined" && v.ud !== null)
        throw new TypeError(r + ".ud is not Null | Undefined.");
    if (typeof v.x !== "object")
        throw new TypeError(r + ".x is not Object.");
    __check_X(v.x, r + ".x");
    if (typeof v.xd !== "undefined" && typeof v.xd !== "object")
        throw new TypeError(r + ".xd is not Object | Undefined.");
    if (typeof v.xd !== "undefined")
        __check_X(v.xd, r + ".xd");
    if (typeof v.xud !== "undefined" && (v.xud !== null && typeof v.xud !== "object"))
        throw new TypeError(r + ".xud is not Object | Null | Undefined.");
    if (typeof v.xud !== "undefined" && v.xud !== null)
        __check_X(v.xud, r + ".xud");
    if (!Array.isArray(v.xa))
        throw new TypeError(r + ".xa is not Array.");
}

function __check_X(v: any, r: string) {
    if (typeof v.n2 !== "number")
        throw new TypeError(r + ".n2 is not Number.");
    if (typeof v.xd !== "undefined" && typeof v.xd !== "object")
        throw new TypeError(r + ".xd is not Object | Undefined.");
    if (typeof v.xd !== "undefined")
        __check_X(v.xd, r + ".xd");
}