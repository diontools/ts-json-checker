import { T, X } from "./types";

function check_T(v: any, r: string) {
    if (typeof v['n'] !== "number") throw new Error(r + '.n is not number.')
    if (typeof v['s'] !== "string") throw new Error(r + '.s is not string.')
    if (typeof v['b'] !== "boolean") throw new Error(r + '.b is not boolean.')
    if (v['u'] !== null) throw new Error(r + '.u is not null.')
    if (typeof v['d'] !== "undefined") throw new Error(r + '.d is not undefined.')
    if (!Array.isArray(v['na'])) throw new Error(r + '.na is not array.')
    for (let i = 0; i < v['na'].length; i++) {
        if (typeof v['na'][i] !== "number") throw new Error(r + '.na[' + i + '] is not number.')
    }
    if (typeof v['nd'] !== "undefined" && typeof v['nd'] !== "number") throw new Error(r + '.nd is not undefined | number.')
    if (typeof v['sd'] !== "undefined" && typeof v['sd'] !== "string") throw new Error(r + '.sd is not undefined | string.')
    if (typeof v['bd'] !== "undefined" && typeof v['bd'] !== "boolean") throw new Error(r + '.bd is not undefined | boolean.')
    if (typeof v['ud'] !== "undefined" && v['ud'] !== null) throw new Error(r + '.ud is not undefined | null.')
    if (typeof v['x'] !== "object") throw new Error(r + '.x is not object.')
    check_X(v['x'], r + '.x')
    if (typeof v['xd'] !== "undefined" && typeof v['xd'] !== "object") throw new Error(r + '.xd is not undefined | object.')
    if (typeof v['xd'] !== "undefined") check_X(v['xd'], r + '.xd')
    if (typeof v['xud'] !== "undefined" && v['xud'] !== null && typeof v['xud'] !== "object") throw new Error(r + '.xud is not undefined | null | object.')
    if (typeof v['xud'] !== "undefined" && v['xud'] !== null) check_X(v['xud'], r + '.xud')
}

function check_X(v: any, r: string) {
    if (typeof v['n'] !== "number") throw new Error(r + '.n is not number.')
    if (typeof v['xd'] !== "undefined" && typeof v['xd'] !== "object") throw new Error(r + '.xd is not undefined | object.')
    if (typeof v['xd'] !== "undefined") check_X(v['xd'], r + '.xd')
}

export function parseT(v: any) {
    if (typeof v !== "object") throw new Error('value is not object.')
    check_T(v, 'value')
    return <T>v
}

export function parseX(v: any) {
    if (typeof v !== "undefined" && typeof v !== "object") throw new Error('value is not object.')
    if (typeof v !== "undefined") check_X(v, 'value')
    return <X | undefined>v
}