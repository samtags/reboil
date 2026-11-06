import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const packageDirectory = join(root, 'packages', 'reboil')
const packageJson = JSON.parse(readFileSync(join(packageDirectory, 'package.json'), 'utf8'))
const requiredFiles = [
  'README.md',
  'AGENTS.md',
  'llms.txt',
  'skills/codex/reboil/SKILL.md',
  'skills/codex/reboil/references/contract.md',
  'skills/claude-code/reboil/SKILL.md',
  'skills/claude-code/reboil/references/contract.md',
]

for (const file of requiredFiles) {
  if (!existsSync(join(packageDirectory, file))) {
    throw new Error(`Missing published Reboil package file: packages/reboil/${file}`)
  }
}

for (const [file, requiredText] of [
  ['README.md', 'npm install reboil'],
  ['AGENTS.md', 'npx reboil init'],
  ['llms.txt', 'createStore(initialState, options?)'],
]) {
  const content = readFileSync(join(packageDirectory, file), 'utf8')
  if (!content.includes(requiredText)) {
    throw new Error(`Published Reboil package guide is incomplete: packages/reboil/${file}`)
  }
}

for (const file of ['README.md', 'AGENTS.md', 'llms.txt', 'dist', 'skills']) {
  if (!packageJson.files.includes(file)) {
    throw new Error(`packages/reboil/package.json must publish ${file}`)
  }
}

if (
  packageJson.publishConfig?.access !== 'public' ||
  packageJson.publishConfig?.registry !== 'https://registry.npmjs.org/'
) {
  throw new Error('Reboil must publish publicly to the npm registry.')
}

if (!packageJson.repository?.url || !packageJson.homepage || !packageJson.bugs?.url) {
  throw new Error('Reboil must provide repository, homepage, and issue metadata.')
}

if (!process.argv.includes('--tarball')) {
  console.log('Reboil package metadata and agent guides are ready.')
  process.exit(0)
}

const packed = JSON.parse(
  execFileSync('npm', ['pack', '--workspace', 'reboil', '--dry-run', '--json', '--ignore-scripts'], {
    cwd: root,
    encoding: 'utf8',
  }),
)
const packedFiles = new Set(packed[0]?.files?.map(({ path }) => path))

for (const file of requiredFiles) {
  if (!packedFiles.has(file)) {
    throw new Error(`npm pack would omit required Reboil file: ${file}`)
  }
}

if ([...packedFiles].some((file) => file.endsWith('.map'))) {
  throw new Error('npm pack must not include generated source maps.')
}

console.log(`Reboil tarball is ready (${packed[0].entryCount} files, ${packed[0].size} bytes compressed).`)
