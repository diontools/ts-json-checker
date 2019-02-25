import { T as M, X } from './types'

export class TypeError implements Error {
    public name = "TypeError";
    constructor(public message: string) { }
    toString() { return this.name + ": " + this.message; }
}

export function parseN(v: any): number {
    if (typeof v === "number") { }
    else
        throw new TypeError("v is not Number.");
    return <number>v;
}

export function parseS(v: any): string {
    if (typeof v === "string") { }
    else
        throw new TypeError("v is not String.");
    return <string>v;
}

export function parseB(v: any): boolean {
    if (typeof v === "boolean") { }
    else
        throw new TypeError("v is not Boolean.");
    return <boolean>v;
}

export function parseO(v: any): object {
    if (v !== null && typeof v === "object") { }
    else
        throw new TypeError("v is not Object.");
    return <object>v;
}

export function parseD(v: any): undefined {
    if (typeof v === "undefined") { }
    else
        throw new TypeError("v is not Undefined.");
    return <undefined>v;
}

export function parseU(v: any): null {
    if (v === null) { }
    else
        throw new TypeError("v is not Null.");
    return <null>v;
}

export function parseNSD(v: any): number | string | undefined {
    if (typeof v === "undefined") { }
    else if (typeof v === "string") { }
    else if (typeof v === "number") { }
    else
        throw new TypeError("v is not Undefined | String | Number.");
    return <number | string | undefined>v;
}

export function parseNUD(v: any): number | null | undefined {
    if (typeof v === "undefined") { }
    else if (v === null) { }
    else if (typeof v === "number") { }
    else
        throw new TypeError("v is not Undefined | Null | Number.");
    return <number | null | undefined>v;
}

export function parseNA(v: any): number[] {
    if (Array.isArray(v))
        for (let i = 0; i < v.length; i++)
            if (typeof v[i] === "number") { }
            else
                throw new TypeError("v[" + i + "] is not Number.");
    else
        throw new TypeError("v is not Array.");
    return <number[]>v;
}

export function parseM(v: any): M {
    if (typeof v === "object")
        __check_T(v, "v");
    else
        throw new TypeError("v is not Object.");
    return <M>v;
}

export function parseT(v: any): M | null {
    if (v === null) { }
    else if (typeof v === "object")
        __check_T(v, "v");
    else
        throw new TypeError("v is not Null | Object.");
    return <M | null>v;
}

export function parseX(v: any): X | undefined {
    if (typeof v === "undefined") { }
    else if (typeof v === "object")
        __check_X(v, "v");
    else
        throw new TypeError("v is not Undefined | Object.");
    return <X | undefined>v;
}

export function parseNSA(v: any): (number | string | number[] | X)[] | undefined | X {
    if (typeof v === "undefined") { }
    else if (typeof v === "object")
        __check_X(v, "v");
    else if (Array.isArray(v))
        for (let i = 0; i < v.length; i++)
            if (typeof v[i] === "string") { }
            else if (typeof v[i] === "number") { }
            else if (Array.isArray(v[i]))
                for (let j = 0; j < v[i].length; j++)
                    if (typeof v[i][j] === "number") { }
                    else
                        throw new TypeError("v[" + i + "][" + j + "] is not Number.");
            else if (typeof v[i] === "object")
                __check_X(v[i], "v[" + i + "]");
            else
                throw new TypeError("v[" + i + "] is not String | Number | Array | Object.");
    else
        throw new TypeError("v is not Undefined | Object | Array.");
    return <(number | string | number[] | X)[] | undefined | X>v;
}

function __check_T(v: any, r: string) {
    if (typeof v.n === "number") { }
    else
        throw new TypeError(r + ".n is not Number.");
    if (typeof v.s === "string") { }
    else
        throw new TypeError(r + ".s is not String.");
    if (typeof v.b === "boolean") { }
    else
        throw new TypeError(r + ".b is not Boolean.");
    if (v.u === null) { }
    else
        throw new TypeError(r + ".u is not Null.");
    if (typeof v.d === "undefined") { }
    else
        throw new TypeError(r + ".d is not Undefined.");
    if (Array.isArray(v.na))
        for (let i = 0; i < v.na.length; i++)
            if (typeof v.na[i] === "number") { }
            else
                throw new TypeError(r + ".na[" + i + "] is not Number.");
    else
        throw new TypeError(r + ".na is not Array.");
    if (Array.isArray(v.sa))
        for (let i = 0; i < v.sa.length; i++)
            if (typeof v.sa[i] === "string") { }
            else
                throw new TypeError(r + ".sa[" + i + "] is not String.");
    else
        throw new TypeError(r + ".sa is not Array.");
    if (Array.isArray(v.ba))
        for (let i = 0; i < v.ba.length; i++)
            if (typeof v.ba[i] === "boolean") { }
            else
                throw new TypeError(r + ".ba[" + i + "] is not Boolean.");
    else
        throw new TypeError(r + ".ba is not Array.");
    if (Array.isArray(v.ua))
        for (let i = 0; i < v.ua.length; i++)
            if (v.ua[i] === null) { }
            else
                throw new TypeError(r + ".ua[" + i + "] is not Null.");
    else
        throw new TypeError(r + ".ua is not Array.");
    if (Array.isArray(v.da))
        for (let i = 0; i < v.da.length; i++)
            if (typeof v.da[i] === "undefined") { }
            else
                throw new TypeError(r + ".da[" + i + "] is not Undefined.");
    else
        throw new TypeError(r + ".da is not Array.");
    if (typeof v.nad === "undefined") { }
    else if (Array.isArray(v.nad))
        for (let i = 0; i < v.nad.length; i++)
            if (typeof v.nad[i] === "number") { }
            else
                throw new TypeError(r + ".nad[" + i + "] is not Number.");
    else
        throw new TypeError(r + ".nad is not Undefined | Array.");
    if (typeof v.nd === "undefined") { }
    else if (typeof v.nd === "number") { }
    else
        throw new TypeError(r + ".nd is not Undefined | Number.");
    if (typeof v.sd === "undefined") { }
    else if (typeof v.sd === "string") { }
    else
        throw new TypeError(r + ".sd is not Undefined | String.");
    if (typeof v.bd === "undefined") { }
    else if (typeof v.bd === "boolean") { }
    else if (typeof v.bd === "boolean") { }
    else
        throw new TypeError(r + ".bd is not Undefined | Boolean | Boolean.");
    if (typeof v.ud === "undefined") { }
    else if (v.ud === null) { }
    else
        throw new TypeError(r + ".ud is not Undefined | Null.");
    if (typeof v.x === "object")
        __check_X(v.x, r + ".x");
    else
        throw new TypeError(r + ".x is not Object.");
    if (typeof v.xd === "undefined") { }
    else if (typeof v.xd === "object")
        __check_X(v.xd, r + ".xd");
    else
        throw new TypeError(r + ".xd is not Undefined | Object.");
    if (typeof v.xud === "undefined") { }
    else if (v.xud === null) { }
    else if (typeof v.xud === "object")
        __check_X(v.xud, r + ".xud");
    else
        throw new TypeError(r + ".xud is not Undefined | Null | Object.");
    if (Array.isArray(v.xa))
        for (let i = 0; i < v.xa.length; i++)
            if (typeof v.xa[i] === "object")
                __check_X(v.xa[i], r + ".xa[" + i + "]");
            else
                throw new TypeError(r + ".xa[" + i + "] is not Object.");
    else
        throw new TypeError(r + ".xa is not Array.");
}

function __check_X(v: any, r: string) {
    if (typeof v.n2 === "number") { }
    else
        throw new TypeError(r + ".n2 is not Number.");
    if (typeof v.xd === "undefined") { }
    else if (typeof v.xd === "object")
        __check_X(v.xd, r + ".xd");
    else
        throw new TypeError(r + ".xd is not Undefined | Object.");
    if (Array.isArray(v.xa))
        for (let i = 0; i < v.xa.length; i++)
            if (typeof v.xa[i] === "object")
                __check_X(v.xa[i], r + ".xa[" + i + "]");
            else
                throw new TypeError(r + ".xa[" + i + "] is not Object.");
    else
        throw new TypeError(r + ".xa is not Array.");
}