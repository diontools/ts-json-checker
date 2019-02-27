# ts-json-checker

**ts-json-checker** is type checking function generator from type assertion for TypeScript.

It is mainly used for JSON input check.

## Environment

* Node.js 10
* TypeScript 3.3.3333

## Install

```shell
npm install --save-dev ts-json-checker
```

## Configure

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

types.ts

```typescript
export interface X {
    abc: string
    x?: X
}
```

## Usage

```shell
node ./node_modules/ts-json-checker/dist/ts-json-generator.js
# or specific config file
node ./node_modules/ts-json-checker/dist/ts-json-generator.js ./ts-json-config.ts
```

## Output

generated.ts

```typescript
import { X } from "./types";

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
    if (typeof v.abc === "string") { }
    else
        throw new TypeError(r + ".abc is not String.");
    if (typeof v.x === "undefined") { }
    else if (v.x !== null && typeof v.x === "object")
        __check_1(v.x, r + ".x");
    else
        throw new TypeError(r + ".x is not Undefined | Object.");
}
```

