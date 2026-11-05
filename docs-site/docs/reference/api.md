---
title: Public API
sidebar_position: 1
---

# Public API

## `createStore(initialState, options?)`

Creates the application store and returns typed `store` and `useStore` bindings. See [store creation](../concepts/store-creation) for options.

## `store.get(path)`

Returns the current value at a typed path:

```ts
const name = store.get('user.name'); // string
```

## `store.set(path, valueOrUpdater)`

Validates, persists, commits, and returns a new value. Direct values and updater return values must match the type at the selected path:

```ts
store.set('foo', 'bars');
store.set('foo', (previous) => `${previous}!`);
```

## `store.subscribe(path, listener)`

Subscribes vanilla JavaScript or other non-React code to a typed path. The listener receives `(value, previousValue)` and runs only when the selected value changes. Returns an unsubscribe function.

## `store.reset(path?)`

Restores a path or the complete store from the original defaults, persists the result, notifies affected subscribers, and returns the restored value.

## `useStore(path)`

Subscribes a React component to one typed path using `useSyncExternalStore`.

## `setStore(path, valueOrUpdater)`

The direct binding from `reboil/react` writes through the same registered runtime as `useStore` and validates before committing.
