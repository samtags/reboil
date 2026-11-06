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
  after: string | null
}

interface CliOptions {
  cwd: string
  state?: string
  entry?: string
  dryRun: boolean
  yes: boolean
}

type Framework = 'expo-router' | 'expo' | 'next' | 'cra' | 'react-native' | 'generic'

interface AstNode {
  type?: string
  name?: string | AstNode
  value?: unknown
  source?: AstNode
  imported?: AstNode
  local?: AstNode
  specifiers?: AstNode[]
  expression?: AstNode
  callee?: AstNode
  arguments?: AstNode[]
  openingElement?: AstNode
  attributes?: AstNode[]
  children?: AstNode[]
}

const sourceExtensions = ['tsx', 'jsx', 'ts', 'js', 'mts', 'mjs'] as const

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

function dependenciesOf(packageJson: Record<string, unknown>): Record<string, unknown> {
  return {
    ...(packageJson.dependencies as Record<string, unknown> | undefined),
    ...(packageJson.devDependencies as Record<string, unknown> | undefined),
  }
}

function detectFramework(packageJson: Record<string, unknown>): Framework {
  const dependencies = dependenciesOf(packageJson)
  if ('expo-router' in dependencies || packageJson.main === 'expo-router/entry') return 'expo-router'
  if ('expo' in dependencies || (typeof packageJson.main === 'string' && /expo[\\/]AppEntry/.test(packageJson.main))) {
    return 'expo'
  }
  if ('next' in dependencies) return 'next'
  if ('react-scripts' in dependencies) return 'cra'
  if ('react-native' in dependencies) return 'react-native'
  return 'generic'
}

function relativeImport(fromFile: string, targetFile: string): string {
  const relative = path
    .relative(path.dirname(fromFile), targetFile)
    .replaceAll(path.sep, '/')
    .replace(/\.(tsx?|jsx?)$/, '')
  return relative.startsWith('.') ? relative : `./${relative}`
}

function findStateFile(root: string, explicit?: string): string {
  if (explicit) return path.resolve(root, explicit)
  const candidates = ['src/state.ts', 'src/store.ts', 'state.ts', 'store.ts']
  const found = candidates.map((candidate) => path.resolve(root, candidate)).filter(fs.existsSync)
  if (found.length === 1) return found[0]
  if (found.length > 1)
    throw new Error(
      `Multiple state files found. Use --state to choose one: ${found.map((file) => path.relative(root, file)).join(', ')}`,
    )
  return path.resolve(root, 'src/state.ts')
}

function findEntryFile(root: string, packageJson: Record<string, unknown>, explicit?: string): string | null {
  if (explicit) return path.resolve(root, explicit)
  const main = typeof packageJson.main === 'string' ? packageJson.main : null
  if (main && fs.existsSync(path.resolve(root, main))) return path.resolve(root, main)
  const candidates = [
    ...sourceExtensions.map((extension) => `src/main.${extension}`),
    ...sourceExtensions.map((extension) => `src/index.${extension}`),
    ...sourceExtensions.map((extension) => `index.${extension}`),
  ]
  const found = candidates.map((candidate) => path.resolve(root, candidate)).filter(fs.existsSync)
  if (found.length === 1) return found[0]
  if (found.length > 1)
    throw new Error(
      `Multiple entry files found. Use --entry to choose one: ${found.map((file) => path.relative(root, file)).join(', ')}`,
    )
  return null
}

function parseSource(source: string, file: string): ReturnType<typeof recast.parse> {
  const extension = path.extname(file).toLowerCase()
  const parser = extension === '.tsx' ? babelTsParser : extension === '.ts' ? typescriptParser : babelParser
  return recast.parse(source, { parser })
}

function addConfigImport(source: string, file: string, configImport: string): string {
  const ast = parseSource(source, file)
  const normalizedImport = configImport.replace(/\.(?:[cm]?[jt]sx?)$/, '')
  const hasConfigImport = (ast.program.body as AstNode[]).some((node) => {
    if (node.type === 'ImportDeclaration') {
      const value = typeof node.source?.value === 'string' ? node.source.value : ''
      return value.replace(/\.(?:[cm]?[jt]sx?)$/, '') === normalizedImport
    }
    if (node.type !== 'ExpressionStatement' || node.expression?.type !== 'CallExpression') return false
    const callee = node.expression.callee
    const firstArgument = node.expression.arguments?.[0]
    const value = typeof firstArgument?.value === 'string' ? firstArgument.value : ''
    return (
      ((callee?.type === 'Identifier' && callee.name === 'require') ||
        (callee?.type === 'Import' && typeof value === 'string')) &&
      value.replace(/\.(?:[cm]?[jt]sx?)$/, '') === normalizedImport
    )
  })
  if (hasConfigImport) return source
  const importNode = recast.types.builders.importDeclaration([], recast.types.builders.stringLiteral(configImport))
  ast.program.body.unshift(importNode)
  return recast.print(ast).code
}

function configSource(root: string, configFile: string, stateFile: string, framework: Framework): string {
  const stateImport = relativeImport(configFile, stateFile).replace(/\.tsx?$/, '')
  const stateReference = `./${path.relative(root, stateFile).replaceAll(path.sep, '/')}`
  if (framework === 'next') {
    return `'use client'\n\nimport { createStore, defineConfig } from 'reboil'\nimport { initialState } from '${stateImport}'\n\ncreateStore(initialState)\n\nexport default defineConfig({\n  stateFile: '${stateReference}',\n})\n\ndeclare module 'reboil' {\n  interface Register {\n    state: typeof initialState\n  }\n}\n`
  }
  return `import { createStore, defineConfig } from 'reboil'\nimport { initialState } from '${stateImport}'\n\ncreateStore(initialState)\n\nexport default defineConfig({\n  stateFile: '${stateReference}',\n})\n\ndeclare module 'reboil' {\n  interface Register {\n    state: typeof initialState\n  }\n}\n`
}

function generatedEntrySource(configFile: string, target: 'router' | 'expo'): string {
  const configImport = relativeImport(path.resolve(path.dirname(configFile), 'index.ts'), configFile)
  return target === 'router'
    ? `import '${configImport}'\nimport 'expo-router/entry'\n`
    : `import '${configImport}'\nimport 'expo/AppEntry'\n`
}

function nextRegisterStateFile(root: string): string {
  const srcDirectory = path.resolve(root, 'src')
  const usesSrc = fs.existsSync(path.resolve(srcDirectory, 'app')) || fs.existsSync(path.resolve(srcDirectory, 'pages'))
  return path.resolve(usesSrc ? srcDirectory : root, 'register-state.ts')
}

function findSourceFile(directory: string, basename: string): string | null {
  for (const extension of sourceExtensions) {
    const candidate = path.resolve(directory, `${basename}.${extension}`)
    if (fs.existsSync(candidate)) return candidate
  }
  return null
}

function findFiles(directory: string, basename: string): string[] {
  if (!fs.existsSync(directory)) return []
  const found: string[] = []
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const target = path.resolve(directory, entry.name)
    if (entry.isDirectory()) found.push(...findFiles(target, basename))
    else if (sourceExtensions.some((extension) => entry.name === `${basename}.${extension}`)) found.push(target)
  }
  return found
}

function nextAppLayouts(root: string): string[] {
  const appDirectories = [path.resolve(root, 'src/app'), path.resolve(root, 'app')].filter(fs.existsSync)
  const layouts = appDirectories.flatMap((directory) => findFiles(directory, 'layout'))
  return layouts.filter(
    (layout) =>
      !layouts.some(
        (other) => other !== layout && path.dirname(layout).startsWith(`${path.dirname(other)}${path.sep}`),
      ),
  )
}

function nextPagesApps(root: string): Array<{ file: string; source: string | null }> {
  const pageDirectories = [path.resolve(root, 'src/pages'), path.resolve(root, 'pages')].filter(fs.existsSync)
  return pageDirectories.map((directory) => {
    const existing = findSourceFile(directory, '_app')
    if (existing) return { file: existing, source: fs.readFileSync(existing, 'utf8') }
    const usesTypeScript =
      fs.existsSync(path.resolve(root, 'tsconfig.json')) ||
      findFiles(directory, 'index').some((file) => /\.tsx?$/.test(file))
    return { file: path.resolve(directory, usesTypeScript ? '_app.tsx' : '_app.js'), source: null }
  })
}

function normalizedImport(value: string): string {
  return value.replace(/\.(?:[cm]?[jt]sx?)$/, '')
}

function importDeclaration(body: AstNode[], source: string): AstNode | undefined {
  const normalizedSource = normalizedImport(source)
  return body.find(
    (node) =>
      node.type === 'ImportDeclaration' &&
      typeof node.source?.value === 'string' &&
      normalizedImport(node.source.value) === normalizedSource,
  )
}

function removeImport(body: AstNode[], source: string): string | undefined {
  const declaration = importDeclaration(body, source)
  if (!declaration) return undefined
  const defaultName = declaration.specifiers?.find((specifier) => specifier.type === 'ImportDefaultSpecifier')?.local
    ?.name
  const index = body.indexOf(declaration)
  body.splice(index, 1)
  return typeof defaultName === 'string' ? defaultName : undefined
}

function ensureDefaultImport(body: AstNode[], source: string, preferredName: string): string {
  let declaration = importDeclaration(body, source)
  const defaultName = declaration?.specifiers?.find((specifier) => specifier.type === 'ImportDefaultSpecifier')?.local
    ?.name
  if (typeof defaultName === 'string') return defaultName

  const specifier = recast.types.builders.importDefaultSpecifier(recast.types.builders.identifier(preferredName))
  if (declaration) {
    declaration.specifiers = [specifier as unknown as AstNode, ...(declaration.specifiers ?? [])]
  } else {
    declaration = recast.types.builders.importDeclaration(
      [specifier],
      recast.types.builders.stringLiteral(source),
    ) as unknown as AstNode
    body.unshift(declaration)
  }
  return preferredName
}

function ensureNamedImport(body: AstNode[], source: string, importedName: string, preferredName: string): string {
  let declaration = importDeclaration(body, source)
  const existing = declaration?.specifiers?.find(
    (specifier) =>
      specifier.type === 'ImportSpecifier' &&
      (specifier.imported?.name === importedName || specifier.imported?.value === importedName),
  )?.local?.name
  if (typeof existing === 'string') return existing

  const specifier = recast.types.builders.importSpecifier(
    recast.types.builders.identifier(importedName),
    recast.types.builders.identifier(preferredName),
  )
  if (declaration) {
    declaration.specifiers = [...(declaration.specifiers ?? []), specifier as unknown as AstNode]
  } else {
    declaration = recast.types.builders.importDeclaration(
      [specifier],
      recast.types.builders.stringLiteral(source),
    ) as unknown as AstNode
    body.unshift(declaration)
  }
  return preferredName
}

function findJsxElement(node: unknown, name: string): AstNode | null {
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findJsxElement(child, name)
      if (found) return found
    }
    return null
  }
  if (typeof node !== 'object' || node === null) return null
  const astNode = node as AstNode
  if (
    astNode.type === 'JSXElement' &&
    astNode.openingElement?.type === 'JSXOpeningElement' &&
    typeof astNode.openingElement.name === 'object' &&
    astNode.openingElement.name !== null &&
    astNode.openingElement.name.name === name
  ) {
    return astNode
  }
  for (const [key, value] of Object.entries(node)) {
    if (key === 'loc' || key === 'comments' || key === 'tokens') continue
    const found = findJsxElement(value, name)
    if (found) return found
  }
  return null
}

function sourceContainsJsxElement(source: string, file: string, name: string): boolean {
  return findJsxElement(parseSource(source, file).program, name) !== null
}

function jsxElementName(node: AstNode): string | undefined {
  const name = node.openingElement?.name
  return typeof name === 'object' && name !== null && typeof name.name === 'string' ? name.name : undefined
}

function unwrapDirectJsxElement(parent: AstNode, name: string): void {
  const children = parent.children ?? []
  const index = children.findIndex((child) => child.type === 'JSXElement' && jsxElementName(child) === name)
  if (index < 0) return
  const wrapper = children[index]
  children.splice(index, 1, ...(wrapper.children ?? []))
  parent.children = children
}

function addNextAppRegistration(
  source: string,
  file: string,
  configImport: string,
  legacyRegisterImport?: string,
): string {
  const ast = parseSource(source, file)
  const body = ast.program.body as AstNode[]
  const legacyComponentName = legacyRegisterImport ? removeImport(body, legacyRegisterImport) : undefined
  const configName = ensureDefaultImport(body, configImport, 'reboilConfig')
  const componentName = ensureNamedImport(body, 'reboil/next', 'ReboilState', 'ReboilState')

  const bodyElement = findJsxElement(ast.program, 'body')
  if (!bodyElement) throw new Error(`Could not find a <body> element in Next.js root layout ${file}`)
  if (legacyComponentName) unwrapDirectJsxElement(bodyElement, legacyComponentName)
  if (
    !(bodyElement.children ?? []).some(
      (child) => child.type === 'JSXElement' && jsxElementName(child) === componentName,
    )
  ) {
    const existingChildren = (bodyElement.children ?? []) as unknown as Parameters<
      typeof recast.types.builders.jsxElement
    >[2]
    const registrationElement = recast.types.builders.jsxElement(
      recast.types.builders.jsxOpeningElement(
        recast.types.builders.jsxIdentifier(componentName),
        [
          recast.types.builders.jsxAttribute(
            recast.types.builders.jsxIdentifier('config'),
            recast.types.builders.jsxExpressionContainer(recast.types.builders.identifier(configName)),
          ),
        ],
        false,
      ),
      recast.types.builders.jsxClosingElement(recast.types.builders.jsxIdentifier(componentName)),
      existingChildren,
    ) as unknown as AstNode
    bodyElement.children = [registrationElement]
  }

  return recast.print(ast).code
}

function legacyNextRegisterStateSource(registerFile: string, configFile: string): string {
  return `'use client'\n\nimport { Fragment, createElement, type ReactNode } from 'react'\nimport '${relativeImport(registerFile, configFile)}'\n\nexport default function ReboilRegisterState({ children }: { children: ReactNode }) {\n  return createElement(Fragment, null, children)\n}\n`
}

function isGeneratedRegisterState(source: string, registerFile: string, configFile: string): boolean {
  if (source === legacyNextRegisterStateSource(registerFile, configFile)) return true
  const ast = parseSource(source, registerFile)
  const body = ast.program.body as AstNode[]
  return (
    body.length === 1 &&
    body[0].type === 'ImportDeclaration' &&
    (body[0].specifiers?.length ?? 0) === 0 &&
    typeof body[0].source?.value === 'string' &&
    normalizedImport(body[0].source.value) === normalizedImport(relativeImport(registerFile, configFile))
  )
}

function removeImportFromSource(source: string, file: string, importPath: string): string {
  const ast = parseSource(source, file)
  const body = ast.program.body as AstNode[]
  if (!importDeclaration(body, importPath)) return source
  removeImport(body, importPath)
  return recast.print(ast).code
}

function sourceImports(source: string, file: string, importPath: string): boolean {
  const ast = parseSource(source, file)
  return importDeclaration(ast.program.body as AstNode[], importPath) !== undefined
}

function generatedPagesAppSource(file: string, configFile: string): string {
  const configImport = relativeImport(file, configFile)
  const typeImport = /\.tsx?$/.test(file) ? "import type { AppProps } from 'next/app'\n" : ''
  const parameterType = /\.tsx?$/.test(file) ? ': AppProps' : ''
  return `${typeImport}import '${configImport}'\n\nexport default function App({ Component, pageProps }${parameterType}) {\n  return <Component {...pageProps} />\n}\n`
}

async function confirmChanges(changes: Change[]): Promise<boolean> {
  console.log('Reboil will apply these changes:')
  for (const change of changes) {
    console.log(`\n--- ${change.file} ---`)
    if (change.before === null) console.log('(new file)')
    if (change.after === null) console.log('(delete file)')
    else console.log(change.after)
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
  const framework = detectFramework(packageJson)
  const stateFile = findStateFile(root, options.state)
  const configFile = path.resolve(root, framework === 'cra' ? 'src/reboil.config.ts' : 'reboil.config.ts')
  const changes: Change[] = []

  if (!fs.existsSync(stateFile)) {
    changes.push({ file: stateFile, before: null, after: 'export const initialState = {}\n' })
  }
  changes.push({
    file: configFile,
    before: fs.existsSync(configFile) ? fs.readFileSync(configFile, 'utf8') : null,
    after: configSource(root, configFile, stateFile, framework),
  })

  const main = typeof packageJson.main === 'string' ? packageJson.main : ''
  const routerEntry = framework === 'expo-router' && (main === 'expo-router/entry' || main === '')
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
    changes.push({
      file: packageFile,
      before: fs.readFileSync(packageFile, 'utf8'),
      after: `${JSON.stringify(packageJson, null, 2)}\n`,
    })
  } else if (framework === 'next' && options.entry) {
    if (!entryFile || !fs.existsSync(entryFile)) {
      throw new Error(`Next.js entry file not found: ${options.entry}`)
    }
    const before = fs.readFileSync(entryFile, 'utf8')
    changes.push({
      file: entryFile,
      before,
      after: sourceContainsJsxElement(before, entryFile, 'body')
        ? addNextAppRegistration(before, entryFile, relativeImport(entryFile, configFile))
        : addConfigImport(before, entryFile, relativeImport(entryFile, configFile)),
    })
  } else if (framework === 'next') {
    const registerFile = nextRegisterStateFile(root)
    const appLayouts = nextAppLayouts(root)
    const pagesApps = nextPagesApps(root)
    if (appLayouts.length === 0 && pagesApps.length === 0) {
      throw new Error('Could not detect a Next.js root layout or pages directory. Use --entry <path>.')
    }

    const registerSource = fs.existsSync(registerFile) ? fs.readFileSync(registerFile, 'utf8') : null
    const registerIsImported =
      appLayouts.some((layout) =>
        sourceImports(fs.readFileSync(layout, 'utf8'), layout, relativeImport(layout, registerFile)),
      ) ||
      pagesApps.some(
        ({ file, source }) => source !== null && sourceImports(source, file, relativeImport(file, registerFile)),
      )
    if (
      registerSource !== null &&
      registerIsImported &&
      !isGeneratedRegisterState(registerSource, registerFile, configFile)
    ) {
      throw new Error(
        `Custom Next.js registration file detected at ${registerFile}. Remove its layout/_app integration before running reboil init.`,
      )
    }
    if (registerSource !== null && isGeneratedRegisterState(registerSource, registerFile, configFile)) {
      changes.push({ file: registerFile, before: registerSource, after: null })
    }

    for (const layout of appLayouts) {
      const before = fs.readFileSync(layout, 'utf8')
      changes.push({
        file: layout,
        before,
        after: addNextAppRegistration(
          before,
          layout,
          relativeImport(layout, configFile),
          relativeImport(layout, registerFile),
        ),
      })
    }
    for (const pagesApp of pagesApps) {
      const withoutLegacyImport =
        pagesApp.source === null
          ? null
          : removeImportFromSource(pagesApp.source, pagesApp.file, relativeImport(pagesApp.file, registerFile))
      changes.push({
        file: pagesApp.file,
        before: pagesApp.source,
        after:
          withoutLegacyImport === null
            ? generatedPagesAppSource(pagesApp.file, configFile)
            : addConfigImport(withoutLegacyImport, pagesApp.file, relativeImport(pagesApp.file, configFile)),
      })
    }
  } else {
    if (!entryFile) throw new Error('Could not detect an application entry point. Use --entry <path>.')
    const importPath = relativeImport(entryFile, configFile)
    const before = fs.readFileSync(entryFile, 'utf8')
    changes.push({ file: entryFile, before, after: addConfigImport(before, entryFile, importPath) })
  }

  const effectiveChanges = changes.filter((change) => change.before !== change.after)
  if (effectiveChanges.length === 0) {
    console.log('Reboil is already initialized; no changes needed.')
    return
  }

  const shouldApply = options.dryRun || options.yes || (await confirmChanges(effectiveChanges))
  if (!shouldApply) {
    console.log('No changes applied.')
    return
  }
  if (options.dryRun) {
    console.log('Dry run complete; no files were written.')
    return
  }
  for (const change of effectiveChanges) {
    if (change.after === null) {
      if (fs.existsSync(change.file)) fs.rmSync(change.file)
    } else {
      fs.mkdirSync(path.dirname(change.file), { recursive: true })
      fs.writeFileSync(change.file, change.after)
    }
  }
  console.log('Reboil initialized successfully.')
}

void init(parseArgs(process.argv.slice(2))).catch((error: unknown) => {
  console.error(`reboil init failed: ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
})
