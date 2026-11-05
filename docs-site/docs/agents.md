---
title: For agents
sidebar_position: 5
---

# Agent-ready documentation

Reboil exposes machine-readable documentation surfaces so coding agents can use the same contract as human readers without scraping presentation markup.

- [`/llms.txt`](pathname:///llms.txt) — concise project summary and recommended reading order.
- [`/llms-full.txt`](pathname:///llms-full.txt) — complete public contract in plain text.
- [`/docs.json`](pathname:///docs.json) — version, status, topic metadata, stable identifiers, URLs, and summaries.
- [`/skills/reboil/SKILL.md`](pathname:///skills/reboil/SKILL.md) — canonical downloadable skill entrypoint.

When implementing Reboil, preserve these invariants: no React Context or Provider, synchronous MMKV or `localStorage` persistence, no Expo Go support for native consumers, and persist-before-commit mutation ordering.
