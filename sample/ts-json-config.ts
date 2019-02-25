import { generate } from 'ts-json'
import { T as M, X } from './types'

const fileName = './generated.ts'

generate<number>("parseN")
generate<string>("parseS")
generate<boolean>("parseB")
generate<object>("parseO")
generate<undefined>("parseD")
generate<null>("parseU")
generate<number | string | undefined>("parseNSD")
generate<number | null | undefined>("parseNUD")
generate<number[]>("parseNA")
generate<M>("parseM")
generate<M | null>("parseT")
generate<X | undefined>("parseX")
generate<(number | string | number[] | X)[] | undefined | X>("parseNSA")
