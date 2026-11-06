---
title: For agents
sidebar_position: 5
---

# Agent-ready documentation

Small, fast, and scalable string-path state access for web applications and React Native, with code splitting, and synchronous persistence out of the box

The core store API is framework agnostic. React bindings are available as an optional integration.

Reboil exposes machine-readable documentation surfaces so coding agents can use the same contract as human readers without scraping presentation markup.

From a project that uses Reboil, install the maintained local skills with:

```sh
npx @reboil/store --prepare agents
```

The interactive installer can add Claude Code at `.claude/skills/reboil/`, Codex at `.agents/skills/reboil/`, or both. It asks before replacing a customized existing skill.

The published npm package also includes package-local `AGENTS.md`, `llms.txt`, and both complete skills so agents inspecting `node_modules/@reboil/store` can follow the same guidance without first visiting this site.

- [`/llms.txt`](pathname:///llms.txt) — concise project summary, status, and recommended reading order.
- [`/llms-full.txt`](pathname:///llms-full.txt) — complete public contract in Markdown without presentation markup.
- [`/docs.json`](pathname:///docs.json) — schema version, release status, stable topic identifiers, URLs, summaries, and resource locations.
- **Codex:** [`/skills/reboil/SKILL.md`](pathname:///skills/reboil/SKILL.md), [discovery metadata](pathname:///skills/reboil/agents/openai.yaml), and [contract](pathname:///skills/reboil/references/contract.md). Codex can invoke it as `$reboil`.
- **Claude Code:** [`/skills/claude-code/reboil/SKILL.md`](pathname:///skills/claude-code/reboil/SKILL.md) and [contract](pathname:///skills/claude-code/reboil/references/contract.md). Install this artifact as `.claude/skills/reboil/` in a project, or as `~/.claude/skills/reboil/` for personal use; Claude Code can invoke it as `/reboil`.

The repository’s `skills/reboil` and `.claude/skills/reboil` folders are the canonical Codex and Claude Code sources during development. The complete folders above are their release copies; they are verified byte-for-byte, with a shared contract check, by `node scripts/release-reboil-skill.mjs --check` before the documentation site is built.

When implementing Reboil, preserve these invariants: synchronous MMKV or `localStorage` persistence, no Expo Go support for native consumers, and persist-before-commit mutation ordering.
