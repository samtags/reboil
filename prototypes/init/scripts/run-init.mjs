import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { projects } from './projects.mjs'

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const fixtureRoot = path.resolve(scriptDirectory, '..')
const yes = process.argv.includes('--yes')

for (const project of projects) {
  const directory = path.join(fixtureRoot, project.directory)
  console.log(`\n=== ${project.name} (${project.directory}) ===`)
  const args = ['run', 'reboil:init']
  if (yes) args.push('--', '--yes')
  const result = spawnSync('npm', args, { cwd: directory, stdio: 'inherit' })
  if (result.status !== 0) process.exit(result.status ?? 1)
}
