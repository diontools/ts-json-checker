import { generate } from '../src/ts-json'
import { T as M, X } from './types'

const fileName = './generated.ts'

generate<number>("parseN")
generate<object>("parseO")
generate<number | string | undefined>("parseNSD")
generate<number | null | undefined>("parseNUD")
generate<M>("parseM")
generate<M | null>("parseT")
generate<X | undefined>("parseX")
