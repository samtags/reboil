# `reboil init` verification fixtures

These projects exercise the initializer against CRA, Parcel React, Vite React, Next.js App Router, Vanilla Vite, React Native Bare, and Expo Router. They live under `prototypes/` because they are internal validation fixtures rather than public examples.

## One-time setup

Run this from the repository root. It builds the local Reboil package and installs dependencies for every fixture:

```sh
npm run setup --prefix prototypes/init
```

The setup step should be repeated after changing Reboil’s package build or a fixture’s dependencies.

## Run the complete matrix

The interactive flow initializes all projects and leaves generated files in place for inspection:

```sh
npm run init --prefix prototypes/init
```

For a non-interactive run, pass `--yes` through to each fixture:

```sh
npm run init --prefix prototypes/init -- --yes
```

The automated verification command initializes every fixture twice, builds/bundles each project, and resets the generated files in a `finally` block:

```sh
npm run verify --prefix prototypes/init
```

Expected initializer output is `Reboil initialized successfully.` on the first run and `Reboil is already initialized; no changes needed.` on the second run.

## Verify one project at a time

The commands below can be run from the repository root; `--prefix` selects the project directory. Omit `-- --yes` to review the proposed changes interactively. If you prefer to `cd` first, run the same commands without the `--prefix <directory>` portion.

### React / Create React App

Directory: `prototypes/init/react/cra`

```sh
npm run reboil:init --prefix prototypes/init/react/cra -- --yes
npm run build --prefix prototypes/init/react/cra
```

Generated or changed files:

- `src/state.ts`
- `src/reboil.config.ts`
- `src/index.js` gets `import './reboil.config'`

### React / Parcel

Directory: `prototypes/init/react/parcel`

```sh
npm run reboil:init --prefix prototypes/init/react/parcel -- --yes
npm run build --prefix prototypes/init/react/parcel
```

Generated or changed files:

- `src/state.ts`
- `reboil.config.ts`
- `src/index.tsx` gets `import '../reboil.config'`

### React / Vite

Directory: `prototypes/init/react/vite`

```sh
npm run reboil:init --prefix prototypes/init/react/vite -- --yes
npm run build --prefix prototypes/init/react/vite
```

Generated or changed files:

- `src/state.ts`
- `reboil.config.ts`
- `src/main.jsx` gets `import '../reboil.config'`

### Next.js

Directory: `prototypes/init/react/next`

```sh
npm run reboil:init --prefix prototypes/init/react/next -- --yes
npm run build --prefix prototypes/init/react/next
```

Generated or changed files:

- `src/state.ts`
- `reboil.config.ts`
- `src/register-state.ts`, containing `import '../reboil.config'`

The generated `register-state.ts` is a custom registration module. It is not a Next.js filename convention; import it from the client entry used by the application when runtime registration is needed.

### Vanilla JavaScript / Vite

Directory: `prototypes/init/vanilla`

```sh
npm run reboil:init --prefix prototypes/init/vanilla -- --yes
npm run build --prefix prototypes/init/vanilla
```

Generated or changed files:

- `src/state.ts`
- `reboil.config.ts`
- `src/main.js` gets `import '../reboil.config'`

### React Native Bare

Directory: `prototypes/init/react-native`

```sh
npm run reboil:init --prefix prototypes/init/react-native -- --yes
tmpdir="$(mktemp -d)"
npx react-native bundle \
  --platform android \
  --dev false \
  --entry-file index.js \
  --bundle-output "$tmpdir/index.android.bundle" \
  --assets-dest "$tmpdir/assets"
```

Generated or changed files:

- `src/state.ts`
- `reboil.config.ts`
- `index.js` gets `import './reboil.config'`

The fixture’s `metro.config.js` maps the local workspace copy of Reboil. Published consumers do not need that fixture-only mapping.

### Expo Router

Directory: `prototypes/init/expo`

```sh
npm run reboil:init --prefix prototypes/init/expo -- --yes
tmpdir="$(mktemp -d)"
npx expo export --platform android --output-dir "$tmpdir"
```

Generated or changed files:

- `src/state.ts`
- `reboil.config.ts`
- root `index.ts` with:

  ```ts
  import './reboil.config'
  import 'expo-router/entry'
  ```

- `package.json#main` changes from `expo-router/entry` to `./index.ts`

## Reset generated files

Reset all fixtures after inspecting them:

```sh
npm run reset --prefix prototypes/init
```

Reset removes generated state/config/registration files and restores Expo Router’s original `package.json#main`. It does not remove installed dependencies or build caches.

## Compatibility coverage

- JavaScript entry detection includes Vite `main.js`/`main.jsx` and Parcel/CRA `index.jsx`/`index.js` patterns.
- CRA keeps the generated TypeScript config inside `src/` so `react-scripts` can resolve it.
- Side-effect imports are detected as already initialized, including generated Expo entries.
- Running initialization twice is byte-stable and does not duplicate imports.
