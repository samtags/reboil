import assert from 'node:assert/strict'
import test from 'node:test'
import { isValidPullRequestTitle } from './check-pr-title.mjs'

test('accepts supported pull request titles', () => {
  const validTitles = [
    'feat: add selector subscriptions',
    'fix(cli): preserve entry imports',
    'docs(agent-skill): explain release synchronization',
    'refactor(runtime)!: change persistence ordering',
  ]

  for (const title of validTitles) assert.equal(isValidPullRequestTitle(title), true, title)
})

test('rejects unsupported or incomplete pull request titles', () => {
  const invalidTitles = [
    'Add selector subscriptions',
    'feature: add selector subscriptions',
    'feat: ',
    'feat(React): add selector subscriptions',
  ]

  for (const title of invalidTitles) assert.equal(isValidPullRequestTitle(title), false, title)
})
