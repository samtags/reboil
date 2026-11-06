import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { prepareAgentSkills } from '../src/prepare-agents'

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'reboil-agents-'))
  const skillsDirectory = path.join(root, 'bundled-skills')
  fs.mkdirSync(path.join(skillsDirectory, 'claude-code/reboil/references'), { recursive: true })
  fs.mkdirSync(path.join(skillsDirectory, 'codex/reboil/agents'), { recursive: true })
  fs.mkdirSync(path.join(skillsDirectory, 'codex/reboil/references'), { recursive: true })
  fs.writeFileSync(path.join(skillsDirectory, 'claude-code/reboil/SKILL.md'), 'claude skill\n')
  fs.writeFileSync(path.join(skillsDirectory, 'claude-code/reboil/references/contract.md'), 'contract\n')
  fs.writeFileSync(path.join(skillsDirectory, 'codex/reboil/SKILL.md'), 'codex skill\n')
  fs.writeFileSync(path.join(skillsDirectory, 'codex/reboil/agents/openai.yaml'), 'interface: {}\n')
  fs.writeFileSync(path.join(skillsDirectory, 'codex/reboil/references/contract.md'), 'contract\n')
  return { root, skillsDirectory }
}

describe('agent skill preparation', () => {
  it('installs the selected project-local agent skills', async () => {
    const { root, skillsDirectory } = fixture()
    const result = await prepareAgentSkills({
      root,
      skillsDirectory,
      selected: ['claude-code', 'codex'],
      confirmReplacement: async () => false,
    })

    expect(result.installed.map((agent) => agent.id)).toEqual(['claude-code', 'codex'])
    expect(fs.readFileSync(path.join(root, '.claude/skills/reboil/SKILL.md'), 'utf8')).toBe('claude skill\n')
    expect(fs.readFileSync(path.join(root, '.agents/skills/reboil/agents/openai.yaml'), 'utf8')).toBe('interface: {}\n')
  })

  it('recognizes byte-identical skills without asking to replace them', async () => {
    const { root, skillsDirectory } = fixture()
    const destination = path.join(root, '.agents/skills')
    fs.mkdirSync(destination, { recursive: true })
    fs.cpSync(path.join(skillsDirectory, 'codex/reboil'), path.join(destination, 'reboil'), { recursive: true })
    const confirmReplacement = vi.fn(async () => false)

    const result = await prepareAgentSkills({
      root,
      skillsDirectory,
      selected: ['codex'],
      confirmReplacement,
    })

    expect(result.ready.map((agent) => agent.id)).toEqual(['codex'])
    expect(confirmReplacement).not.toHaveBeenCalled()
  })

  it('preserves a customized skill when replacement is declined', async () => {
    const { root, skillsDirectory } = fixture()
    const destination = path.join(root, '.claude/skills/reboil')
    fs.mkdirSync(destination, { recursive: true })
    fs.writeFileSync(path.join(destination, 'SKILL.md'), 'customized skill\n')

    const result = await prepareAgentSkills({
      root,
      skillsDirectory,
      selected: ['claude-code'],
      confirmReplacement: async () => false,
    })

    expect(result.skipped.map((agent) => agent.id)).toEqual(['claude-code'])
    expect(fs.readFileSync(path.join(destination, 'SKILL.md'), 'utf8')).toBe('customized skill\n')
  })

  it('replaces a customized skill only after confirmation', async () => {
    const { root, skillsDirectory } = fixture()
    const destination = path.join(root, '.claude/skills/reboil')
    fs.mkdirSync(destination, { recursive: true })
    fs.writeFileSync(path.join(destination, 'SKILL.md'), 'customized skill\n')
    fs.writeFileSync(path.join(destination, 'custom.md'), 'keep me out\n')

    const result = await prepareAgentSkills({
      root,
      skillsDirectory,
      selected: ['claude-code'],
      confirmReplacement: async () => true,
    })

    expect(result.installed.map((agent) => agent.id)).toEqual(['claude-code'])
    expect(fs.readFileSync(path.join(destination, 'SKILL.md'), 'utf8')).toBe('claude skill\n')
    expect(fs.existsSync(path.join(destination, 'custom.md'))).toBe(false)
  })
})
