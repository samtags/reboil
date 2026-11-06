---
title: Stores
sidebar_position: 1
---

# Stores

`createStore(initialState, options?)` creates a composable store node and returns typed `store` and `useStore` bindings. A standalone root restores persistence synchronously on first access; an eager child restores when its parent mounts it.

```ts
export const { store, useStore } = createStore(app, {
  id: 'reboil',
  version: 1,
  persist: { exclude: ['session.transientValue'] },
  migrate(persisted, fromVersion) {
    return migrateToCurrentState(persisted, fromVersion)
  },
  logger: true,
})
```

| Option            | Default            | Behavior                                                |
| ----------------- | ------------------ | ------------------------------------------------------- |
| `id`              | `'reboil'`         | Namespaces persisted state.                             |
| `version`         | `1`                | Identifies the current persisted schema.                |
| `migrate`         | None               | Synchronously converts older persisted state.           |
| `persist.exclude` | `[]`               | Typed paths that remain reactive but are not persisted. |
| `logger`          | Development logger | Enables, disables, or replaces mutation logging.        |

## Combine stores

A `createStore()` result is a valid field in another store. Reboil identifies the single unparented node as the application root and gives every child its own persistence partition.

```ts
const reports = createStore({ count: 1 })

export const { store, useStore } = createStore({
  session: { userId: null as string | null },
  reports,
})

store.get('reports.count')
reports.store.get('count')
```

Do not access a child independently before composing it. Once a node has activated as a standalone root, Reboil will reject reparenting it under another store.

## Initialization

Run `npx reboil init` after installing Reboil, then use the registered direct imports:

```tsx
import { useStore } from 'reboil/react'

export function Component() {
  const foo = useStore('foo')
  return null
}
```

The initializer creates a TypeScript config, links it to the state export, and safely wires the application entry point. It is idempotent and does not create a recurring watcher or generator.

If that config later composes feature stores, register the inferred bindings so direct imports retain root paths and lazy load paths:

```ts title="reboil.config.ts"
import { createStore, defineConfig, lazy } from 'reboil'
import { initialState } from './src/state'

const reports = lazy(() => import('./src/reports-state'))
export const app = createStore({ ...initialState, reports })

export default defineConfig({ stateFile: './src/state.ts' })

declare module 'reboil' {
  interface Register {
    bindings: typeof app
  }
}
```
