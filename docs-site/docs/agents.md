---
title: For agents
sidebar_position: 5
---

# Agent-ready documentation

Reboil exposes machine-readable documentation surfaces so coding agents can use the same contract as human readers without scraping presentation markup.

- [`/llms.txt`](pathname:///llms.txt) — concise project summary, status, and recommended reading order.
- [`/llms-full.txt`](pathname:///llms-full.txt) — complete public contract in Markdown without presentation markup.
- [`/docs.json`](pathname:///docs.json) — schema version, release status, stable topic identifiers, URLs, summaries, and resource locations.
- **Codex:** [`/skills/reboil/SKILL.md`](pathname:///skills/reboil/SKILL.md), [discovery metadata](pathname:///skills/reboil/agents/openai.yaml), and [contract](pathname:///skills/reboil/references/contract.md).
- **Claude Code:** [`/skills/claude-code/reboil/SKILL.md`](pathname:///skills/claude-code/reboil/SKILL.md) and [contract](pathname:///skills/claude-code/reboil/references/contract.md). Install this artifact as `.claude/skills/reboil/` in a project, or as `~/.claude/skills/reboil/` for personal use; Claude Code can invoke it as `/reboil`.

The repository’s `skills/reboil` and `.claude/skills/reboil` folders are the canonical Codex and Claude Code sources during development. The complete folders above are their release copies; they are verified byte-for-byte, with a shared contract check, by `node scripts/release-reboil-skill.mjs --check` before the documentation site is built.

When implementing Reboil, preserve these invariants: no React Context or Provider, synchronous MMKV or `localStorage` persistence, no Expo Go support for native consumers, and persist-before-commit mutation ordering.
