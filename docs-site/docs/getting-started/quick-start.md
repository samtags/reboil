---
title: Quick start
sidebar_position: 2
---

# Quick start

After installation and config registration, use a small counter to see the core Reboil workflow: update the generated state, subscribe to a path, and update it through the store.

## Add fields to the state

Add a `count` field for this example:

```ts title="src/state.ts"
export const initialState = {
  count: 1,
}
```

## Subscribe to state changes

The initializer ensures the config is registered before application state is used. Use `useStore` in a component; the hook subscribes the component to the selected `count` path and re-renders when it changes:

```tsx title="src/Counter.tsx"
import { useStore } from '@reboil/store/react'

export function Counter() {
  const count = useStore('count')

  return <p>Count: {count}</p>
}
```

## Update the state

Use the configured package store to update the same path. The updater receives the current value and returns the next one:

```tsx title="src/IncrementButton.tsx"
import { store } from '@reboil/store'

export function IncrementButton() {
  return (
    <button type="button" onClick={() => store.set('count', (value) => value + 1)}>
      Count up
    </button>
  )
}
```
