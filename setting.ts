import { targetType } from './jsonTypeChecker'
import { T, X } from './types'

targetType<T>("parseT")
targetType<X | undefined>("parseX")
