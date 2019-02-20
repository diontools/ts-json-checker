import { generate, TSJsonSetting } from './ts-json'
import { T, X } from './types'

const settings: TSJsonSetting = {
    fileName: 'generated.ts',
}

generate<number>("parseN")
generate<T>("parseT")
generate<X | undefined>("parseX")
