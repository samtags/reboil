import fs from 'node:fs'
import path from 'node:path'

export type AgentSkillId = 'claude-code' | 'codex'

export interface AgentSkill {
  id: AgentSkillId
  label: string
  packageDirectory: string[]
  projectDirectory: string[]
  prompt: string
}

export interface AgentSkillPreparationResult {
  installed: AgentSkill[]
  ready: AgentSkill[]
  skipped: AgentSkill[]
}

export const agentSkills: AgentSkill[] = [
  {
    id: 'claude-code',
    label: 'Claude Code',
    packageDirectory: ['claude-code', 'reboil'],
    projectDirectory: ['.claude', 'skills', 'reboil'],
    prompt: '/reboil Integrate Reboil state into this project.',
  },
  {
    id: 'codex',
    label: 'Codex',
    packageDirectory: ['codex', 'reboil'],
    projectDirectory: ['.agents', 'skills', 'reboil'],
    prompt: 'Use $reboil to integrate typed Reboil state into this project.',
  },
]

interface PendingInstall {
  agent: AgentSkill
  destination: string
  stageRoot?: string
  stagedDirectory?: string
  backup?: string
  moved: boolean
}

export interface PrepareAgentSkillsOptions {
  root: string
  skillsDirectory: string
  selected: AgentSkillId[]
  confirmReplacement: (agent: AgentSkill, destination: string) => Promise<boolean>
  onInstallStart?: () => void
}

function filesMatch(left: string, right: string): boolean {
  if (!fs.existsSync(left) || !fs.existsSync(right)) return false
  const leftStat = fs.lstatSync(left)
  const rightStat = fs.lstatSync(right)
  if (leftStat.isFile() !== rightStat.isFile() || leftStat.isDirectory() !== rightStat.isDirectory()) return false
  if (leftStat.isFile()) return fs.readFileSync(left).equals(fs.readFileSync(right))
  if (!leftStat.isDirectory()) return false

  const leftEntries = fs.readdirSync(left).sort()
  const rightEntries = fs.readdirSync(right).sort()
  if (leftEntries.length !== rightEntries.length || leftEntries.some((entry, index) => entry !== rightEntries[index])) {
    return false
  }
  return leftEntries.every((entry) => filesMatch(path.join(left, entry), path.join(right, entry)))
}

function selectedSkills(selected: AgentSkillId[]): AgentSkill[] {
  const known = new Map(agentSkills.map((agent) => [agent.id, agent]))
  const unique = [...new Set(selected)]
  if (unique.length === 0) throw new Error('Select at least one agent skill to prepare.')
  return unique.map((id) => {
    const agent = known.get(id)
    if (!agent) throw new Error(`Unsupported agent skill: ${id}`)
    return agent
  })
}

function sourceDirectory(skillsDirectory: string, agent: AgentSkill): string {
  const source = path.resolve(skillsDirectory, ...agent.packageDirectory)
  if (!fs.existsSync(path.join(source, 'SKILL.md'))) {
    throw new Error(`Bundled ${agent.label} skill is missing. Reinstall reboil and try again.`)
  }
  return source
}

function backupPath(destination: string): string {
  return `${destination}.reboil-backup-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export async function prepareAgentSkills(options: PrepareAgentSkillsOptions): Promise<AgentSkillPreparationResult> {
  const pending: PendingInstall[] = []
  const ready: AgentSkill[] = []
  const skipped: AgentSkill[] = []

  for (const agent of selectedSkills(options.selected)) {
    const destination = path.resolve(options.root, ...agent.projectDirectory)
    const source = sourceDirectory(options.skillsDirectory, agent)
    if (!fs.existsSync(destination)) {
      pending.push({ agent, destination, moved: false })
      continue
    }
    if (filesMatch(source, destination)) {
      ready.push(agent)
      continue
    }
    if (await options.confirmReplacement(agent, destination)) {
      pending.push({ agent, destination, moved: false })
    } else {
      skipped.push(agent)
    }
  }

  if (pending.length === 0) return { installed: [], ready, skipped }
  options.onInstallStart?.()

  try {
    for (const installation of pending) {
      const parent = path.dirname(installation.destination)
      fs.mkdirSync(parent, { recursive: true })
      installation.stageRoot = fs.mkdtempSync(path.join(parent, `.reboil-stage-${installation.agent.id}-`))
      installation.stagedDirectory = path.join(installation.stageRoot, 'reboil')
      fs.cpSync(sourceDirectory(options.skillsDirectory, installation.agent), installation.stagedDirectory, {
        recursive: true,
      })
    }

    for (const installation of pending) {
      if (!fs.existsSync(installation.destination)) continue
      installation.backup = backupPath(installation.destination)
      fs.renameSync(installation.destination, installation.backup)
    }

    for (const installation of pending) {
      fs.renameSync(installation.stagedDirectory!, installation.destination)
      installation.moved = true
    }

    for (const installation of pending) {
      if (installation.backup) fs.rmSync(installation.backup, { force: true, recursive: true })
    }

    return { installed: pending.map((installation) => installation.agent), ready, skipped }
  } catch (error) {
    for (const installation of [...pending].reverse()) {
      if (installation.moved && fs.existsSync(installation.destination)) {
        fs.rmSync(installation.destination, { force: true, recursive: true })
      }
      if (installation.backup && fs.existsSync(installation.backup) && !fs.existsSync(installation.destination)) {
        fs.renameSync(installation.backup, installation.destination)
      }
    }
    throw error
  } finally {
    for (const installation of pending) {
      if (installation.stageRoot && fs.existsSync(installation.stageRoot)) {
        fs.rmSync(installation.stageRoot, { force: true, recursive: true })
      }
    }
  }
}
