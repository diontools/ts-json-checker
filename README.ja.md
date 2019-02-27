# ts-json-checker

ts-json-checkerは、型アサーションから型チェック関数を生成するTypeScriptコードです。

主にJSONの入力チェックに使用します。

## 動作環境

* NodeJS 8
* TypeScript 3.3.3333
* ts-node 8

## インストール

```
npm install --save-dev ts-json-checker
```

## 設定

ts-json-config.ts

```typescript
import { generate } from 'ts-json-checker'
import { X } from './types'

const fileName = './generated.ts'

generate<number>("parseN")
generate<X>("parseX")

generate<number[]>("parseNA")
generate<number[][]>("parseNAA")

generate<number | string | boolean | null | undefined>("parseNSBUD")
generate<X | undefined>("parseXD")
```

## 使い方

```
ts-node ./node_modules/ts-json-checker/ts-json-generator.ts ./ts-json-config.ts
```

## 出力

generated.ts

```typescript
import { X } from './types'

export class TypeError implements Error {
    public name = "TypeError";
    constructor(public message: string) { }
    toString() { return this.name + ": " + this.message; }
}

export function parseN(v: any): number {
    if (typeof v === "number") { }
    else
        throw new TypeError("v is not Number.");
    return <number>v;
}

export function parseX(v: any): X {
    if (v !== null && typeof v === "object")
        __check_1(v, "v");
    else
        throw new TypeError("v is not Object.");
    return <X>v;
}

export function parseNA(v: any): number[] {
    if (Array.isArray(v))
        for (let i = 0; i < v.length; i++)
            if (typeof v[i] === "number") { }
            else
                throw new TypeError("v[" + i + "] is not Number.");
    else
        throw new TypeError("v is not Array.");
    return <number[]>v;
}

export function parseNAA(v: any): number[][] {
    if (Array.isArray(v))
        for (let i = 0; i < v.length; i++)
            if (Array.isArray(v[i]))
                for (let j = 0; j < v[i].length; j++)
                    if (typeof v[i][j] === "number") { }
                    else
                        throw new TypeError("v[" + i + "][" + j + "] is not Number.");
            else
                throw new TypeError("v[" + i + "] is not Array.");
    else
        throw new TypeError("v is not Array.");
    return <number[][]>v;
}

export function parseNSBUD(v: any): number | string | boolean | null | undefined {
    if (typeof v === "undefined") { }
    else if (v === null) { }
    else if (typeof v === "string") { }
    else if (typeof v === "number") { }
    else if (typeof v === "boolean") { }
    else
        throw new TypeError("v is not Undefined | Null | String | Number | Boolean.");
    return <number | string | boolean | null | undefined>v;
}

export function parseXD(v: any): X | undefined {
    if (typeof v === "undefined") { }
    else if (v !== null && typeof v === "object")
        __check_1(v, "v");
    else
        throw new TypeError("v is not Undefined | Object.");
    return <X | undefined>v;
}

function __check_1(v: any, r: string) {
    if (typeof v.n2 === "number") { }
    else
        throw new TypeError(r + ".n2 is not Number.");
    if (typeof v.xd === "undefined") { }
    else if (v.xd !== null && typeof v.xd === "object")
        __check_1(v.xd, r + ".xd");
    else
        throw new TypeError(r + ".xd is not Undefined | Object.");
    if (Array.isArray(v.xa))
        for (let i = 0; i < v.xa.length; i++)
            if (v.xa[i] !== null && typeof v.xa[i] === "object")
                __check_1(v.xa[i], r + ".xa[" + i + "]");
            else
                throw new TypeError(r + ".xa[" + i + "] is not Object.");
    else
        throw new TypeError(r + ".xa is not Array.");
}
```

