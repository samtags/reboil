#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import readline from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import * as recast from 'recast'
import babelParser from 'recast/parsers/babel'
import babelTsParser from 'recast/parsers/babel-ts'
import typescriptParser from 'recast/parsers/typescript'

interface Change {
  file: string
  before: string | null
  after: string
}

interface CliOptions {
  cwd: string
  state?: string
  entry?: string
  dryRun: boolean
  yes: boolean
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = { cwd: process.cwd(), dryRun: false, yes: false }
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    if (argument === '--state') options.state = argv[++index]
    else if (argument === '--entry') options.entry = argv[++index]
    else if (argument === '--dry-run') options.dryRun = true
    else if (argument === '--yes') options.yes = true
    else if (argument === '--help' || argument === '-h') {
      console.log('Usage: reboil init [--state <path>] [--entry <path>] [--dry-run] [--yes]')
      process.exit(0)
    } else if (argument !== 'init') {
      throw new Error(`Unknown argument: ${argument}`)
    }
  }
  return options
}

function readJson(file: string): Record<string, unknown> {
  return JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, unknown>
}

function relativeImport(fromFile: string, targetFile: string): string {
  const relative = path.relative(path.dirname(fromFile), targetFile).replaceAll(path.sep, '/').replace(/\.(tsx?|jsx?)$/, '')
  return relative.startsWith('.') ? relative : `./${relative}`
}

function findStateFile(root: string, explicit?: string): string {
  if (explicit) return path.resolve(root, explicit)
  const candidates = ['src/state.ts', 'src/store.ts', 'state.ts', 'store.ts']
  const found = candidates.map((candidate) => path.resolve(root, candidate)).filter(fs.existsSync)
  if (found.length === 1) return found[0]
  if (found.length > 1) throw new Error(`Multiple state files found. Use --state to choose one: ${found.map((file) => path.relative(root, file)).join(', ')}`)
  return path.resolve(root, 'src/state.ts')
}

function findEntryFile(root: string, packageJson: Record<string, unknown>, explicit?: string): string | null {
  if (explicit) return path.resolve(root, explicit)
  const main = typeof packageJson.main === 'string' ? packageJson.main : null
  if (main && main.startsWith('.') && fs.existsSync(path.resolve(root, main))) return path.resolve(root, main)
  const candidates = ['src/main.tsx', 'src/main.ts', 'src/index.tsx', 'src/index.ts', 'src/index.js', 'index.tsx', 'index.ts', 'index.js']
  const found = candidates.map((candidate) => path.resolve(root, candidate)).filter(fs.existsSync)
  if (found.length === 1) return found[0]
  if (found.length > 1) throw new Error(`Multiple entry files found. Use --entry to choose one: ${found.map((file) => path.relative(root, file)).join(', ')}`)
  return null
}

function isExpoRouter(packageJson: Record<string, unknown>): boolean {
  const dependencies = { ...(packageJson.dependencies as Record<string, unknown> | undefined), ...(packageJson.devDependencies as Record<string, unknown> | undefined) }
  return 'expo-router' in dependencies || packageJson.main === 'expo-router/entry'
}

function parseSource(source: string, file: string): any {
  const extension = path.extname(file).toLowerCase()
  const parser = extension === '.tsx' ? babelTsParser : extension === '.ts' ? typescriptParser : babelParser
  return recast.parse(source, { parser })
}

function addConfigImport(source: string, file: string, configImport: string): string {
  if (source.includes(configImport) && /(?:from\s+|import\s*\(|require\s*\()/.test(source)) return source
  const ast = parseSource(source, file)
  const importNode = recast.types.builders.importDeclaration([], recast.types.builders.stringLiteral(configImport))
  ast.program.body.unshift(importNode)
  return recast.print(ast).code
}

function configSource(root: string, configFile: string, stateFile: string): string {
  const stateImport = relativeImport(configFile, stateFile).replace(/\.tsx?$/, '')
  const stateReference = `./${path.relative(root, stateFile).replaceAll(path.sep, '/')}`
  return `import { createStore, defineConfig } from 'reboil'\nimport { initialState } from '${stateImport}'\n\ncreateStore(initialState)\n\nexport default defineConfig({\n  stateFile: '${stateReference}',\n})\n\ndeclare module 'reboil' {\n  interface Register {\n    state: typeof initialState\n  }\n}\n`
}

function generatedEntrySource(configFile: string, target: 'router' | 'expo'): string {
  const configImport = relativeImport(path.resolve(path.dirname(configFile), 'index.ts'), configFile)
  return target === 'router'
    ? `import '${configImport}'\nimport 'expo-router/entry'\n`
    : `import '${configImport}'\nimport 'expo/AppEntry'\n`
}

async function confirmChanges(changes: Change[]): Promise<boolean> {
  console.log('Reboil will apply these changes:')
  for (const change of changes) {
    console.log(`\n--- ${change.file} ---`)
    if (change.before === null) console.log('(new file)')
    console.log(change.after)
  }
  const prompt = readline.createInterface({ input, output })
  const answer = await prompt.question('\nApply these changes? [y/N] ')
  prompt.close()
  return answer.trim().toLowerCase() === 'y'
}

async function init(options: CliOptions): Promise<void> {
  const root = options.cwd
  const packageFile = path.resolve(root, 'package.json')
  if (!fs.existsSync(packageFile)) throw new Error(`No package.json found in ${root}`)
  const packageJson = readJson(packageFile)
  const stateFile = findStateFile(root, options.state)
  const configFile = path.resolve(root, 'reboil.config.ts')
  const changes: Change[] = []

  if (!fs.existsSync(stateFile)) {
    changes.push({ file: stateFile, before: null, after: 'export const initialState = {}\n' })
  }
  changes.push({ file: configFile, before: fs.existsSync(configFile) ? fs.readFileSync(configFile, 'utf8') : null, after: configSource(root, configFile, stateFile) })

  const main = typeof packageJson.main === 'string' ? packageJson.main : ''
  const routerEntry = isExpoRouter(packageJson) && (main === 'expo-router/entry' || main === '')
  const standardExpoEntry = !routerEntry && /expo[\\/]AppEntry/.test(main)
  let entryFile = findEntryFile(root, packageJson, options.entry)

  if (routerEntry || standardExpoEntry) {
    entryFile = path.resolve(root, 'index.ts')
    changes.push({
      file: entryFile,
      before: fs.existsSync(entryFile) ? fs.readFileSync(entryFile, 'utf8') : null,
      after: fs.existsSync(entryFile)
        ? addConfigImport(fs.readFileSync(entryFile, 'utf8'), entryFile, './reboil.config')
        : generatedEntrySource(configFile, routerEntry ? 'router' : 'expo'),
    })
    packageJson.main = './index.ts'
    changes.push({ file: packageFile, before: fs.readFileSync(packageFile, 'utf8'), after: `${JSON.stringify(packageJson, null, 2)}\n` })
  } else {
    if (!entryFile) throw new Error('Could not detect an application entry point. Use --entry <path>.')
    const importPath = relativeImport(entryFile, configFile)
    const before = fs.readFileSync(entryFile, 'utf8')
    changes.push({ file: entryFile, before, after: addConfigImport(before, entryFile, importPath) })
  }

  const shouldApply = options.dryRun || options.yes || await confirmChanges(changes)
  if (!shouldApply) {
    console.log('No changes applied.')
    return
  }
  if (options.dryRun) {
    console.log('Dry run complete; no files were written.')
    return
  }
  for (const change of changes) {
    fs.mkdirSync(path.dirname(change.file), { recursive: true })
    fs.writeFileSync(change.file, change.after)
  }
  console.log('Reboil initialized successfully.')
}

void init(parseArgs(process.argv.slice(2))).catch((error: unknown) => {
  console.error(`reboil init failed: ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
})

