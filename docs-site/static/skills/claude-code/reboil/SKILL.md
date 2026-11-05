---
name: reboil
description: Implement, integrate, review, or document Reboil typed synchronous state in Expo, React Native, and browser React applications. Do not use for unrelated state libraries or generic React state questions.
---

# Reboil for Claude Code

This project skill is automatically discoverable by Claude Code and can also be invoked as `/reboil`. Use Reboil’s default typed application-store module unless the request explicitly requires direct package imports. Treat the public contract as a specification until the requested package version is verified; do not represent planned behavior as released functionality.

## Choose the integration workflow

- **Default:** create the store in the application’s own typed module and export its `store` and `useStore` bindings. Consumers import those bindings from that module. This needs no provider, registration import, generator, or watcher.
- **Optional config registration:** use only when direct imports such as `useStore` from `reboil/react` are requested. It requires one-time `reboil init` setup, `reboil.config.ts`, module augmentation, and an entry import that runs before application modules.

Read [the contract](references/contract.md) before implementing or reviewing runtime behavior, types, persistence, migrations, logging, initialization, or public documentation. For a narrow application integration, read the workflow and platform sections first.

## Non-negotiable invariants

- Do not introduce React Context, a Provider, a store prop, asynchronous hydration, or recurring code generation.
- Native persistence uses synchronous MMKV and requires an Expo development or production build; it does not work in Expo Go. Browser persistence uses synchronous `localStorage`.
- Validate a mutation, persist its complete next state, then commit in-memory state and notify only affected subscribers. Rejected writes must not persist, mutate memory, or notify subscribers.
- Persisted state is limited to the documented JSON-safe values. Invalid paths and invalid values are logged in development and then throw.
- Default logging is on in development and off in production. No-op writes are logged but do not persist or notify.
- Keep `docs/roadmap.md`, human documentation, `/llms*.txt`, `/docs.json`, and both agent-skill release copies aligned when public behavior changes.

## Task workflow

1. Establish whether the task affects the default workflow, optional registration, runtime behavior, or documentation.
2. Check the contract and the closest tests or examples before changing public behavior.
3. Preserve the failure and ordering guarantees; add or update tests when behavior changes.
4. For documentation changes, update the canonical skill sources, regenerate the website release copies with `node scripts/release-reboil-skill.mjs`, then run its `--check` mode.

When requirements conflict or a requested behavior is absent from the current contract, call out the conflict instead of inventing compatibility guarantees.
