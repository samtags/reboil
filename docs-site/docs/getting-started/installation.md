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

Browser consumers use `localStorage`

## Initialize state

Initialize your global store by running this command:

```sh
npx reboil init
```
