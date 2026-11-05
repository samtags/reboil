---
title: Runtime errors and logging
sidebar_position: 2
---

# Runtime errors and logging

Invalid mutation attempts are logged in development and then throw without changing state. They never persist, update memory, or notify subscribers.

Development logging is enabled by default and production logging is disabled by default. Successful mutation logs include the operation, path, previous state, attempted value or updater result, next state, and whether the value changed.

The runtime rejects missing intermediate properties, out-of-range array indices, unsupported persisted values, failed migrations, and persistence failures.

## Successful mutation logs

In development, the default logger groups each mutation and records the previous state, action, next state, and whether the selected value changed:

```ts
import { store } from "reboil";

store.set("count", (value) => value + 1);
```

The console output is similar to:

```text
[reboil] set count
  previous state { count: 1 }
  action { path: 'count', value: '[updater]', updater: true }
  next state { count: 2 }
  changed true
```

## Rejected mutation logs

Invalid values are logged and then thrown. The state remains unchanged:

```ts
import { store } from "reboil";

try {
  store.set("count", () => Number.NaN);
} catch (error) {
  console.error("Counter update failed", error);
}
```

The default logger reports the rejection before the `catch` block receives the error:

```text
[reboil] rejected set count
  current state { count: 1 }
  action { path: 'count', value: '[updater]', updater: true }
  error ReboilError: Value at "count" is not JSON-safe.
Counter update failed ReboilError: Value at "count" is not JSON-safe.
```

## Custom logging

Pass a logger function when you want to send structured mutation events to your own logging system:

```ts
import { createStore } from "reboil";

const { store } = createStore(
  { count: 1 },
  {
    logger(event) {
      console.info("[counter]", event.kind, event.operation, event.path);
    },
  },
);

store.set("count", (value) => value + 1);
```

Example output:

```text
[counter] mutation set count
```

## Schema versions

Additive changes may keep the same version because persisted plain objects are merged over new defaults. Breaking changes increment `version` and provide a synchronous migration:

```ts
function migrateVersionOne(persisted: unknown) {
  console.info("[reboil] migrateVersionOne", { fromVersion: 1 });

  const previous = persisted as { count?: number };
  return { count: previous.count ?? 1 };
}

export const { store, useStore } = createStore(app, {
  version: 2,
  migrate(persisted, fromVersion) {
    if (fromVersion === 1) return migrateVersionOne(persisted);
    throw new Error(`Unsupported Reboil schema version: ${fromVersion}`);
  },
});
```

When a version-one record is migrated, the application log can show:

```text
[reboil] migrateVersionOne { fromVersion: 1 }
```
