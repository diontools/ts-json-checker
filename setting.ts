import { generate } from './jsonTypeChecker'
import { T, X } from './types'

generate<T>("parseT")
generate<X | undefined>("parseX")
