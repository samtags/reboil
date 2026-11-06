---
name: reboil
description: Implement, integrate, review, or document Reboil framework-agnostic typed synchronous state for web and React Native. Do not use for unrelated state libraries or generic state questions.
---

# Reboil agent skill

Small, fast, and scalable string-path state access for web and React Native, with zero boilerplate, code splitting, and synchronous persistence out of the box

The core store API is framework agnostic. React bindings are available as an optional integration.

Use Reboil’s standard config-registration workflow for application integrations. Treat the public contract as a specification until the requested package version is verified; do not represent planned behavior as released functionality.

## Apply the integration standard

- **Standard config registration:** run `reboil init`, keep the generated `reboil.config.ts` and module augmentation, and ensure its entry import runs before application modules. All consumers use direct store bindings from `reboil`; React consumers may additionally use `reboil/react`.
- **Local factory bindings:** `createStore()` returns scoped `store` and `useStore` bindings for composition and explicit low-level use cases. Do not present them as a replacement for standard installation and config registration.

Read [the contract](references/contract.md) before implementing or reviewing runtime behavior, types, persistence, migrations, logging, initialization, or public documentation. For a narrow application integration, read the workflow and platform sections first.

## Non-negotiable invariants

- Do not introduce a store prop, asynchronous hydration, or recurring code generation.
- `createStore()` results may compose into one application-store tree. Require one unparented root; do not model composed nodes as independent application roots.
- Use Reboil's `lazy()` for feature stores. Do not substitute React's component-only `lazy()` or synchronously access a lazy partition before `load()` outside React.
- Native persistence uses synchronous MMKV and requires an Expo development or production build; it does not work in Expo Go. Browser persistence uses synchronous `localStorage`.
- Validate a mutation, persist its complete next partition, then commit in-memory state and notify only affected subscribers. Rejected writes must not persist, mutate memory, or notify subscribers.
- Persisted state is limited to the documented JSON-safe values. Invalid paths and invalid values are logged in development and then throw.
- Default logging is on in development and off in production. No-op writes are logged but do not persist or notify.
- Keep `docs/roadmap.md`, human documentation, `/llms*.txt`, `/docs.json`, and this skill release copy aligned when public behavior changes.

## Task workflow

1. Establish whether the task affects standard config registration, local factory bindings, runtime behavior, or documentation.
2. Check the contract and the closest tests or examples before changing public behavior.
3. Preserve the failure and ordering guarantees; add or update tests when behavior changes.
4. For documentation changes, update the canonical skill and regenerate the website release copy with `node scripts/release-reboil-skill.mjs`, then run its `--check` mode.

When requirements conflict or a requested behavior is absent from the current contract, call out the conflict instead of inventing compatibility guarantees.
