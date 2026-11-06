---
title: Persistence
sidebar_position: 4
---

# Persistence

All state persists by default. A path excluded with `persist.exclude` remains usable and reactive during the current session but returns to its initial default after reload.

Each composed store node has its own versioned persistence envelope. A small manifest records the current reset epoch. This lets Reboil hydrate and serialize one feature partition without parsing the rest of the application state.

## Exclude state from persistence

Pass typed state paths in `persist.exclude`:

```ts title="src/store.ts"
import { createStore } from '@reboil/store'

const state = {
  count: 1,
  settings: {
    runtimeVersion: '3.14.15',
  },
}

createStore(state, {
  persist: {
    exclude: ['count'],
  },
})
```

Here, `count` is never persisted, so it always resets to `1` after a reload. Other state, such as `settings.runtimeVersion`, continues to persist normally. Paths in `persist.exclude` must exist in the initial state and are checked against the inferred state shape.

## Atomic mutations

Every mutation follows this order:

1. Validate the path and compute the next immutable state.
2. Validate that the result is JSON-safe.
3. Serialize and synchronously persist the affected partition.
4. Commit the in-memory state.
5. Notify affected subscribers.
6. Emit the development log.
7. Return the committed path value.

If validation, serialization, migration, or persistence fails, the previous in-memory and persisted states remain authoritative.

No-argument `store.reset()` advances the manifest epoch before resetting loaded memory. Envelopes from the previous epoch are ignored, so an unloaded feature returns to defaults later without being downloaded during reset.

The earlier single-envelope format is converted once. Reboil stages child subtrees under their partition keys and commits the new manifest last, preserving the old record if conversion fails.

## Supported values

Persisted state is limited to

- Strings
- Finite numbers
- Booleans
- `null`
- Plain objects containing supported values,
- Arrays containing supported values.

Not supported:

- `undefined`
- `NaN`
- infinities
- `BigInt`
- Symbols
- Functions
- Cyclic Structures
- Dates
- Maps
- Sets
- Class Instances
