import * as fs from 'fs'
import * as path from 'path'
import { FgWhite, Reset, Bright, FgYellow, FgCyan, FgGreen, FgMagenta, FgRed } from './colors';
import { debug, info, logOption } from './logger'
import { generate } from './ts-json-func'

logOption.isDebug = false

debug(FgWhite + 'initialize...' + Reset)

const baseDir = process.cwd()

const configFile = process.argv.length >= 3 ? process.argv[2] : 'ts-json-config.ts'
const configDir = path.dirname(configFile)
info(Bright + FgWhite + 'config:', FgGreen + configFile + Reset)

const tsJsonFile = path.relative(baseDir, path.join(__dirname, '../src/index.ts'))
info(Bright + FgWhite + 'tsJson:', FgGreen + tsJsonFile + Reset)

const result = generate({
    tsJsonFile,
    configFile,
    resolve: fileName => {
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

const outputFile = path.join(configDir, result.fileName)
info(Bright + FgWhite + 'output:', FgGreen + outputFile + Reset)
fs.writeFileSync(outputFile, result.code)
