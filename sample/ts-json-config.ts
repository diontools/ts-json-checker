import { generate } from 'ts-json'
import { T as M, X } from './types'

const fileName = './generated.ts'

generate<number>("parseN")
generate<string>("parseS")
generate<boolean>("parseB")
generate<object>("parseO")
generate<undefined>("parseD")
generate<null>("parseU")
generate<any>("parseY")
generate<M>("parseM")

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