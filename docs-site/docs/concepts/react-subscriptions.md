---
title: React subscriptions
sidebar_position: 3
---

# React subscriptions

`useStore(path)` uses `useSyncExternalStore` to subscribe a component to one selected value:

```tsx
const foo = useStore('foo');
const version = useStore('settings.runTimeVersion');
```

A component rerenders only when its selected value changes according to `Object.is`. Updating one sibling path does not rerender subscribers of an unchanged sibling.

For non-React code, use `store.subscribe(path, listener)`. The listener receives the new value first and the previous value second, and the returned function removes the subscription.
