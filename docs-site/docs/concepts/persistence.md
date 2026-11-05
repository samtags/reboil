---
title: Synchronous persistence
sidebar_position: 4
---

# Synchronous persistence

All state persists by default. A path excluded with `persist.exclude` remains usable and reactive during the current session but returns to its initial default after reload.

## Atomic mutations

Every mutation follows this order:

1. Validate the path and compute the next immutable state.
2. Validate that the result is JSON-safe.
3. Serialize and synchronously persist the next state.
4. Commit the in-memory state.
5. Notify affected subscribers.
6. Emit the development log.
7. Return the committed path value.

If validation, serialization, migration, or persistence fails, the previous in-memory and persisted states remain authoritative.

## Supported values

Persisted state is limited to strings, finite numbers, booleans, `null`, plain objects containing supported values, and arrays containing supported values. `undefined`, `NaN`, infinities, `BigInt`, symbols, functions, cyclic structures, dates, maps, sets, and class instances are rejected.
