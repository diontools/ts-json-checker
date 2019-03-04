import { T as M, X, Z } from "../types";

// type declarations at config
export interface LocalType {
    n: number;
}

export type LocalTypeAlias = LocalType | undefined;

export enum Enum {
    one = 1,
    two = 2,
    three = 3
}

export enum StringEnum {
    one = "ONE",
    two = "TWO",
    three = "THREE"
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

export function parseY(v: any): any {
    return <any>v;
}

export function parseM(v: any): M {
    if (v !== null && typeof v === "object")
        __check_1(v, "v");
    else
        throw new TypeError("v is not Object.");
    return <M>v;
}

export function parseX(v: any): X {
    if (v !== null && typeof v === "object")
        __check_2(v, "v");
    else
        throw new TypeError("v is not Object.");
    return <X>v;
}

export function parseI(v: any): bigint {
    if (typeof v === "bigint") { }
    else
        throw new TypeError("v is not BigInt.");
    return <bigint>v;
}

export function parseDate(v: any): Date {
    v = __convert_1(v);
    return <Date>v;
}

export function parseZ(v: any): Z {
    if (v !== null && typeof v === "object")
        __check_4(v, "v");
    else
        throw new TypeError("v is not Object.");
    return <Z>v;
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

export function parseSA(v: any): string[] {
    if (Array.isArray(v))
        for (let i = 0; i < v.length; i++)
            if (typeof v[i] === "string") { }
            else
                throw new TypeError("v[" + i + "] is not String.");
    else
        throw new TypeError("v is not Array.");
    return <string[]>v;
}

export function parseBA(v: any): boolean[] {
    if (Array.isArray(v))
        for (let i = 0; i < v.length; i++)
            if (typeof v[i] === "boolean") { }
            else
                throw new TypeError("v[" + i + "] is not Boolean.");
    else
        throw new TypeError("v is not Array.");
    return <boolean[]>v;
}

export function parseOA(v: any): object[] {
    if (Array.isArray(v))
        for (let i = 0; i < v.length; i++)
            if (v[i] !== null && typeof v[i] === "object") { }
            else
                throw new TypeError("v[" + i + "] is not Object.");
    else
        throw new TypeError("v is not Array.");
    return <object[]>v;
}

export function parseDA(v: any): undefined[] {
    if (Array.isArray(v))
        for (let i = 0; i < v.length; i++)
            if (typeof v[i] === "undefined") { }
            else
                throw new TypeError("v[" + i + "] is not Undefined.");
    else
        throw new TypeError("v is not Array.");
    return <undefined[]>v;
}

export function parseUA(v: any): null[] {
    if (Array.isArray(v))
        for (let i = 0; i < v.length; i++)
            if (v[i] === null) { }
            else
                throw new TypeError("v[" + i + "] is not Null.");
    else
        throw new TypeError("v is not Array.");
    return <null[]>v;
}

export function parseYA(v: any): any[] {
    if (Array.isArray(v)) { }
    else
        throw new TypeError("v is not Array.");
    return <any[]>v;
}

export function parseMA(v: any): M[] {
    if (Array.isArray(v))
        for (let i = 0; i < v.length; i++)
            if (v[i] !== null && typeof v[i] === "object")
                __check_1(v[i], "v[" + i + "]");
            else
                throw new TypeError("v[" + i + "] is not Object.");
    else
        throw new TypeError("v is not Array.");
    return <M[]>v;
}

export function parseNAA(v: any): number[][] {
    if (Array.isArray(v))
        for (let i = 0; i < v.length; i++)
            if (Array.isArray(v[i]))
                for (let j = 0; j < v[i].length; j++)
                    if (typeof v[i][j] === "number") { }
                    else
                        throw new TypeError("v[" + i + "][" + j + "] is not Number.");
            else
                throw new TypeError("v[" + i + "] is not Array.");
    else
        throw new TypeError("v is not Array.");
    return <number[][]>v;
}

export function parseNSBUD(v: any): number | string | boolean | null | undefined {
    if (typeof v === "undefined") { }
    else if (v === null) { }
    else if (typeof v === "string") { }
    else if (typeof v === "number") { }
    else if (typeof v === "boolean") { }
    else
        throw new TypeError("v is not Undefined | Null | String | Number | Boolean.");
    return <number | string | boolean | null | undefined>v;
}

export function parseUNAXD(v: any): null | number[] | X | undefined {
    if (typeof v === "undefined") { }
    else if (v === null) { }
    else if (Array.isArray(v))
        for (let i = 0; i < v.length; i++)
            if (typeof v[i] === "number") { }
            else
                throw new TypeError("v[" + i + "] is not Number.");
    else if (v !== null && typeof v === "object")
        __check_2(v, "v");
    else
        throw new TypeError("v is not Undefined | Null | Array | Object.");
    return <null | number[] | X | undefined>v;
}

export function parseMU(v: any): M | null {
    if (v === null) { }
    else if (v !== null && typeof v === "object")
        __check_1(v, "v");
    else
        throw new TypeError("v is not Null | Object.");
    return <M | null>v;
}

export function parseXD(v: any): X | undefined {
    if (typeof v === "undefined") { }
    else if (v !== null && typeof v === "object")
        __check_2(v, "v");
    else
        throw new TypeError("v is not Undefined | Object.");
    return <X | undefined>v;
}

export function parseXAX(v: any): (number[] | X)[] | X {
    if (Array.isArray(v))
        for (let i = 0; i < v.length; i++)
            if (Array.isArray(v[i]))
                for (let j = 0; j < v[i].length; j++)
                    if (typeof v[i][j] === "number") { }
                    else
                        throw new TypeError("v[" + i + "][" + j + "] is not Number.");
            else if (v[i] !== null && typeof v[i] === "object")
                __check_2(v[i], "v[" + i + "]");
            else
                throw new TypeError("v[" + i + "] is not Array | Object.");
    else if (v !== null && typeof v === "object")
        __check_2(v, "v");
    else
        throw new TypeError("v is not Array | Object.");
    return <(number[] | X)[] | X>v;
}

export function parseTL(v: any): {
    x: number;
} {
    if (v !== null && typeof v === "object")
        __check_5(v, "v");
    else
        throw new TypeError("v is not Object.");
    return <{
        x: number;
    }>v;
}

export function parseSL(v: any): "abc" {
    if (v === "abc") { }
    else
        throw new TypeError("v is not 'abc'.");
    return <"abc">v;
}

export function parseSL2(v: any): "abc" | "xyz" {
    if (v === "abc") { }
    else if (v === "xyz") { }
    else
        throw new TypeError("v is not 'abc' | 'xyz'.");
    return <"abc" | "xyz">v;
}

export function parseNL(v: any): 1 {
    if (v === 1) { }
    else
        throw new TypeError("v is not 1.");
    return <1>v;
}

export function parseNL2(v: any): 1 | 2 {
    if (v === 1) { }
    else if (v === 2) { }
    else
        throw new TypeError("v is not 1 | 2.");
    return <1 | 2>v;
}

export function parseBL(v: any): true {
    if (v === true) { }
    else
        throw new TypeError("v is not true.");
    return <true>v;
}

export function parseBL2(v: any): true | false {
    if (typeof v === "boolean") { }
    else
        throw new TypeError("v is not Boolean.");
    return <true | false>v;
}

export function parseL(v: any): "abc" | 1 | true {
    if (v === true) { }
    else if (v === "abc") { }
    else if (v === 1) { }
    else
        throw new TypeError("v is not true | 'abc' | 1.");
    return <"abc" | 1 | true>v;
}

export function parseTLTL(v: any): {
    c: {
        n: number;
    };
} {
    if (v !== null && typeof v === "object")
        __check_6(v, "v");
    else
        throw new TypeError("v is not Object.");
    return <{
        c: {
            n: number;
        };
    }>v;
}

export function parseLocalType(v: any): LocalType {
    if (v !== null && typeof v === "object")
        __check_8(v, "v");
    else
        throw new TypeError("v is not Object.");
    return <LocalType>v;
}

export function parseLocalTypeAlias(v: any): LocalTypeAlias {
    if (typeof v === "undefined") { }
    else if (v !== null && typeof v === "object")
        __check_8(v, "v");
    else
        throw new TypeError("v is not Undefined | Object.");
    return <LocalTypeAlias>v;
}

export function parseEnum(v: any): Enum {
    if (v === 1) { }
    else if (v === 2) { }
    else if (v === 3) { }
    else
        throw new TypeError("v is not 1 | 2 | 3.");
    return <Enum>v;
}

export function parseStringEnum(v: any): StringEnum {
    if (v === "ONE") { }
    else if (v === "TWO") { }
    else if (v === "THREE") { }
    else
        throw new TypeError("v is not 'ONE' | 'TWO' | 'THREE'.");
    return <StringEnum>v;
}

function __check_1(v: any, r: string) {
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
    else
        throw new TypeError(r + ".bd is not Undefined | Boolean.");
    if (typeof v.ud === "undefined") { }
    else if (v.ud === null) { }
    else
        throw new TypeError(r + ".ud is not Undefined | Null.");
    if (v.x !== null && typeof v.x === "object")
        __check_2(v.x, r + ".x");
    else
        throw new TypeError(r + ".x is not Object.");
    if (typeof v.xd === "undefined") { }
    else if (v.xd !== null && typeof v.xd === "object")
        __check_2(v.xd, r + ".xd");
    else
        throw new TypeError(r + ".xd is not Undefined | Object.");
    if (typeof v.xud === "undefined") { }
    else if (v.xud === null) { }
    else if (v.xud !== null && typeof v.xud === "object")
        __check_2(v.xud, r + ".xud");
    else
        throw new TypeError(r + ".xud is not Undefined | Null | Object.");
    if (Array.isArray(v.xa))
        for (let i = 0; i < v.xa.length; i++)
            if (v.xa[i] !== null && typeof v.xa[i] === "object")
                __check_2(v.xa[i], r + ".xa[" + i + "]");
            else
                throw new TypeError(r + ".xa[" + i + "] is not Object.");
    else
        throw new TypeError(r + ".xa is not Array.");
    if (v.tl !== null && typeof v.tl === "object")
        __check_3(v.tl, r + ".tl");
    else
        throw new TypeError(r + ".tl is not Object.");
    v.date = __convert_1(v.date);
    if (typeof v.dateD === "undefined") { }
    else
        v.dateD = __convert_1(v.dateD);
}

function __check_2(v: any, r: string) {
    if (typeof v.n2 === "number") { }
    else
        throw new TypeError(r + ".n2 is not Number.");
    if (typeof v.xd === "undefined") { }
    else if (v.xd !== null && typeof v.xd === "object")
        __check_2(v.xd, r + ".xd");
    else
        throw new TypeError(r + ".xd is not Undefined | Object.");
    if (Array.isArray(v.xa))
        for (let i = 0; i < v.xa.length; i++)
            if (v.xa[i] !== null && typeof v.xa[i] === "object")
                __check_2(v.xa[i], r + ".xa[" + i + "]");
            else
                throw new TypeError(r + ".xa[" + i + "] is not Object.");
    else
        throw new TypeError(r + ".xa is not Array.");
}

function __check_3(v: any, r: string) {
    if (typeof v.n === "number") { }
    else
        throw new TypeError(r + ".n is not Number.");
}

function __check_4(v: any, r: string) {
    v.stringNumber = __convert_2(v.stringNumber);
}

function __check_5(v: any, r: string) {
    if (typeof v.x === "number") { }
    else
        throw new TypeError(r + ".x is not Number.");
}

function __check_6(v: any, r: string) {
    if (v.c !== null && typeof v.c === "object")
        __check_7(v.c, r + ".c");
    else
        throw new TypeError(r + ".c is not Object.");
}

function __check_7(v: any, r: string) {
    if (typeof v.n === "number") { }
    else
        throw new TypeError(r + ".n is not Number.");
}

function __check_8(v: any, r: string) {
    if (typeof v.n === "number") { }
    else
        throw new TypeError(r + ".n is not Number.");
}

function __convert_1(v: any): Date {
    if (v instanceof Date)
        return v;
    const dt = typeof v === "string" ? Date.parse(v) : NaN;
    if (isNaN(dt))
        throw new TypeError('Unable to convert to date. value: ' + v);
    return new Date(dt);
}

function __convert_2(v: any): Z['stringNumber'] {
    if (typeof v === "number")
        return v;
    const i = typeof v === "string" ? parseInt(v, 10) : NaN;
    if (isNaN(i))
        throw new TypeError('Unable to convert to number. value: ' + v);
    return i;
}