<p align="center">
  <img src="./docs-site/static/img/reboil.svg" alt="Reboil" width="96" height="96" />
</p>

<h1 align="center">Reboil</h1>

<p align="center">
  Typed string-path state with synchronous persistence for React, React Native, and vanilla JavaScript.
</p>

Reboil gives an application one small, Provider-free store. Read, write, reset, and subscribe to state through dot-separated paths while TypeScript infers both the valid paths and the value at each path.

> [!IMPORTANT]
> Reboil is pre-1.0. The core is implemented and tested, but the public API may change while the project is prepared for its first public release.

## Why Reboil?

- Typed dot-path access such as `settings.theme` and `todos.0.title`
- Path-level React subscriptions without Context or a Provider
- Synchronous hydration and writes through `localStorage` on the web and MMKV on native
- Immutable updates with direct values or updater functions
- Typed persistence exclusions and synchronous schema migrations
- Vanilla JavaScript subscriptions and development-time mutation logging
- A single application store with a small API

## Platform support

| Platform                               | Persistence    | Notes                                                           |
| -------------------------------------- | -------------- | --------------------------------------------------------------- |
| Browser React and Expo Web             | `localStorage` | Synchronous hydration and writes                                |
| Expo / React Native on iOS and Android | MMKV           | Requires a development or production build                      |
| Vanilla browser JavaScript             | `localStorage` | Use `store.subscribe` instead of React bindings                 |
| Server environments                    | In memory      | Persisted hydration and server-side mutations are not supported |

Expo Go is not supported because MMKV contains native code.

## Installation

For browser React, Expo Web, or vanilla JavaScript:

```sh
npm install reboil
```

For Expo and React Native, install Reboil and its native peer dependencies, then create a native build:

```sh
npx expo install reboil react-native-mmkv react-native-nitro-modules
npx expo prebuild
```

## Quick start

Create a store module. Reboil infers every valid path and its corresponding value type from the initial state.

```ts
// src/store.ts
import { createStore } from "reboil";

export const { store, useStore } = createStore(
  {
    count: 0,
    settings: {
      theme: "light" as "light" | "dark",
    },
  },
  { id: "my-app" },
);
```

Subscribe to only the path a component needs, then update it through the same store:

```tsx
// src/Counter.tsx
import { store, useStore } from "./store";

export function Counter() {
  const count = useStore("count");

  return (
    <button
      type="button"
      onClick={() => store.set("count", (value) => value + 1)}
    >
      Count: {count}
    </button>
  );
}
```

Paths and values remain type-safe:

```ts
store.get("settings.theme"); // 'light' | 'dark'
store.set("settings.theme", "dark"); // valid
store.set("settings.theme", "blue"); // TypeScript error
store.subscribe("count", (value, previous) => {});
store.reset("settings.theme");
store.reset();
```

State persists by default. Reboil accepts JSON-safe plain objects, arrays, strings, finite numbers, booleans, and `null`.

## Direct package bindings

For applications that prefer imports from `reboil` and `reboil/react`, the initializer creates a typed config and wires it into the application entry point:

```sh
npx reboil init
```

You can then use the registered store from anywhere:

```tsx
import { setStore, useStore } from "reboil/react";

export function Counter() {
  const count = useStore("count");

  return (
    <button onClick={() => setStore("count", (value) => value + 1)}>
      {count}
    </button>
  );
}
```

Run `npx reboil init --help` for explicit state and entry-file options or to preview changes with `--dry-run`.

## Persistence and migrations

Exclude session-only values from persisted state with typed paths:

```ts
const { store } = createStore(initialState, {
  id: "my-app",
  version: 2,
  persist: {
    exclude: ["session.transientValue"],
  },
  migrate(persisted, fromVersion) {
    return migrateToVersionTwo(persisted, fromVersion);
  },
});
```

Mutations are validated and persisted before the in-memory state is committed. Failed validation, serialization, migration, or storage writes leave the previous state authoritative and throw an error.

## API

| API                                   | Purpose                                                   |
| ------------------------------------- | --------------------------------------------------------- |
| `createStore(initialState, options?)` | Register the application store and return typed bindings  |
| `store.get(path)`                     | Read the current value at a path                          |
| `store.set(path, valueOrUpdater)`     | Validate, persist, and commit a value                     |
| `store.subscribe(path, listener)`     | Subscribe outside React; returns an unsubscribe function  |
| `store.reset(path?)`                  | Restore a path or the complete store to its initial value |
| `useStore(path)`                      | Subscribe a React component to one path                   |
| `setStore(path, valueOrUpdater)`      | Update the registered store through `reboil/react`        |

The complete guides and reference live in [`docs-site/docs`](./docs-site/docs/overview.md). Runnable examples are available for [React with local bindings](./examples/reboil-parcel-app), [React with config registration](./examples/reboil-parcel-config-app), and [vanilla JavaScript](./examples/reboil-vanilla-app).

## Repository layout

```text
packages/reboil/                  Package source, tests, and type tests
examples/reboil-parcel-app/      React example using local bindings
examples/reboil-parcel-config-app/ React example using `reboil init`
examples/reboil-vanilla-app/     Browser JavaScript example
docs-site/                        Docusaurus documentation site
skills/reboil/                   Reboil skill for coding agents
```

## Development

Install dependencies and verify the package from the repository root:

```sh
npm install
npm run build
npm test
npm run typecheck
```

Start an example with its workspace name:

```sh
npm run dev --workspace reboil-parcel-app
```

The documentation site has its own dependency tree and requires Node.js 20 or newer:

```sh
npm install --prefix docs-site
npm run start --prefix docs-site
```

## License

Reboil is available under the [MIT License](./LICENSE).
