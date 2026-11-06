import { mkdtempSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const fixtureRoot = path.resolve(scriptDirectory, '..')

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, stdio: 'inherit' })
  if (result.status !== 0) throw new Error(`${command} ${args.join(' ')} failed in ${cwd}`)
}

try {
  run('node', ['scripts/reset.mjs'], fixtureRoot)
  run('node', ['scripts/run-init.mjs', '--yes'], fixtureRoot)
  run('node', ['scripts/run-init.mjs', '--yes'], fixtureRoot)

  const webBuilds = ['react/cra', 'react/parcel', 'react/vite', 'react/next', 'vanilla']
  for (const directory of webBuilds) run('npm', ['run', 'build'], path.join(fixtureRoot, directory))

  const nativeBundle = mkdtempSync(path.join(os.tmpdir(), 'reboil-init-rn-'))
  run(
    'npx',
    [
      'react-native',
      'bundle',
      '--platform',
      'android',
      '--dev',
      'false',
      '--entry-file',
      'index.js',
      '--bundle-output',
      path.join(nativeBundle, 'index.android.bundle'),
      '--assets-dest',
      path.join(nativeBundle, 'assets'),
    ],
    path.join(fixtureRoot, 'react-native'),
  )

  const expoExport = mkdtempSync(path.join(os.tmpdir(), 'reboil-init-expo-'))
  run('npx', ['expo', 'export', '--platform', 'android', '--output-dir', expoExport], path.join(fixtureRoot, 'expo'))
  console.log('\nAll Reboil init fixtures verified.')
} finally {
  run('node', ['scripts/reset.mjs'], fixtureRoot)
}
