/* global process */

import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { stdin, stdout } from 'node:process'
import { projects } from './projects.mjs'

const directory = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(directory, '..')
const repositoryRoot = path.resolve(root, '../..')

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, stdio: 'inherit' })
  if (result.status !== 0) process.exit(result.status ?? 1)
}

async function choose(prompt, choices) {
  if (!stdin.isTTY || !stdout.isTTY) {
    throw new Error('Run this verifier from an interactive terminal.')
  }

  let selectedIndex = 0
  const render = () => {
    const items = choices
      .map((choice, index) => `${index === selectedIndex ? '❯' : ' '} ${choice.label}`)
      .join('\n')
    stdout.write(`\x1B[2J\x1B[H${prompt}\n\n${items}\n\n↑/↓ Navigate • Enter Select • q Quit\n`)
  }

  return new Promise((resolve) => {
    const wasRaw = stdin.isRaw
    const cleanup = () => {
      stdin.off('data', onData)
      if (!wasRaw) stdin.setRawMode(false)
      stdout.write('\x1B[?25h')
    }
    const finish = (selection) => {
      cleanup()
      resolve(selection)
    }
    const onData = (input) => {
      switch (input.toString()) {
        case '\u0003':
        case '\u001B':
        case 'q':
        case 'Q':
          finish(undefined)
          return
        case '\r':
        case '\n':
          finish(choices[selectedIndex])
          return
        case '\u001B[A':
          selectedIndex = (selectedIndex - 1 + choices.length) % choices.length
          break
        case '\u001B[B':
          selectedIndex = (selectedIndex + 1) % choices.length
          break
        default:
          return
      }
      render()
    }

    stdin.setRawMode(true)
    stdin.resume()
    stdin.on('data', onData)
    stdout.write('\x1B[?25l')
    render()
  })
}

const project = await choose('Choose a compatibility fixture:', projects)
if (!project) process.exit(0)
const actionLabels = {
  runIOS: 'Run iOS',
  runAndroid: 'Run Android',
  buildIOS: 'Build iOS',
  buildAndroid: 'Build Android',
}
const options = [
  { id: 'install', label: 'Install dependencies and initialize Reboil' },
  { id: 'typecheck', label: 'Type-check' },
  ...Object.keys(project.actions).filter((id) => !['init', 'typecheck'].includes(id)).map((id) => ({
    id,
    label: actionLabels[id] ?? id.replace(/([A-Z])/g, ' $1').replace(/^./, (value) => value.toUpperCase()),
  })),
]
if (project.bootstrap) options.unshift({ id: 'bootstrap', label: 'Generate native iOS and Android projects' })
const action = await choose(`Choose an action for ${project.label}:`, options)
if (!action) process.exit(0)

run('npm', ['run', 'build', '--workspace', 'reboil'], repositoryRoot)
const projectRoot = path.join(root, project.directory)
if (action.id === 'bootstrap') {
  run('node', ['scripts/bootstrap-react-native.mjs', project.id], root)
} else if (action.id === 'install') {
  run('npm', ['install'], projectRoot)
  run('npm', ['run', 'reboil:init'], projectRoot)
} else {
  const [command, args] = project.actions[action.id]
  run(command, args, projectRoot)
}
