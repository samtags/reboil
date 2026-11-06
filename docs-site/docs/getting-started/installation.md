---
title: Installation
sidebar_position: 1
---

# Installation

## Web and Expo Web

Install the package:

```sh
npm install reboil
```

## Expo and React Native

The native persistence adapter uses MMKV. Install the package and its native dependencies with Expo's version-aware installer, then create a native build:

```sh
npx expo install reboil react-native-mmkv react-native-nitro-modules
npx expo prebuild
```

MMKV contains native code, so Reboil requires an Expo development or production build. It does not run in Expo Go.

See the [platform support guide](./platform-support) for adapter and hydration behavior.

Web consumers use `localStorage`. The core store API works with vanilla JavaScript and browser frameworks; React applications can additionally use the bindings from `reboil/react`.

## Boil the project

From the application package, run:

```sh
npx reboil init
```

The initializer creates a default `src/state.ts` when one does not already exist, generates `reboil.config.ts`, registers the state type, and wires the config into the application entry point. If you already have a state file, it links to that instead.

You do not need to create or copy either file manually. Run the command once during setup; state edits do not require regeneration or a watcher.

To add project-local Reboil skills for Claude Code and Codex, run:

```sh
npx reboil --prepare agents
```

Choose one or both agents in the interactive checklist. Existing customized skills are left unchanged unless you confirm their replacement.

The generated state file starts empty:

```ts title="src/state.ts"
export const initialState = {}
```

The generated config creates the store and registers the state type:

```ts title="reboil.config.ts"
import { createStore, defineConfig } from 'reboil'
import { initialState } from './src/state'

createStore(initialState)

export default defineConfig({
  stateFile: './src/state.ts',
})

declare module 'reboil' {
  interface Register {
    state: typeof initialState
  }
}
```

## Next.js App Router

For Next.js, the generated config uses the standard `defineConfig` API and is loaded through the `ReboilState` client boundary:

```ts title="reboil.config.ts"
'use client'

import { createStore, defineConfig } from 'reboil'
import { initialState } from './src/state'

createStore(initialState)

export default defineConfig({
  stateFile: './src/state.ts',
})

declare module 'reboil' {
  interface Register {
    state: typeof initialState
  }
}
```

The initializer statically imports it into the root layout:

```tsx title="src/app/layout.tsx"
import { ReboilState } from 'reboil/next'
import reboilConfig from '../../reboil.config'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ReboilState config={reboilConfig}>{children}</ReboilState>
      </body>
    </html>
  )
}
```
