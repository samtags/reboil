---
title: Code Splitting
sidebar_position: 4
---

# Code Splitting

Use Reboil's `lazy()` to keep a feature's defaults, persistence hydration, and runtime state out of the initial application path.

```ts title="src/features/reports/state.ts"
import { createStore } from 'reboil'

export default createStore({
  count: 1,
  filters: { query: '' },
})
```

```ts title="reboil.config.ts"
import { createStore, defineConfig, lazy } from 'reboil'
import { initialState } from './src/state'

export const reports = lazy(() => import('./features/reports/state'))

export const app = createStore({
  ...initialState,
  reports,
})

export default defineConfig({ stateFile: './src/state.ts' })

declare module 'reboil' {
  interface Register {
    bindings: typeof app
  }
}
```

The root and scoped bindings share one partition:

```tsx
import { useStore } from 'reboil/react'
import { reports } from '../../reboil.config'

const count = useStore('reports.count')
const query = reports.useStore('filters.query')
```

The first React hook access starts the import and suspends. Place a Suspense boundary at the route or feature boundary when the framework does not already provide one.

Vanilla reads and writes stay synchronous, so load the feature explicitly first:

```ts
import { store } from 'reboil'

await store.load('reports')
store.set('reports.count', 2)
```

Use `lazy` from `reboil`, not `React.lazy`. React's helper loads components; Reboil's helper loads a default-exported store node. When both are needed, alias them as `lazyComponent` and `lazyStore`.

Lazy stores load once and remain resident until the application session ends. Reboil does not automatically evict an active partition.
