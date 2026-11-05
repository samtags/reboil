---
title: Runtime errors and logging
sidebar_position: 2
---

# Runtime errors and logging

Invalid mutation attempts are logged in development and then throw without changing state. They never persist, update memory, or notify subscribers.

Development logging is enabled by default and production logging is disabled by default. Successful mutation logs include the operation, path, previous state, attempted value or updater result, next state, and whether the value changed.

The runtime rejects missing intermediate properties, out-of-range array indices, unsupported persisted values, failed migrations, and persistence failures.

## Schema versions

Additive changes may keep the same version because persisted plain objects are merged over new defaults. Breaking changes increment `version` and provide a synchronous migration:

```ts
export const {store, useStore} = createStore(app, {
  version: 2,
  migrate(persisted, fromVersion) {
    if (fromVersion === 1) return migrateVersionOne(persisted);
    throw new Error(`Unsupported Reboil schema version: ${fromVersion}`);
  },
});
```
