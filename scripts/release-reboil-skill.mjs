import { cpSync, existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import process from 'node:process'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const checkOnly = process.argv.includes('--check')
const skills = [
  {
    label: 'Codex',
    source: join(root, 'skills', 'reboil'),
    releases: [
      join(root, 'docs-site', 'static', 'skills', 'reboil'),
      join(root, 'packages', 'reboil', 'skills', 'codex', 'reboil'),
    ],
    requiredFiles: ['SKILL.md', 'agents/openai.yaml', 'references/contract.md'],
  },
  {
    label: 'Claude Code',
    source: join(root, '.claude', 'skills', 'reboil'),
    releases: [
      join(root, 'docs-site', 'static', 'skills', 'claude-code', 'reboil'),
      join(root, 'packages', 'reboil', 'skills', 'claude-code', 'reboil'),
    ],
    requiredFiles: ['SKILL.md', 'references/contract.md'],
  },
]

function assertSkillFiles(directory, requiredFiles) {
  for (const file of requiredFiles) {
    if (!existsSync(join(directory, file))) {
      throw new Error(`Missing Reboil skill file: ${relative(root, join(directory, file))}`)
    }
  }
}

for (const skill of skills) {
  if (!existsSync(skill.source)) {
    throw new Error(`Canonical ${skill.label} Reboil skill is missing: ${relative(root, skill.source)}`)
  }

  assertSkillFiles(skill.source, skill.requiredFiles)

  for (const release of skill.releases) {
    if (!checkOnly) {
      rmSync(release, { force: true, recursive: true })
      mkdirSync(dirname(release), { recursive: true })
      cpSync(skill.source, release, { recursive: true })
    }

    assertSkillFiles(release, skill.requiredFiles)

    for (const file of skill.requiredFiles) {
      const canonical = readFileSync(join(skill.source, file))
      const published = readFileSync(join(release, file))
      if (!canonical.equals(published)) {
        throw new Error(
          `Released ${skill.label} skill differs from its canonical source: ${file}. Run node scripts/release-reboil-skill.mjs`,
        )
      }
    }
  }
}

const codexContract = readFileSync(join(skills[0].source, 'references/contract.md'))
const claudeContract = readFileSync(join(skills[1].source, 'references/contract.md'))
if (!codexContract.equals(claudeContract)) {
  throw new Error('Codex and Claude Code Reboil contracts differ. Keep shared behavior in sync before publishing.')
}

console.log(`Reboil skill releases ${checkOnly ? 'are current' : 'published'} for Codex and Claude Code.`)
