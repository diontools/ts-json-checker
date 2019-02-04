import { generate, TSJsonSetting } from './ts-json'
import { T, X } from './types'

const settings: TSJsonSetting = {
    fileName: 'generated.ts',
}

generate<T>("parseT")
generate<X | undefined>("parseX")
