---
name: reboil
description: Implement, review, integrate, or document Reboil typed synchronous state in Expo, React Native, and browser React applications.
---

# Reboil agent skill

Read `/llms-full.txt` and the public API docs before implementation.

Preserve these invariants:

- Use the default typed application-store module workflow unless direct package imports are explicitly requested.
- Do not introduce React Context, a Provider, recurring code generation, or Expo Go support for native persistence.
- MMKV and browser `localStorage` hydration and writes are synchronous.
- Mutations persist before committing to memory or notifying subscribers.
- Invalid paths and unsupported JSON values log in development and throw without changing state.
- Keep README, human documentation, machine-readable resources, and this skill aligned after public API changes.
