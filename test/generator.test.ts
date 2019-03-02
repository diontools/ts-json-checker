import * as fs from 'fs'
import * as path from 'path'
import { FgWhite, Reset, Bright, FgYellow, FgCyan, FgGreen, FgMagenta, FgRed } from '../src/colors';
import { debug, info, logOption } from '../src/logger'
import * as func from '../src/ts-json-func'

interface GenerateTestOptions {
    configText?: string
    configFile?: string
    tsJsonFile?: string
    eol?: "\r\n" | "\n"
}

function generateTest(opt: GenerateTestOptions) {
    const baseDir = process.cwd()

    opt.configFile = opt.configFile || './sample/ts-json-config.ts'
    opt.configText = opt.configText !== undefined ? opt.configText : fs.existsSync(opt.configFile) ? fs.readFileSync(opt.configFile).toString() : undefined
    opt.tsJsonFile = opt.tsJsonFile || path.relative(baseDir, path.join(__dirname, '../src/index.ts'))
    opt.eol = opt.eol || "\r\n"
    logOption.isDebug = false

    debug(FgWhite + 'initialize...' + Reset)

    const configDir = path.dirname(opt.configFile)
    info(Bright + FgWhite + 'config:', FgGreen + opt.configFile + Reset)

    info(Bright + FgWhite + 'tsJson:', FgGreen + opt.tsJsonFile + Reset)

    const result = func.generate({
        tsJsonFile: opt.tsJsonFile,
        configFile: opt.configFile,
        resolve: fileName => {
            if (fileName === opt.configFile) {
                return opt.configText
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
        eol: opt.eol
    })

    return result
}

test("generate sample", () => expect(() => {
    generateTest({})
}).not.toThrow())

test("debug output", () => expect(() => {
    logOption.isDebug = true
    debug('test')
}).not.toThrow())

test("generate invalid source", () => expect(() => {
    generateTest({ configText: 'abc' })
}).toThrow())

test("generate invalid config file", () => expect(() => {
    generateTest({ configFile: './invalid.ts' })
}).toThrow())

test("generate invalid tsJson file", () => expect(() => {
    generateTest({ tsJsonFile: 'invalid-ts-json.ts' })
}).toThrow())

test("generate with bigint literal", () => expect(() => {
    generateTest({
        configText: `
            import { generate } from 'ts-json-checker'
            const fileName = "test"
            generate<123n>("parseIL")
            generate<123n | -456n>("parseIL2")
    `})
}).not.toThrow())

test("minimum config", () => expect(() => {
    generateTest({
        configText: `
            const fileName = "test"
    `})
}).not.toThrow())

test("convert function for expression", () => expect(() => {
    generateTest({
        configText: `
            import { generate, convert } from 'ts-json-checker'
            const fileName = "test"
            convert<Date>(v => v)
            generate<Date>("test")
    `})
}).not.toThrow())

test("multiple convertion type in union", () => expect(() => {
    generateTest({
        configText: `
            import { generate, convert } from 'ts-json-checker'
            const fileName = "test"
            convert<Date>(v => v)
            convert<RegExp>(v => v)
            generate<Date | RegExp>("test")
    `})
}).toThrow('unable to use multiple convertion type in union.'))

test("set eol to linefeed", () =>
    expect(
        generateTest({
            configText: `
                import { generate, convert } from 'ts-json-checker'
                const fileName = "test"
                generate<string>("test")
            `,
            eol: "\n",
        })
    ).toMatchObject({ code: expect.not.stringContaining('\r') })
)
