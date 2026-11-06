/* global console, process */

import { cpSync, existsSync, mkdtempSync, rmSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { projects } from './projects.mjs'

const requested = process.argv[2]
const project = projects.find((candidate) => candidate.id === requested && candidate.bootstrap)
if (!project) throw new Error('Pass react-native-075 or react-native-088.')

const versions = {
  'react-native-075': '0.75.5',
  'react-native-077': '0.77.3',
  'react-native-088': '0.88.1',
}
const version = versions[project.id]
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(scriptDirectory, '..')
const destination = path.join(root, project.directory)
if (existsSync(path.join(destination, 'ios')) || existsSync(path.join(destination, 'android'))) {
  throw new Error(`${project.label} already has generated native projects. Remove only those generated folders before bootstrapping again.`)
}

const temporary = mkdtempSync(path.join(os.tmpdir(), 'reboil-rn-bootstrap-'))
try {
  const result = spawnSync(
    'npx',
    ['@react-native-community/cli@latest', 'init', 'ReboilSupportedProject', '--version', version, '--skip-install'],
    { cwd: temporary, stdio: 'inherit' },
  )
  if (result.status !== 0) process.exit(result.status ?? 1)
  const generated = path.join(temporary, 'ReboilSupportedProject')
  // The fixture owns its Babel and Metro configuration because those files
  // contain the local Reboil package resolution required by this matrix.
  for (const file of ['android', 'ios', 'Gemfile']) {
    const source = path.join(generated, file)
    if (existsSync(source)) cpSync(source, path.join(destination, file), { recursive: true })
  }
  console.log(`Generated native projects for ${project.label}. Run install/init next.`)
} finally {
  rmSync(temporary, { recursive: true, force: true })
}
