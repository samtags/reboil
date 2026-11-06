---
title: Migration
sidebar_position: 1
---

# Migration

Use a migration when a new release makes a breaking change to the shape of persisted state, such as renaming a field or changing its type. Increment the store version and synchronously convert the older state to the current shape:

```ts title="src/store.ts"
import { createStore } from 'reboil'

const state = {
  count: 1,
  settings: {
    runtimeVersion: '3.14.15',
  },
}

createStore(state, {
  version: 2,
  migrate(persisted, fromVersion) {
    if (fromVersion !== 1) {
      throw new Error(`Unsupported schema version: ${fromVersion}`)
    }

    const previous = persisted as {
      count?: number
      settings?: { runtime?: string }
    }

    return {
      count: previous.count ?? 1,
      settings: {
        runtimeVersion: previous.settings?.runtime ?? '3.14.15',
      },
    }
  },
})
```

This example migrates the version-one `settings.runtime` field to `settings.runtimeVersion`. Additive changes usually do not need a migration because persisted objects are merged with the current defaults. A failed or unsupported migration preserves the previously stored data and throws an error.
