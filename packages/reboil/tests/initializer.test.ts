import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'reboil-init-'))
  fs.mkdirSync(path.join(root, 'src'))
  fs.writeFileSync(
    path.join(root, 'package.json'),
    JSON.stringify({ name: 'fixture', main: 'src/main.tsx', dependencies: { react: '^19.0.0' } }, null, 2),
  )
  fs.writeFileSync(path.join(root, 'src/state.ts'), 'export const initialState = { count: 0 }\n')
  fs.writeFileSync(path.join(root, 'src/main.tsx'), '// existing comment\nimport App from "./App"\n')
  return root
}

function runInit(root: string, args: string[] = []): string {
  const cli = path.resolve(__dirname, '../dist/cli.cjs')
  return execFileSync(process.execPath, [cli, 'init', ...args], { cwd: root, encoding: 'utf8' })
}

function writeFixture(packageJson: Record<string, unknown>, files: Record<string, string>): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'reboil-init-'))
  fs.writeFileSync(path.join(root, 'package.json'), `${JSON.stringify(packageJson, null, 2)}\n`)
  for (const [file, source] of Object.entries(files)) {
    const target = path.join(root, file)
    fs.mkdirSync(path.dirname(target), { recursive: true })
    fs.writeFileSync(target, source)
  }
  return root
}

describe('reboil init', () => {
  it('creates config and inserts an idempotent config import', () => {
    const root = fixture()
    const output = runInit(root)
    expect(output).toContain('Project successfully boiled! Reboil is initialized.')
    expect(output).toContain('Recommended: Add agent skills via npx reboil --prepare agents')
    expect(output).toContain('https://reboil.vercel.app/docs/getting-started/quick-start#subscribe-to-state-changes')
    expect(output).not.toContain('Apply these changes?')
    const entry = fs.readFileSync(path.join(root, 'src/main.tsx'), 'utf8')
    expect(entry).toContain('import "../reboil.config"')
    expect(fs.existsSync(path.join(root, 'reboil.config.ts'))).toBe(true)

    const beforeSecondRun = fs.readFileSync(path.join(root, 'src/main.tsx'), 'utf8')
    const secondOutput = runInit(root, ['--yes'])
    expect(secondOutput).toContain('Reboil is already boiled—no changes needed.')
    expect(secondOutput).toContain('Recommended: Add agent skills via npx reboil --prepare agents')
    expect(fs.readFileSync(path.join(root, 'src/main.tsx'), 'utf8')).toBe(beforeSecondRun)
    expect(beforeSecondRun.match(/reboil\.config/g)).toHaveLength(1)
  })

  it.each([
    ['Vite React JSX', { name: 'vite', dependencies: { react: '^19.0.0' } }, 'src/main.jsx'],
    ['Parcel React JSX', { name: 'parcel', dependencies: { react: '^19.0.0' } }, 'src/index.jsx'],
    ['Vanilla Vite JavaScript', { name: 'vanilla' }, 'src/main.js'],
    ['React Native', { name: 'native', main: 'index.js', dependencies: { 'react-native': '^0.87.0' } }, 'index.js'],
  ])('detects the %s entry', (_label, packageJson, entryFile) => {
    const root = writeFixture(packageJson, {
      'src/state.ts': 'export const initialState = {}\n',
      [entryFile]: 'import App from "./App"\n',
    })
    runInit(root)
    const entry = fs.readFileSync(path.join(root, entryFile), 'utf8')
    expect(entry).toMatch(/reboil\.config/)
  })

  it('uses a source-local config for Create React App', () => {
    const root = writeFixture(
      { name: 'cra', dependencies: { 'react-scripts': '^5.0.1' } },
      { 'src/index.js': 'import App from "./App"\n', 'src/state.ts': 'export const initialState = {}\n' },
    )
    runInit(root)
    expect(fs.existsSync(path.join(root, 'src/reboil.config.ts'))).toBe(true)
    expect(fs.existsSync(path.join(root, 'reboil.config.ts'))).toBe(false)
    expect(fs.readFileSync(path.join(root, 'src/index.js'), 'utf8')).toContain('import "./reboil.config"')
  })

  it('wires a Next.js App Router layout through ReboilState', () => {
    const root = writeFixture(
      { name: 'next', dependencies: { next: '^16.0.0', react: '^19.0.0' } },
      {
        'src/app/page.tsx': 'export default function Page() { return null }\n',
        'src/app/layout.tsx':
          'export default function Layout({ children }: { children: React.ReactNode }) {\n  return <html><body>{children}</body></html>\n}\n',
      },
    )
    runInit(root)
    expect(fs.existsSync(path.join(root, 'src/register-state.ts'))).toBe(false)
    const config = fs.readFileSync(path.join(root, 'reboil.config.ts'), 'utf8')
    expect(config).toContain("'use client'")
    expect(config).toContain("import { createStore, defineConfig } from 'reboil'")
    expect(config).toContain('export default defineConfig({')
    const layout = fs.readFileSync(path.join(root, 'src/app/layout.tsx'), 'utf8')
    expect(layout).toContain('import { ReboilState } from "reboil/next"')
    expect(layout).toContain('import reboilConfig from "../../reboil.config"')
    expect(layout).toContain('<ReboilState config={reboilConfig}>')
    expect(layout).toContain('</ReboilState>')
    expect(fs.readFileSync(path.join(root, 'src/state.ts'), 'utf8')).toContain('initialState')

    runInit(root)
    expect(fs.readFileSync(path.join(root, 'src/app/layout.tsx'), 'utf8')).toBe(layout)
    expect(fs.readFileSync(path.join(root, 'reboil.config.ts'), 'utf8')).toBe(config)
  })

  it('wires an existing Next.js Pages Router custom App directly to the config', () => {
    const root = writeFixture(
      { name: 'next-pages', dependencies: { next: '^16.0.0', react: '^19.0.0' } },
      {
        'pages/_app.tsx':
          "import type { AppProps } from 'next/app'\nexport default function App({ Component, pageProps }: AppProps) {\n  return <Component {...pageProps} />\n}\n",
        'pages/index.tsx': 'export default function Page() { return null }\n',
      },
    )
    runInit(root)
    expect(fs.readFileSync(path.join(root, 'pages/_app.tsx'), 'utf8')).toMatch(/import ["']\.\.\/reboil\.config["'];?/)
    expect(fs.existsSync(path.join(root, 'register-state.ts'))).toBe(false)
  })

  it('creates a Next.js Pages Router custom App when one does not exist', () => {
    const root = writeFixture(
      { name: 'next-pages', dependencies: { next: '^16.0.0', react: '^19.0.0' } },
      {
        'pages/index.jsx': 'export default function Page() { return null }\n',
      },
    )
    runInit(root)
    const app = fs.readFileSync(path.join(root, 'pages/_app.js'), 'utf8')
    expect(app).toContain("import '../reboil.config'")
    expect(app).toContain('return <Component {...pageProps} />')
    expect(fs.existsSync(path.join(root, 'register-state.ts'))).toBe(false)
  })

  it('migrates the generated Next.js register-state bridge', () => {
    const root = writeFixture(
      { name: 'next', dependencies: { next: '^16.0.0', react: '^19.0.0' } },
      {
        'src/app/page.tsx': 'export default function Page() { return null }\n',
        'src/app/layout.tsx':
          'import ReboilRegisterState from "../register-state";\nexport default function Layout({ children }: { children: React.ReactNode }) {\n  return <html><body><ReboilRegisterState>{children}</ReboilRegisterState></body></html>\n}\n',
        'src/register-state.ts':
          "'use client'\n\nimport { Fragment, createElement, type ReactNode } from 'react'\nimport '../reboil.config'\n\nexport default function ReboilRegisterState({ children }: { children: ReactNode }) {\n  return createElement(Fragment, null, children)\n}\n",
      },
    )
    runInit(root)
    expect(fs.existsSync(path.join(root, 'src/register-state.ts'))).toBe(false)
    const layout = fs.readFileSync(path.join(root, 'src/app/layout.tsx'), 'utf8')
    expect(layout).not.toContain('ReboilRegisterState')
    expect(layout).toContain('<ReboilState config={reboilConfig}>')
  })

  it('does not replace a customized Next.js register-state bridge', () => {
    const root = writeFixture(
      { name: 'next', dependencies: { next: '^16.0.0', react: '^19.0.0' } },
      {
        'src/app/page.tsx': 'export default function Page() { return null }\n',
        'src/app/layout.tsx':
          'import CustomRegistration from "../register-state"\nexport default function Layout({ children }: { children: React.ReactNode }) {\n  return <html><body><CustomRegistration>{children}</CustomRegistration></body></html>\n}\n',
        'src/register-state.ts':
          "'use client'\nexport default function CustomRegistration({ children }: { children: React.ReactNode }) { return children }\n",
      },
    )
    expect(() => runInit(root)).toThrow(/Custom Next\.js registration file detected/)
    expect(fs.existsSync(path.join(root, 'src/register-state.ts'))).toBe(true)
  })

  it('uses ReboilState for an explicit Next.js layout entry', () => {
    const root = writeFixture(
      { name: 'next', dependencies: { next: '^16.0.0', react: '^19.0.0' } },
      {
        'src/custom-layout.tsx':
          'export default function Layout({ children }: { children: React.ReactNode }) {\n  return <html><body>{children}</body></html>\n}\n',
      },
    )
    runInit(root, ['--entry', 'src/custom-layout.tsx'])
    const layout = fs.readFileSync(path.join(root, 'src/custom-layout.tsx'), 'utf8')
    expect(layout).toContain('import { ReboilState } from "reboil/next"')
    expect(layout).toContain('<ReboilState config={reboilConfig}>')
  })

  it('creates an Expo Router custom entry before expo-router/entry', () => {
    const root = writeFixture(
      { name: 'expo', main: 'expo-router/entry', dependencies: { expo: '^58.0.0', 'expo-router': '^6.0.0' } },
      { 'src/app/index.tsx': 'export default function Page() { return null }\n' },
    )
    runInit(root)
    expect(fs.readFileSync(path.join(root, 'index.ts'), 'utf8')).toBe(
      "import './reboil.config'\nimport 'expo-router/entry'\n",
    )
    expect(JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).main).toBe('./index.ts')

    runInit(root)
    expect(fs.readFileSync(path.join(root, 'index.ts'), 'utf8')).toBe(
      "import './reboil.config'\nimport 'expo-router/entry'\n",
    )
  })
})
