import { pathToFileURL } from 'node:url'

const allowedTypes = ['feat', 'fix', 'docs', 'refactor', 'perf', 'test', 'build', 'ci', 'chore', 'revert']
const titlePattern = new RegExp(`^(?:${allowedTypes.join('|')})(?:\\([a-z0-9][a-z0-9._/-]*\\))?!?: \\S(?:.*\\S)?$`)

export function isValidPullRequestTitle(title) {
  return titlePattern.test(title)
}

function main() {
  const title = process.argv.slice(2).join(' ').trim()

  if (!title) {
    console.error('Usage: node scripts/check-pr-title.mjs "type(scope): description"')
    process.exitCode = 1
    return
  }

  if (!isValidPullRequestTitle(title)) {
    console.error(`Invalid pull request title: ${title}`)
    console.error(`Use one of: ${allowedTypes.join(', ')}`)
    console.error('Expected format: type(optional-scope): description')
    process.exitCode = 1
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main()
