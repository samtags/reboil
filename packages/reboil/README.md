# Reboil

Typed, synchronous state for web applications and React Native. Reboil provides dot-path reads and writes, path-level React subscriptions, code-split stores, and synchronous persistence without generated runtime code.

## Install

```sh
npm install reboil
```

For Expo and React Native, install the native peer dependencies with Expo's version-aware installer, then create a development or production build:

```sh
npx expo install reboil react-native-mmkv react-native-nitro-modules
npx expo prebuild
```

MMKV has native code and does not run in Expo Go.

## Start with the initializer

Use the initializer once in an application project:

```sh
npx reboil init
```

It creates `reboil.config.ts`, registers the inferred state type, and wires the config into the application entry point. The config import must run before application modules use the direct `reboil` bindings.

```ts
// src/state.ts
export const initialState = { count: 0 }
```

```ts
// reboil.config.ts
import { createStore, defineConfig } from 'reboil'
import { initialState } from './src/state'

createStore(initialState)

export default defineConfig({ stateFile: './src/state.ts' })

declare module 'reboil' {
  interface Register {
    state: typeof initialState
  }
}
```

## Use state

Read and write the registered store with fully typed dot paths:

```tsx
import { store } from 'reboil'
import { useStore } from 'reboil/react'

export function Counter() {
  const count = useStore('count')

  return (
    <button type="button" onClick={() => store.set('count', (value) => value + 1)}>
      Count: {count}
    </button>
  )
}
```

`createStore()` also returns local `store` and `useStore` bindings for composition and explicit low-level integrations. Standard application setup should use the generated config registration above.

## Agent guidance

Coding agents can install the maintained local skills with:

```sh
npx reboil --prepare agents
```

This package also ships [`AGENTS.md`](./AGENTS.md), [`llms.txt`](./llms.txt), and complete Codex/Claude Code skills under [`skills/`](./skills). They describe the supported integration workflow and runtime invariants without requiring a website visit.

For complete guides, API reference, examples, and issue tracking, see the [Reboil repository](https://github.com/samtags/reboil).

## License

[MIT](./LICENSE)
