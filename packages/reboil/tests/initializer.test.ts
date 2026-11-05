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

describe('reboil init', () => {
  it('creates config and inserts an idempotent config import', () => {
    const root = fixture()
    const cli = path.resolve(__dirname, '../dist/cli.cjs')
    if (!fs.existsSync(cli)) return
    execFileSync(process.execPath, [cli, 'init', '--yes'], { cwd: root })
    const entry = fs.readFileSync(path.join(root, 'src/main.tsx'), 'utf8')
    expect(entry).toContain('import "../reboil.config"')
    expect(fs.existsSync(path.join(root, 'reboil.config.ts'))).toBe(true)
  })
})
