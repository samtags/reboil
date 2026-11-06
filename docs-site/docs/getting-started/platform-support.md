---
title: Platform support
sidebar_position: 3
---

# Platform support

| Platform                    | Adapter            | Hydration              | Writes                          |
| --------------------------- | ------------------ | ---------------------- | ------------------------------- |
| Expo / React Native iOS     | MMKV               | Synchronous            | Synchronous                     |
| Expo / React Native Android | MMKV               | Synchronous            | Synchronous                     |
| Web browsers / Expo Web     | `localStorage`     | Synchronous            | Synchronous                     |
| Server environment          | In-memory defaults | No persisted hydration | Not a supported mutation target |

Native consumers need a development or production build because MMKV contains native code. Expo Go is not supported.

The web store API is framework agnostic. Use `store.subscribe` with vanilla JavaScript or any browser framework, and add `reboil/react` only when React bindings are needed.
