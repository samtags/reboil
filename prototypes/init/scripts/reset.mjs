import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { projects } from './projects.mjs'

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const fixtureRoot = path.resolve(scriptDirectory, '..')

function removeIfPresent(file) {
  if (fs.existsSync(file)) fs.rmSync(file)
}

function removeConfigImport(file) {
  if (!fs.existsSync(file)) return
  const source = fs.readFileSync(file, 'utf8')
  const cleaned = source.replace(/^import\s+['"](?:\.\.\/|\.\/)+reboil\.config['"];?\s*\r?\n?/m, '')
  if (cleaned !== source) fs.writeFileSync(file, cleaned)
}

for (const project of projects) {
  const directory = path.join(fixtureRoot, project.directory)
  removeIfPresent(path.join(directory, 'reboil.config.ts'))
  removeIfPresent(path.join(directory, 'src/state.ts'))
  removeConfigImport(path.join(directory, project.entry))

  if (project.directory === 'react/cra') removeIfPresent(path.join(directory, 'src/reboil.config.ts'))

  if (project.directory === 'expo') {
    const entry = path.join(directory, 'index.ts')
    if (
      fs.existsSync(entry) &&
      ["import './reboil.config'\nimport 'expo-router/entry'\n", "import 'expo-router/entry'\n", ''].includes(
        fs.readFileSync(entry, 'utf8'),
      )
    ) {
      removeIfPresent(entry)
    }
    const packageFile = path.join(directory, 'package.json')
    const packageJson = JSON.parse(fs.readFileSync(packageFile, 'utf8'))
    if (packageJson.main === './index.ts') {
      packageJson.main = 'expo-router/entry'
      fs.writeFileSync(packageFile, `${JSON.stringify(packageJson, null, 2)}\n`)
    }
  }

  if (project.directory === 'react/next') {
    const registerState = path.join(directory, 'src/register-state.ts')
    if (fs.existsSync(registerState) && fs.readFileSync(registerState, 'utf8').trim() === '') {
      removeIfPresent(registerState)
    }
  }
}

console.log('Reboil init fixtures reset.')
