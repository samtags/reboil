# Reboil contract

This reference condenses the agreed v1 contract in `docs/roadmap.md`. That roadmap remains the canonical specification while Reboil is under development. Check it before changing a public promise, and verify the installed package version before calling a planned API released.

## Status and scope

Small, fast, and scalable string-path state access for web applications and React Native, with code splitting, and synchronous persistence out of the box

The core store API is framework agnostic and works with vanilla JavaScript or any web framework. React bindings are available as an optional integration. Reboil uses one composable, client-side application-store tree for web, Expo, and React Native. Many `createStore()` nodes may compose under one unparented root; independent application roots, async persistence, server mutations or per-request SSR stores, dynamic-record-key autocomplete, non-JSON values, and native Expo Go support remain excluded.

## Local factory bindings

Config registration is the standard installation workflow. The local bindings below remain available for store composition, scoped access, and explicit low-level integrations.

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

There is no registration import, generator, watch command, or schema file. Editing `initialState` updates ordinary TypeScript inference immediately.

## Composed and lazy stores

A `createStore()` result is a valid field in another store. The parent exposes root paths while the child retains scoped bindings:

```ts
const reports = createStore({ count: 1 })
export const { store, useStore } = createStore({ reports })

store.get('reports.count')
reports.store.get('count')
```

Every result begins as a root candidate. Composition assigns a parent and stable path; exactly one unparented node must remain when state is accessed. A root hydrates synchronously on first access and an eager child hydrates when mounted. A node used independently cannot later be reparented.

Use Reboil's framework-independent `lazy()` to create a dynamic import boundary:

```ts
// reports/state.ts
export default createStore({ count: 1 })

// store.ts
export const reports = lazy(() => import('./reports/state'))
export const { store, useStore } = createStore({ reports })
```

The module must default-export a `createStore()` result. React hooks start the loader and suspend on first access. Vanilla code must first await `store.load('reports')` or `reports.load()`. Loaders cache their result or error and loaded stores remain resident for the session. `React.lazy()` is not a valid store field.

## Config registration

Run `npx reboil init` as part of standard application setup. It is one-time setup, not recurring generation. The generated `reboil.config.ts` creates the store, exports `defineConfig`, and augments `Register` with `typeof initialState`. A customized config that composes eager or lazy stores augments `Register` with `bindings: typeof app` so direct bindings retain resolved root paths and typed lazy load paths. Its import must execute before route or application modules; an Expo Router entry imports the config before `expo-router/entry`.

The initializer must parse entries with an AST, be idempotent, preserve existing code and comments, preview writes, support `--state`, `--entry`, and `--dry-run`, and stop with precise manual instructions if detection is ambiguous or unsafe.

## Public API

| API                                   | Contract                                                                                                                                                                                        |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `createStore(initialState, options?)` | Creates a composable store node. Options are `id`, `version`, `persist.exclude`, `migrate`, and `logger`; `id` belongs to the root. Persistence hydrates synchronously when the node activates. |
| `lazy(loader)`                        | Creates a typed lazy store handle from a dynamic import whose default export is a `createStore()` result.                                                                                       |
| `store.get(path)`                     | Returns the current typed value at a dot path.                                                                                                                                                  |
| `store.set(path, valueOrUpdater)`     | Validates a direct value or updater result, persists the complete next partition, commits it, notifies changed selections, logs, and returns the selected value.                                |
| `store.subscribe(path, listener)`     | Calls `listener(nextValue, previousValue)` only when the selected value changes and returns an unsubscribe function.                                                                            |
| `store.reset(path?)`                  | A path reset restores and returns one value. No-argument reset returns `void`, resets loaded partitions, and invalidates unloaded partitions through the reset epoch.                           |
| `store.load(path)`                    | Idempotently loads a typed lazy child path for subsequent synchronous vanilla access.                                                                                                           |
| `useStore(path)`                      | Uses `useSyncExternalStore`; components rerender only when their selected value changes under `Object.is`.                                                                                      |
| `setStore(path, valueOrUpdater)`      | Config-registered direct binding from `reboil/react`; it writes through the registered runtime.                                                                                                 |

All paths use dots. Objects use string key segments; arrays use canonical numeric segments such as `todos.0.title`; tuples may expose exact indices. Keys containing `.` are unsupported. Missing intermediate keys and out-of-range indices are runtime errors. Literal invalid paths and value types must fail TypeScript checking.

## Persistence and mutations

Native iOS and Android use synchronous `react-native-mmkv` v4 with `react-native-nitro-modules`. Users install native dependencies via Expo’s version-aware installer and build a development or production client. Web browsers and Expo Web use synchronous `localStorage`; if storage is unavailable, Reboil continues in memory and warns in development. Server environments use in-memory defaults and are not mutation targets.

Persist a small root manifest with a reset epoch and one versioned JSON envelope per store node. Root and child partition keys derive from the root ID and child path. Activation deep-merges persisted plain objects over that partition's defaults; arrays replace defaults. Excluded paths remain reactive in memory but persist as defaults.

Convert the legacy monolithic envelope once by staging child subtrees under partition keys, writing the root partition, and committing the manifest last. A failed conversion leaves the legacy record authoritative. Lazy child data remains preserved until its module loads.

For every mutation:

1. Validate the path and compute an immutable next state, cloning only affected containers.
2. Validate JSON safety.
3. Serialize and synchronously persist the next affected partition.
4. Commit memory.
5. Notify listeners whose selected value changed.
6. Emit the development log and return the value.

If validation, serialization, migration, or persistence fails, keep both prior memory and stored data authoritative, log the rejection in development, then throw. A no-op `set` is logged but does not write or notify.

Allowed persisted values are strings, finite numbers, booleans, `null`, plain objects, and arrays composed of those values. Reject `undefined`, `NaN`, infinities, `BigInt`, symbols, functions, cycles, dates, maps, sets, and class instances.

## Versions, logging, and errors

The default version is `1` per store node. Additive schema changes can keep a version because object defaults merge. Breaking partition changes increment that node's version and provide a synchronous `migrate(persisted, fromVersion)` function. A missing, failed, incompatible, or downgrade migration preserves stored data and throws.

Logging defaults to enabled in development and disabled in production. Successful logs include operation, path, previous state, action, next state, and whether a change occurred. Rejected logs include the attempted operation, path, state, safely printable action, and error. A custom logger may replace the default; logger failures must not break store behavior.

Throw descriptive errors for unregistered direct bindings, duplicate production registration, invalid paths, unsupported values, serialization or persistence failure, corrupt envelopes, and missing or incompatible migrations.

## Review and documentation checklist

- Verify typed paths, `get`, `set`, subscriptions, reset, arrays/tuples, and direct-binding augmentation with type tests.
- Verify synchronous hydration, default merging, array replacement, exclusions, migration, storage fallback, and atomic write failure behavior.
- Verify eager composition, one-root registration, lazy Suspense, explicit vanilla loading, partition-only writes, reset epochs, and legacy conversion.
- Verify path-level notifications and React rendering behavior.
- Keep the Codex and Claude Code contracts byte-identical. Run `node scripts/release-reboil-skill.mjs` to publish both release copies, then run `node scripts/release-reboil-skill.mjs --check`.
- Update the website’s `llms.txt`, `llms-full.txt`, `docs.json`, and agent page when contract-facing resources change.
