import { T, X } from "./types";

export class TypeError implements Error {
    public name = 'TypeError'

    constructor(public message: string) { }
    
    toString() {
        return this.name + ': ' + this.message
    }
}

function check_T(v: any, r: string) {
    if (typeof v['n'] !== "number") throw new TypeError(r + '.n is not number.')
    if (typeof v['s'] !== "string") throw new TypeError(r + '.s is not string.')
    if (typeof v['b'] !== "boolean") throw new TypeError(r + '.b is not boolean.')
    if (v['u'] !== null) throw new TypeError(r + '.u is not null.')
    if (typeof v['d'] !== "undefined") throw new TypeError(r + '.d is not undefined.')
    if (!Array.isArray(v['na'])) throw new TypeError(r + '.na is not array.')
    for (let i = 0; i < v['na'].length; i++) {
        if (typeof v['na'][i] !== "number") throw new TypeError(r + '.na[' + i + '] is not number.')
    }
    if (typeof v['nd'] !== "undefined" && typeof v['nd'] !== "number") throw new TypeError(r + '.nd is not undefined | number.')
    if (typeof v['sd'] !== "undefined" && typeof v['sd'] !== "string") throw new TypeError(r + '.sd is not undefined | string.')
    if (typeof v['bd'] !== "undefined" && typeof v['bd'] !== "boolean") throw new TypeError(r + '.bd is not undefined | boolean.')
    if (typeof v['ud'] !== "undefined" && v['ud'] !== null) throw new TypeError(r + '.ud is not undefined | null.')
    if (typeof v['x'] !== "object") throw new TypeError(r + '.x is not object.')
    check_X(v['x'], r + '.x')
    if (typeof v['xd'] !== "undefined" && typeof v['xd'] !== "object") throw new TypeError(r + '.xd is not undefined | object.')
    if (typeof v['xd'] !== "undefined") check_X(v['xd'], r + '.xd')
    if (typeof v['xud'] !== "undefined" && v['xud'] !== null && typeof v['xud'] !== "object") throw new TypeError(r + '.xud is not undefined | null | object.')
    if (typeof v['xud'] !== "undefined" && v['xud'] !== null) check_X(v['xud'], r + '.xud')
}

function check_X(v: any, r: string) {
    if (typeof v['n'] !== "number") throw new TypeError(r + '.n is not number.')
    if (typeof v['xd'] !== "undefined" && typeof v['xd'] !== "object") throw new TypeError(r + '.xd is not undefined | object.')
    if (typeof v['xd'] !== "undefined") check_X(v['xd'], r + '.xd')
}

export function parseT(v: any) {
    if (typeof v !== "object") throw new TypeError('value is not object.')
    check_T(v, 'value')
    return <T>v
}

export function parseX(v: any) {
    if (typeof v !== "undefined" && typeof v !== "object") throw new TypeError('value is not object.')
    if (typeof v !== "undefined") check_X(v, 'value')
    return <X | undefined>v
}

export function parseNSA(v: any): (number | string)[] | undefined | X {
    if (typeof v === "undefined") {
    } else if (typeof v === "object") {
        check_X(v, "v")
    } else if (Array.isArray(v)) {
        for (let i = 0; i < v.length; i++) {
            if (typeof v[i] === "number") {
            } else if (typeof v[i] === "string") {
            } else {
                throw new TypeError("v[" + i + "] is not Number | String.")
            }
        }
    } else {
        throw new TypeError("v is not Array | Object | Undefined.")
    }
    return <(number | string)[] | undefined | X>v;
}