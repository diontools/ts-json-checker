import * as fs from 'fs'
import * as path from 'path'
import { FgWhite, Reset, Bright, FgYellow, FgCyan, FgGreen, FgMagenta, FgRed } from '../src/colors';
import { debug, info, logOption } from '../src/logger'
import { generate } from '../src/ts-json-func'

function generateTest(configText?: string, configFile?: string, tsJsonFile?: string) {
    const baseDir = process.cwd()

    configFile = configFile || './sample/ts-json-config.ts'
    configText = configText !== undefined ? configText : fs.existsSync(configFile) ? fs.readFileSync(configFile).toString() : undefined
    tsJsonFile = tsJsonFile || path.relative(baseDir, path.join(__dirname, '../src/index.ts'))
    logOption.isDebug = false

    debug(FgWhite + 'initialize...' + Reset)

    const configDir = path.dirname(configFile)
    info(Bright + FgWhite + 'config:', FgGreen + configFile + Reset)

    info(Bright + FgWhite + 'tsJson:', FgGreen + tsJsonFile + Reset)

    const result = generate({
        tsJsonFile,
        configFile,
        resolve: fileName => {
            if (fileName === configFile) {
                return configText
            }
            
            if (fileName.startsWith('libs/')) {
                fileName = path.join(baseDir, 'node_modules', 'typescript', 'lib', fileName.substr('libs/'.length))
            }
    
            if (fs.existsSync(fileName)) {
                return fs.readFileSync(fileName).toString()
            }

            info(Bright + FgRed + 'not resolved', fileName + Reset)
        },
        defaultLibFileName: "libs/lib.d.ts",
        fixImportPath: (outputFileName, importPath) => {
            const outputDir = path.dirname(path.join(configDir, outputFileName))
            const relativeDir = path.relative(outputDir, configDir)
            const p = path.join(relativeDir, importPath).replace('\\', '/')
            return p.startsWith('.') ? p : './' + p
        },
        eol: "\r\n"
    })
}

test("generate sample", () => expect(() => {
    generateTest()
}).not.toThrow())

test("debug output", () => expect(() => {
    logOption.isDebug = true
    debug('test')
}).not.toThrow())

test("generate invalid source", () => expect(() => {
    generateTest('abc')
}).toThrow())

test("generate invalid config file", () => expect(() => {
    generateTest(undefined, './invalid.ts')
}).toThrow())

test("generate invalid tsJson file", () => expect(() => {
    generateTest(undefined, undefined, 'invalid-ts-json.ts')
}).toThrow())
