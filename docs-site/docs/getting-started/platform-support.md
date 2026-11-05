---
title: Platform support
sidebar_position: 3
---

# Platform support

| Platform                    | Adapter            | Hydration              | Writes                          |
| --------------------------- | ------------------ | ---------------------- | ------------------------------- |
| Expo / React Native iOS     | MMKV               | Synchronous            | Synchronous                     |
| Expo / React Native Android | MMKV               | Synchronous            | Synchronous                     |
| Expo Web / browser React    | `localStorage`     | Synchronous            | Synchronous                     |
| Server environment          | In-memory defaults | No persisted hydration | Not a supported mutation target |

Native consumers need a development or production build because MMKV contains native code. Expo Go is not supported.
