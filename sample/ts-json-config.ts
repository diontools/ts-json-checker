import { generate } from 'ts-json'
import { T as M, X } from './types'

const fileName = './generated.ts'

generate<number>("parseN")
generate<string>("parseS")
generate<boolean>("parseB")
generate<object>("parseO")
generate<undefined>("parseD")
generate<null>("parseU")
generate<M>("parseM")

generate<number[]>("parseNA")
generate<string[]>("parseSA")
generate<boolean[]>("parseBA")
generate<object[]>("parseOA")
generate<undefined[]>("parseDA")
generate<null[]>("parseUA")
generate<M[]>("parseMA")
generate<number[][]>("parseNAA")

generate<number | string | boolean | null | undefined>("parseNSBUD")
generate<M | null>("parseMU")
generate<X | undefined>("parseXD")
generate<(number[] | X)[] | X>("parseXAX")

generate<{ x: number }>("parseTL")