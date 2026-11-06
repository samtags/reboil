import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const tag = process.argv[2]
const { version } = JSON.parse(readFileSync(join(root, 'packages', 'reboil', 'package.json'), 'utf8'))

if (tag !== `v${version}`) {
  throw new Error(`Release tag ${tag ?? '<missing>'} must exactly match @reboil/store@${version}.`)
}

console.log(`Release tag ${tag} matches @reboil/store@${version}.`)
