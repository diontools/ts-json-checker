[![Build Status](https://travis-ci.org/diontools/ts-json-checker.svg?branch=master)](https://travis-ci.org/diontools/ts-json-checker)[![codecov](https://codecov.io/gh/diontools/ts-json-checker/branch/master/graph/badge.svg)](https://codecov.io/gh/diontools/ts-json-checker)[![npm version](https://badge.fury.io/js/ts-json-checker.svg)](https://www.npmjs.com/package/ts-json-checker)

# ts-json-checker

**ts-json-checker** is type check function generator from type assertion for TypeScript.

It is mainly used for JSON input check.

## Feature

* Generate type check function for `JSON.parse`d object
* Custom convert for specified type

* No required library at runtime

## Environment

* Node.js 10
* TypeScript 3.3.3333

## Install

```shell
npm install --save-dev ts-json-checker
```

## Configure

ts-json-config.ts (default file name)

```typescript
import { generate, convert } from 'ts-json-checker'

// output file name
const fileName = './generated.ts'

export interface Item {
    name: string
    price: number
    releaseDate: Date
}

// string to Date type convertion
convert<Date>(v => {
    if (v instanceof Date) return v
    const dt = typeof v === "string" ? Date.parse(v) : NaN
    if (isNaN(dt)) throw new TypeError('Unable to convert to date. value: ' + v)
    return new Date(dt)
})

// generate Item type check function
generate<Item>("parseItem")

// generate Array of Item type check function
generate<Item[]>("parseItems")

// union type
generate<Item | null>("parseUnion")
```

[more config sample](./sample/ts-json-config.ts)

## Usage

Command Lines:

```
Usage: ts-json-checker [options]

Options:
  -v, --version               output the version number
  -c, --config <config-file>  specify config file
  -n, --linefeedNewLine       set new line chars to linefeed(LF)
  -h, --help                  output usage information
```

example:

```shell
# use default config file name 'ts-json-config.ts'
npx ts-json-checker

# specify config file name
npx ts-json-checker --config ./other-ts-json-config.ts
```

## Output

generated.ts

```typescript
import { X } from "./types";

export function parseNumer(v: any): number {
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

export function parseNumberArray(v: any): number[] {
    if (Array.isArray(v))
        for (let i = 0; i < v.length; i++)
            if (typeof v[i] === "number") { }
            else
                throw new TypeError("v[" + i + "] is not Number.");
    else
        throw new TypeError("v is not Array.");
    return <number[]>v;
}

export function parseArrayOfNumberArray(v: any): number[][] {
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

export function parseUnion(v: any): number | string | boolean | null | undefined {
    if (typeof v === "undefined") { }
    else if (v === null) { }
    else if (typeof v === "string") { }
    else if (typeof v === "number") { }
    else if (typeof v === "boolean") { }
    else
        throw new TypeError("v is not Undefined | Null | String | Number | Boolean.");
    return <number | string | boolean | null | undefined>v;
}

export function parseXOrUndefined(v: any): X | undefined {
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
    if (typeof v.date === "undefined") { }
    else
        v.date = __convert_1(v.date);
}

function __convert_1(v: any): Date {
    if (v instanceof Date)
        return v;
    const dt = typeof v === "string" ? Date.parse(v) : NaN;
    if (isNaN(dt))
        throw new TypeError('Unable to convert to date. value: ' + v);
    return new Date(dt);
}
```

