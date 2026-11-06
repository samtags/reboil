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

function runInit(root: string) {
  const cli = path.resolve(__dirname, '../dist/cli.cjs')
  execFileSync(process.execPath, [cli, 'init', '--yes'], { cwd: root })
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
    runInit(root)
    const entry = fs.readFileSync(path.join(root, 'src/main.tsx'), 'utf8')
    expect(entry).toContain('import "../reboil.config"')
    expect(fs.existsSync(path.join(root, 'reboil.config.ts'))).toBe(true)

    const beforeSecondRun = fs.readFileSync(path.join(root, 'src/main.tsx'), 'utf8')
    runInit(root)
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

  it('creates a Next.js register-state entry', () => {
    const root = writeFixture(
      { name: 'next', dependencies: { next: '^16.0.0', react: '^19.0.0' } },
      { 'src/app/page.tsx': 'export default function Page() { return null }\n' },
    )
    runInit(root)
    expect(fs.readFileSync(path.join(root, 'src/register-state.ts'), 'utf8')).toContain("import '../reboil.config'")
    expect(fs.readFileSync(path.join(root, 'src/state.ts'), 'utf8')).toContain('initialState')
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
