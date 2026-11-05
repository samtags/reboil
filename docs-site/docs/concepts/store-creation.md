---
title: Store creation
sidebar_position: 1
---

# Store creation

`createStore(initialState, options?)` creates the application store, synchronously restores persisted state, and returns typed `store` and `useStore` bindings.

```ts
export const { store, useStore } = createStore(app, {
  id: "reboil",
  version: 1,
  persist: { exclude: ["session.transientValue"] },
  migrate(persisted, fromVersion) {
    return migrateToCurrentState(persisted, fromVersion);
  },
  logger: true,
});
```

| Option            | Default            | Behavior                                                |
| ----------------- | ------------------ | ------------------------------------------------------- |
| `id`              | `'reboil'`         | Namespaces persisted state.                             |
| `version`         | `1`                | Identifies the current persisted schema.                |
| `migrate`         | None               | Synchronously converts older persisted state.           |
| `persist.exclude` | `[]`               | Typed paths that remain reactive but are not persisted. |
| `logger`          | Development logger | Enables, disables, or replaces mutation logging.        |

## Initialization

The typed application store module is the default workflow. The planned initializer also supports direct imports:

```tsx
import { useStore } from "reboil/react";

export function Component() {
  const foo = useStore("foo");
  return null;
}
```

`npx reboil init` creates a TypeScript config, links it to the state export, and safely wires the application entry point. It is designed to be idempotent and does not create a recurring watcher or generator.
