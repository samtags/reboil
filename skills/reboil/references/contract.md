# Reboil contract

This reference condenses the agreed v1 contract in `docs/roadmap.md`. That roadmap remains the canonical specification while Reboil is under development. Check it before changing a public promise, and verify the installed package version before calling a planned API released.

## Status and scope

Reboil is a single, client-side application store for Expo, React Native, Expo Web, and browser React. It has no React Context or Provider. V1 excludes multiple named stores, async persistence, server mutations or per-request SSR stores, dynamic-record-key autocomplete, non-JSON values, and native Expo Go support.

## Default typed store module

The recommended setup is one ordinary TypeScript module. `createStore` infers the state from `initialState` and returns bindings that retain those types.

```ts
// store.ts
import { createStore } from 'reboil'

const initialState = {
  user: { name: 'Ada' },
  todos: [{ title: 'Ship Reboil', completed: false }],
}

export const { store, useStore } = createStore(initialState)
```

Components and non-React code import from `./store`, not directly from the package:

```tsx
const name = useStore('user.name')
store.set('todos.0.completed', true)
```

There is no provider, registration import, generator, watch command, or schema file. Editing `initialState` updates ordinary TypeScript inference immediately.

## Optional config registration

Use `npx reboil init` only for an application that explicitly wants direct package imports. It is one-time setup, not recurring generation. The generated `reboil.config.ts` creates the store, exports `defineConfig`, and augments `Register` with `typeof initialState`. Its import must execute before route or application modules; an Expo Router entry imports the config before `expo-router/entry`.

The initializer must parse entries with an AST, be idempotent, preserve existing code and comments, preview writes, support `--state`, `--entry`, and `--dry-run`, and stop with precise manual instructions if detection is ambiguous or unsafe.

## Public API

| API                                   | Contract                                                                                                                                                                                                                          |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `createStore(initialState, options?)` | Creates and synchronously hydrates the application store. Options are `id`, `version`, `persist.exclude`, `migrate`, and `logger`. A repeated ID refreshes defaults during Fast Refresh; a second production registration throws. |
| `store.get(path)`                     | Returns the current typed value at a dot path.                                                                                                                                                                                    |
| `store.set(path, valueOrUpdater)`     | Validates a direct value or updater result, persists the complete next state, commits it, notifies changed selections, logs, and returns the selected value.                                                                      |
| `store.subscribe(path, listener)`     | Calls `listener(nextValue, previousValue)` only when the selected value changes and returns an unsubscribe function.                                                                                                              |
| `store.reset(path?)`                  | Restores one path or all defaults, then persists and notifies changed selections.                                                                                                                                                 |
| `useStore(path)`                      | Uses `useSyncExternalStore`; components rerender only when their selected value changes under `Object.is`.                                                                                                                        |
| `setStore(path, valueOrUpdater)`      | Optional-registration direct binding from `reboil/react`; it writes through the registered runtime.                                                                                                                               |

All paths use dots. Objects use string key segments; arrays use canonical numeric segments such as `todos.0.title`; tuples may expose exact indices. Keys containing `.` are unsupported. Missing intermediate keys and out-of-range indices are runtime errors. Literal invalid paths and value types must fail TypeScript checking.

## Persistence and mutations

Native iOS and Android use synchronous `react-native-mmkv` v4 with `react-native-nitro-modules`. Users install native dependencies via Expo’s version-aware installer and build a development or production client. Browser React and Expo Web use synchronous `localStorage`; if storage is unavailable, Reboil continues in memory and warns in development. Server environments use in-memory defaults and are not mutation targets.

Persist a versioned JSON envelope under the configured ID. Hydration deep-merges persisted plain objects over current defaults; persisted arrays replace default arrays. Excluded paths remain reactive in memory but persist as their default values and therefore reset after reload.

For every mutation:

1. Validate the path and compute an immutable next state, cloning only affected containers.
2. Validate JSON safety.
3. Serialize and synchronously persist the next complete state.
4. Commit memory.
5. Notify listeners whose selected value changed.
6. Emit the development log and return the value.

If validation, serialization, migration, or persistence fails, keep both prior memory and stored data authoritative, log the rejection in development, then throw. A no-op `set` is logged but does not write or notify.

Allowed persisted values are strings, finite numbers, booleans, `null`, plain objects, and arrays composed of those values. Reject `undefined`, `NaN`, infinities, `BigInt`, symbols, functions, cycles, dates, maps, sets, and class instances.

## Versions, logging, and errors

The default version is `1`. Additive schema changes can keep a version because object defaults merge. Breaking changes increment `version` and provide a synchronous `migrate(persisted, fromVersion)` function. A missing, failed, incompatible, or downgrade migration preserves stored data and throws.

Logging defaults to enabled in development and disabled in production. Successful logs include operation, path, previous state, action, next state, and whether a change occurred. Rejected logs include the attempted operation, path, state, safely printable action, and error. A custom logger may replace the default; logger failures must not break store behavior.

Throw descriptive errors for unregistered direct bindings, duplicate production registration, invalid paths, unsupported values, serialization or persistence failure, corrupt envelopes, and missing or incompatible migrations.

## Review and documentation checklist

- Verify typed paths, `get`, `set`, subscriptions, reset, arrays/tuples, and direct-binding augmentation with type tests.
- Verify synchronous hydration, default merging, array replacement, exclusions, migration, storage fallback, and atomic write failure behavior.
- Verify path-level notifications and React rendering behavior without Context.
- Keep the Codex and Claude Code contracts byte-identical. Run `node scripts/release-reboil-skill.mjs` to publish both release copies, then run `node scripts/release-reboil-skill.mjs --check`.
- Update the website’s `llms.txt`, `llms-full.txt`, `docs.json`, and agent page when contract-facing resources change.
