# Reboil supported-project verification

This directory is a manual compatibility matrix for Reboil’s standard `reboil init` integration. It is deliberately separate from `prototypes/init`, which regression-tests initializer detection and idempotency.

Each fixture starts as an official project template, installs the local `packages/reboil` package, has Reboil initialized once, and renders the same persisted counter. Re-running `npm run reboil:init` is expected to report that the project is already boiled without changing files.

## Compatibility matrix

| Project | Directory | Exact framework version | Reboil target | Upstream lifecycle | Verification state |
| --- | --- | --- | --- | --- | --- |
| Expo | `expo/52` | Expo 52.0.49 / React Native 0.76.9 | Oldest Expo target | Archived | **Supported for Android development compilation, bundle export, and persistence:** Reboil initialization, TypeScript, Android debug APK compilation/install, Metro Android bundle export, and manual counter persistence verification pass (2026-11-07). Android release remains manual. iOS verification is blocked on this host: Xcode 26.5 / Apple Clang 21 fails while compiling React Native 0.76.9's vendored `fmt` 11.0.2 pod, before Reboil runs. |
| Expo | `expo/58` | Expo 58.0.23 / React Native 0.88.1 | Latest Expo target | Current | `reboil init` and TypeScript pass. Expo Doctor reports a duplicate React installation caused by the local `file:` Reboil link; native run/release build is pending. |
| React Native bare | `react-native/0.75` | React Native 0.75.5 | Historical native boundary | Unsupported | `reboil init` and TypeScript pass, but Android release build fails in Nitro Modules before Reboil runs: Nitro 0.31 requires a newer `ReactModuleInfo` API. Do not support this version. |
| React Native bare | `react-native/0.77` | React Native 0.77.3 | Lowest current native candidate | Unsupported upstream | Fixture added with MMKV 4.3.2 + Nitro 0.37.2. Install, Android, and iOS checks are pending; the first local install was blocked by host disk exhaustion before compilation began. |
| React Native bare | `react-native/0.88` | React Native 0.88.1 | Latest React Native target | Current | **Supported on Android:** initialize, type-check, Metro bundle, and signed release build pass with MMKV 4.3.2 + Nitro 0.37.2. iOS runtime/release verification remains. |
| Next.js App Router | `react/next/13` | Next 13.5.11 / React 18.2.0 | Historical App Router floor | Unsupported | **Supported for development render/build/type-check and browser persistence:** Reboil initialization, the dev counter page, TypeScript, production build, and manual counter persistence verification pass (2026-11-06). |
| Next.js App Router | `react/next/16` | Next 16.4.5 / React 19.3.0 | Latest Next.js target | Active LTS | **Supported for development render/build/type-check and browser persistence:** Reboil initialization, the Turbopack dev counter page, TypeScript, production build, and manual counter persistence verification pass (2026-11-07). |
| Vite React | `react/vite/17` | Vite 8.3.6 / React 17.0.2 | Reboil React peer floor | React 17 is legacy | **Supported for build/type-check and browser persistence:** Reboil initialization, TypeScript, production build, and manual counter persistence verification pass (2026-11-07). |
| Vite React | `react/vite/19` | Vite 8.3.6 / React 19.3.1 | Latest React target | Current | **Supported for build/type-check and browser persistence:** Reboil initialization, TypeScript, production build, and manual counter persistence verification pass (2026-11-07). |
| Parcel React | `react/parcel` | Parcel 2.16.4 / React 19.3.1 | Current Parcel target | Current | **Supported for build/type-check and browser persistence:** Reboil initialization, TypeScript, production build, and manual counter persistence verification pass (2026-11-07). |
| Vanilla | `vanilla` | Vite 8.3.6 | Framework-independent store | Current | **Supported for build/type-check and browser persistence:** Reboil initialization, TypeScript, production build, and manual counter persistence verification pass (2026-11-07). |

“Reboil target” means the version selected for this compatibility suite; it is not a claim that the upstream framework is still maintained. The React Native 0.75 fixture is intentionally retained as a failed lower-bound test. React Native 0.77 is the lowest current candidate because Reboil requires MMKV v4 and Nitro Modules; verify it on both native platforms before publishing a lower-bound support claim. Expo Go is not supported because MMKV needs a native development or production build.

The verification state above was last updated on 2026-11-07. A build/type-check result does not replace the required manual persistence test on a real browser, simulator, or device.

### Expo 52 native pins

Expo 52 uses React Native 0.76.9. Its fixture pins `react-native-mmkv@4.0.0-beta.12` with `react-native-nitro-modules@0.29.4`, the matching generated-code pair whose Android `ReactModuleInfo` call remains compatible with that React Native version. Later Nitro releases use a newer Android API and do not compile against React Native 0.76. Expo SDK 52 also requires Metro package-exports support to be enabled explicitly for Reboil's `reboil/react` export.

### Native persistence behavior

When Metro resolves Reboil for React Native, the `reboil` and `reboil/react` package entries load the native adapter. It statically imports `react-native-mmkv` and Nitro Modules, then gives MMKV precedence over the `window` global that React Native provides for web compatibility. This means persisted state is stored in the named synchronous MMKV instance (by default, `reboil`) rather than falling back to in-memory storage. The linked local fixtures map these peer packages in `metro.config.js`; an installed published package resolves the peers from the application normally.

Native persistence requires a custom development or production build. It cannot run in Expo Go because MMKV includes native code.

## Verify manually

From the repository root, run:

```sh
npm run verify:supported-projects
```

Use the arrow keys to choose a fixture and action, press Enter to run it, or press `q` (or Esc) to exit. The selector builds local Reboil first, then runs the selected action:

- **Install dependencies and initialize Reboil** installs the fixture’s exact dependencies and confirms `reboil init` is idempotent.
- **Run** starts a web development server or launches an iOS/Android app. Increment the counter, terminate or reload the app, and confirm the value persists.
- **Build** produces the framework production bundle. Native build actions compile iOS and Android release builds.
- **Type-check** performs the fixture TypeScript check. Run `npm run doctor` inside each Expo fixture as well.

The linked local Reboil package is intentionally forced to use the fixture's React installation in the Vite fixtures. Vite's `dev` command also rebuilds optimized dependencies on every start, so a prior dependency cache cannot retain a second React instance. The Next fixtures install Reboil's external-store shim directly and alias only that shim to the fixture, which keeps its React peer inside the app without rewriting Next's own server renderer. Do not add a global React alias to `next.config.js`. If Next reports an old bundling result after changing its configuration, stop the server and remove only that fixture's `.next` directory before re-running it.

The direct Next fixture `dev` and `build` commands rebuild the local Reboil package first. This is necessary only because the fixtures use the repository's `file:` link; the published `reboil` package already contains its `dist/` files.

For bare React Native, first choose **Generate native iOS and Android projects**. It runs the official version-pinned React Native initializer into a temporary directory and copies only its generated native project files into the selected fixture. This is required once per fixture before installing/running it and is intentionally not committed.

## Reproducing a fixture from scratch

The fixture source represents the outcome of this flow:

```sh
# Expo 52 or 58
npx create-expo-app@latest reboil-expo --template default@sdk-52
# replace sdk-52 with sdk-58 for the latest fixture

# Bare React Native
npx @react-native-community/cli@latest init ReboilSupportedProject --version 0.77.3
# use 0.88.1 for the latest fixture; 0.75.5 is retained only as a failing boundary test

# Next.js
npx create-next-app@13.5.11 reboil-next --ts --app
# replace 13.5.11 with 16.4.5 for the latest fixture

# Vite React or vanilla
npm create vite@8.3.6 reboil-vite -- --template react-ts
npm create vite@8.3.6 reboil-vanilla -- --template vanilla-ts
```

Install the local package from each generated project, then initialize it:

```sh
npm install <relative-path-to>/packages/reboil
npx reboil init
```

The tracked fixture source includes the resulting `reboil.config.ts`, state registration, and a counter with increment, decrement, and reset actions. Web fixtures exercise `localStorage`; native fixtures exercise MMKV after a development or release build.

## Passing a verification

Record a fixture as verified only after all relevant checks pass without a Reboil, MMKV, Nitro, Metro, or framework error:

1. Install dependencies and rerun `reboil init` without duplicate wiring.
2. Type-check the fixture; for Expo, run `npm run doctor`.
3. Run it, change the count, then reload or relaunch and confirm persistence.
4. Complete the production build.
5. For Expo and bare React Native, repeat steps 3–4 on both iOS and Android.

When a check fails, keep the fixture in the matrix and replace its pending state with the failing command, platform, toolchain versions, and error summary instead of claiming support.
