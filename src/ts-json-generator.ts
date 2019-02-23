import * as fs from 'fs'
import * as path from 'path'
import { FgWhite, Reset, Bright, FgYellow, FgCyan, FgGreen, FgMagenta, FgRed } from './Colors';
import { generate } from './ts-json-func'

const DEBUG = true
if (!DEBUG) {
    console.log = function () { }
}

console.log(FgWhite + 'initialize...' + Reset)

const baseDir = process.cwd()

const configFile = process.argv.length >= 3 ? process.argv[2] : 'ts-json-config.ts'
console.log(Bright + FgWhite + 'config:', FgGreen + configFile + Reset)

const tsJsonFile = path.relative(baseDir, path.join(__dirname, 'ts-json.ts'))
console.log(Bright + FgWhite + 'tsJson:', FgGreen + tsJsonFile + Reset)

const result = generate(tsJsonFile, configFile, fileName => {
    if (fileName.startsWith('libs/')) {
        fileName = path.join(baseDir, 'node_modules', 'typescript', 'lib', fileName.substr('libs/'.length))
    }
    
    if (fs.existsSync(fileName)) {
        return fs.readFileSync(fileName).toString()
    }

    console.log(Bright + FgRed + 'not resolved', fileName + Reset)
}, "libs/lib.d.ts", "\r\n")

const outputFile = path.join(path.dirname(configFile), result.fileName)
console.info(Bright + FgWhite + 'output:', FgGreen + outputFile + Reset)
fs.writeFileSync(outputFile, result.code)
