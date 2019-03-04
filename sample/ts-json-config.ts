import { generate, convert, convertProp } from 'ts-json-checker'
import { T as M, X, Z } from './types'

const fileName = './outputs/generated.ts'

convert<Date>(v => {
    if (v instanceof Date) return v
    const dt = typeof v === "string" ? Date.parse(v) : NaN
    if (isNaN(dt)) throw new TypeError('Unable to convert to date. value: ' + v)
    return new Date(dt)
})

convertProp<Z['stringNumber']>(v => {
    if (typeof v === "number") return v
    const i = typeof v === "string" ? parseInt(v, 10) : NaN
    if (isNaN(i)) throw new TypeError('Unable to convert to number. value: ' + v)
    return i
})

generate<number>("parseN")
generate<string>("parseS")
generate<boolean>("parseB")
generate<object>("parseO")
generate<undefined>("parseD")
generate<null>("parseU")
generate<any>("parseY")
generate<M>("parseM")
generate<X>("parseX")
generate<bigint>("parseI")
generate<Date>("parseDate")
generate<Z>("parseZ")

generate<number[]>("parseNA")
generate<string[]>("parseSA")
generate<boolean[]>("parseBA")
generate<object[]>("parseOA")
generate<undefined[]>("parseDA")
generate<null[]>("parseUA")
generate<any[]>("parseYA")
generate<M[]>("parseMA")
generate<number[][]>("parseNAA")

generate<number | string | boolean | null | undefined>("parseNSBUD")
generate<null | number[] | X | undefined>("parseUNAXD")
generate<M | null>("parseMU")
generate<X | undefined>("parseXD")
generate<(number[] | X)[] | X>("parseXAX")

generate<{ x: number }>("parseTL")
generate<"abc">("parseSL")
generate<"abc" | "xyz">("parseSL2")
generate<1>("parseNL")
generate<1 | 2>("parseNL2")
generate<true>("parseBL")
generate<true | false>("parseBL2")
generate<"abc" | 1 | true>("parseL")
// generate<123n>("parseIL")
// generate<123n | 456n>("parseIL2")

generate<{ c: { n: number } }>("parseTLTL")


export interface LocalType {
    n: number
}

generate<LocalType>("parseLocalType")

export type LocalTypeAlias = LocalType | undefined

generate<LocalTypeAlias>("parseLocalTypeAlias")