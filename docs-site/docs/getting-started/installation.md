---
title: Installation
sidebar_position: 1
---

# Installation

## Browser React and Expo Web

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

Browser consumers use `localStorage`.

## Register the application state

Config registration is part of the standard installation. From the application package, run:

```sh
npx reboil init
```

The initializer creates or links `src/state.ts`, generates `reboil.config.ts`, registers the state type, and wires the config into the application entry point. Run it once during setup; state edits do not require regeneration or a watcher.
