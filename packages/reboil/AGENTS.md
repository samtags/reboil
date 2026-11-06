# Reboil agent guide

Use this file when working in a project that has `reboil` installed.

1. Read [`llms.txt`](./llms.txt) for the public API and integration summary.
2. For implementation or review work, read the matching detailed contract:
   - Codex: [`skills/codex/reboil/SKILL.md`](./skills/codex/reboil/SKILL.md)
   - Claude Code: [`skills/claude-code/reboil/SKILL.md`](./skills/claude-code/reboil/SKILL.md)
3. Use `npx @reboil/store init` for normal application setup. Keep the generated `reboil.config.ts` import ahead of application modules.

The package supports one composed client-side store tree. Keep persistence synchronous (`localStorage` on web, MMKV on native), do not use Expo Go for native persistence, and validate/persist a mutation before committing it in memory.

`createStore()` local bindings are for composition and explicit low-level work; they are not a replacement for normal config registration.
