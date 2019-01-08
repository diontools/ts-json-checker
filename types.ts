export interface T {
    n: number
    s: string
    b: boolean
    u: null
    d: undefined
    na: number[]
    nd?: number
    sd?: string
    bd?: boolean
    ud?: null
    x: X
    xd?: X
    xud?: X | null
}

export interface X {
    n: number
    xd?: X
}