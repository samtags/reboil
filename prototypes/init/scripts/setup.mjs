import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { projects } from './projects.mjs'

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const fixtureRoot = path.resolve(scriptDirectory, '..')
const repositoryRoot = path.resolve(fixtureRoot, '../..')

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, stdio: 'inherit' })
  if (result.status !== 0) process.exit(result.status ?? 1)
}

run('npm', ['run', 'build', '--workspace', 'reboil'], repositoryRoot)
for (const project of projects) {
  console.log(`\nInstalling ${project.name} dependencies...`)
  run('npm', ['install'], path.join(fixtureRoot, project.directory))
}
