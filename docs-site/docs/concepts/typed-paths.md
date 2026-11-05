---
title: Typed string paths
sidebar_position: 2
---

# Typed string paths

Paths supports dot notation and nested plain objects and numeric array indices:

- `store.get('settings.runTimeVersion');`
- `store.get('todos.0.title');`
- `store.set('todos.0.completed', true);`

The package carries the inferred state type into reusable `Path<State>` and `PathValue<State, Path>` types.
That means changing the initial state updates autocomplete and value types without generation commands.

## Rules

- Object keys containing `.` are unsupported because the dot is the path delimiter.
- Regular arrays accept numeric index segments such as `todos.0`.
- Tuples may expose their known indices precisely.
- Missing intermediate properties and out-of-range indices are runtime errors.
- Invalid writes are logged in development, then throw without changing state.
- Dynamic record-key autocomplete is outside the scope.
