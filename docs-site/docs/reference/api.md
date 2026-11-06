---
title: Public API
sidebar_position: 1
---

# Public API

## `createStore(initialState, options?)`

Creates a composable store node and returns typed `store` and `useStore` bindings. See [Stores](../concepts/store-creation) for options.

```ts title="reboil.config.ts"
import { createStore } from '@reboil/store'

const { store, useStore } = createStore(
  {
    count: 1,
  },
  {
    id: 'counter-app',
  },
)
```

## `store.get(path)`

Returns the current value at a typed path:

```ts
import '../reboil.config'
import { store } from '@reboil/store'

const count = store.get('count') // number
```

## `store.set(path, valueOrUpdater)`

Validates, persists, commits, and returns a new value. Direct values and updater return values must match the type at the selected path:

```ts
import '../reboil.config'
import { store } from '@reboil/store'

store.set('count', 10)
store.set('count', (previous) => previous + 1)
```

## `store.subscribe(path, listener)`

Subscribes vanilla JavaScript or other non-React code to a typed path. The listener receives `(value, previousValue)` and runs only when the selected value changes. Returns an unsubscribe function.

```js title="src/main.js"
import '../reboil.config'
import { store } from '@reboil/store'

const unsubscribe = store.subscribe('count', (value, previousValue) => {
  console.log(`count: ${previousValue} → ${value}`)
})

// Stop receiving updates when the listener is no longer needed.
unsubscribe()
```

## `store.reset(path?)`

`store.reset(path)` restores and returns one value. No-argument `store.reset()` returns `void`, resets loaded partitions, and invalidates persisted unloaded partitions without importing them.

```ts
import '../reboil.config'
import { store } from '@reboil/store'

const initialCount = store.reset('count')
store.reset() // restore the complete counter state
```

## `lazy(loader)`

Creates a typed lazy store handle from a dynamic import. The imported module must default-export a `createStore()` result. Reboil's helper is unrelated to React's component-only `lazy()`.

```ts
import { createStore, lazy } from '@reboil/store'

export const reports = lazy(() => import('./reports/state'))
export const { store, useStore } = createStore({ reports })
```

## `store.load(path)` and `lazyStore.load()`

Loads a lazy store for synchronous vanilla access. Calls are idempotent and the loaded partition remains cached for the session.

```ts
await store.load('reports')
store.get('reports.count')

await reports.load()
reports.store.get('count')
```

`useStore('reports.count')` starts the same loader automatically and suspends until it finishes.

## `useStore(path)`

Subscribes a React component to one typed path using `useSyncExternalStore`.

```tsx title="src/Counter.tsx"
import '../reboil.config'
import { useStore } from '@reboil/store/react'

export function Counter() {
  const count = useStore('count')

  return <p>Count: {count}</p>
}
```

## `setStore(path, valueOrUpdater)`

The direct binding from `@reboil/store/react` writes through the same registered runtime as `useStore` and validates before committing.

```tsx title="src/IncrementButton.tsx"
import '../reboil.config'
import { setStore } from '@reboil/store/react'

export function IncrementButton() {
  return (
    <button type="button" onClick={() => setStore('count', (value) => value + 1)}>
      Count up
    </button>
  )
}
```
