---
title: Public API
sidebar_position: 1
---

# Public API

## `createStore(initialState, options?)`

Creates the application store and returns typed `store` and `useStore` bindings. See [store creation](../concepts/store-creation) for options.

```ts title="reboil.config.ts"
import { createStore } from 'reboil'

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
import { store } from 'reboil'

const count = store.get('count') // number
```

## `store.set(path, valueOrUpdater)`

Validates, persists, commits, and returns a new value. Direct values and updater return values must match the type at the selected path:

```ts
import '../reboil.config'
import { store } from 'reboil'

store.set('count', 10)
store.set('count', (previous) => previous + 1)
```

## `store.subscribe(path, listener)`

Subscribes vanilla JavaScript or other non-React code to a typed path. The listener receives `(value, previousValue)` and runs only when the selected value changes. Returns an unsubscribe function.

```js title="src/main.js"
import '../reboil.config'
import { store } from 'reboil'

const unsubscribe = store.subscribe('count', (value, previousValue) => {
  console.log(`count: ${previousValue} → ${value}`)
})

// Stop receiving updates when the listener is no longer needed.
unsubscribe()
```

## `store.reset(path?)`

Restores a path or the complete store from the original defaults, persists the result, notifies affected subscribers, and returns the restored value.

```ts
import '../reboil.config'
import { store } from 'reboil'

const initialCount = store.reset('count')
store.reset() // restore the complete counter state
```

## `useStore(path)`

Subscribes a React component to one typed path using `useSyncExternalStore`.

```tsx title="src/Counter.tsx"
import '../reboil.config'
import { useStore } from 'reboil/react'

export function Counter() {
  const count = useStore('count')

  return <p>Count: {count}</p>
}
```

## `setStore(path, valueOrUpdater)`

The direct binding from `reboil/react` writes through the same registered runtime as `useStore` and validates before committing.

```tsx title="src/IncrementButton.tsx"
import '../reboil.config'
import { setStore } from 'reboil/react'

export function IncrementButton() {
  return (
    <button type="button" onClick={() => setStore('count', (value) => value + 1)}>
      Count up
    </button>
  )
}
```
