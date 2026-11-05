---
title: Installation
sidebar_position: 1
---

# Installation

## Browser React and Expo Web

```sh
npm install reboil
```

Browser consumers use `localStorage`

## Expo and React Native

The native persistence adapter uses MMKV. Install the package and its native dependencies with Expo's version-aware installer, then create a native build:

```sh
npx expo install reboil react-native-mmkv react-native-nitro-modules
npx expo prebuild
```

MMKV contains native code, so Reboil requires an Expo development or production build. It does not run in Expo Go.

See the [platform support guide](./platform-support) for adapter and hydration behavior.
