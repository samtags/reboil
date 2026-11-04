# Reboil

> String-path state access with zero boilerplate and synchronous persistence out of the box.

Reboil is a planned TypeScript state library for Expo, React Native, and client-side React web applications. It provides a single application store, typed string paths, synchronous persistence, path-level React subscriptions, and development-time mutation logging without exposing a React Context or requiring a Provider.

## Project Status

Reboil is currently in the specification stage. The API and behavior below describe the agreed v1 design; they have not been implemented yet.

This README is the living source of truth for product requirements, public API decisions, technical constraints, and implementation scope.

The developer documentation website and Reboil agent skill are also specified below but have not been implemented or published.

## Positioning

Reboil is designed for developers who want persisted application state without reducers, actions, providers, hydration gates, or manually threading a store through components.

The core promise is:

- String-path access for reads and writes.
- Full TypeScript autocomplete for valid paths and their values.
- Synchronous hydration and persistence.
- One Provider-free application store.
- Expo native and React web compatibility.
- Redux-style observability during development.

## Goals

- Make persisted state available synchronously as soon as the store is registered.
- Provide path autocomplete while a developer types expressions such as `store.get('settings.`.
- Infer the return and mutation value type from the selected path.
- Let components subscribe with `useStore(path)` and no Context, Provider, or store argument.
- Persist all state by default while supporting typed exclusions.
- Log every attempted mutation in development and remain silent by default in production.
- Keep the common setup to one typed application store module with no generation or registration commands.
- Offer an optional one-time initializer for teams that prefer direct package imports.

## Non-goals for v1

- Multiple named application stores.
- Expo Go support.
- Server-side mutations or per-request SSR stores.
- Asynchronous persistence adapters.
- Non-JSON state such as functions, dates, maps, sets, symbols, or class instances.
- Encryption managed directly by Reboil.
- Dynamic record-key autocomplete.

## Planned Documentation Website

Reboil will have a dedicated documentation website for developers. The website will present the same contract as this README in a format that is easier to navigate, search, link, and consume from both browsers and coding agents.

The README remains the canonical product specification while Reboil is under development. The website must be derived from or checked against this source so the two do not silently diverge.

The documentation website will be built with Docusaurus. Its Markdown-first content model, versioned documentation support, static output, navigation, and search ecosystem will provide the foundation for both the developer-facing pages and the agent-ready resources described below.

### Developer experience

The documentation website will provide:

- A concise landing page explaining Reboil's positioning and current release status.
- A five-minute quick start for the default typed application-store workflow.
- A separate guide for optional `reboil init` config registration.
- API reference pages for `createStore`, `store.get`, `store.set`, `store.subscribe`, `store.reset`, `useStore`, and `setStore`.
- Guides for typed paths, arrays, persistence, exclusions, migrations, logging, errors, and Fast Refresh.
- Expo, React Native, Expo Web, and browser React compatibility notes.
- Copyable TypeScript examples with clear expected types.
- Search, stable section URLs, responsive navigation, and accessible keyboard behavior.
- Readable code blocks and visible focus states.
- Clear labels that distinguish planned behavior from released functionality.

The intended information architecture is:

```text
Overview
├── Why Reboil
├── Installation
├── Quick start
└── Platform support

Core concepts
├── Store creation
├── Typed string paths
├── React subscriptions
├── Synchronous persistence
└── Development logging

Guides
├── Default typed store module
├── Optional config registration
├── Persistence exclusions
├── Schema migrations
├── Arrays and tuples
├── Error handling
└── Expo development builds

Reference
├── Public API
├── Configuration
├── Supported values
├── Runtime errors
└── Compatibility

Agents
├── Agent documentation index
├── Machine-readable contract
└── Downloadable Reboil skill
```

### Agent-ready documentation

The website will expose first-class machine-readable surfaces rather than asking agents to scrape presentation markup:

- `/llms.txt` with a concise project summary, canonical documentation links, and recommended reading order.
- `/llms-full.txt` with the complete public contract in plain text or Markdown.
- `/docs.json` with version, status, topic metadata, stable identifiers, URLs, and concise section summaries.
- `/skills/reboil/SKILL.md` as the canonical downloadable Reboil skill entrypoint.
- Stable semantic headings and anchors that match the machine-readable topic identifiers.
- Structured metadata identifying Reboil as software documentation and marking unreleased features accurately.
- A sitemap and crawler policy that expose public documentation and machine-readable resources.
- Code examples that remain meaningful without visual styling and identify their language explicitly.

When supported by the browser, the website may also register read-only WebMCP tools:

- `search_reboil_docs` to return matching documentation sections for a query.
- `get_reboil_doc_section` to return a section by stable identifier.

These tools must return concise JSON-serializable results, validate their inputs, and never be required for ordinary website use.

### Documentation quality requirements

- Human-readable pages and machine-readable resources must describe the same API and constraints.
- Every public API must have at least one minimal example and its failure behavior documented.
- Examples must use the currently recommended default workflow unless explicitly demonstrating optional config registration.
- Platform-specific requirements, especially MMKV and the lack of Expo Go support, must remain prominent.
- Search and deep links must work without relying on client-only rendering.
- Core documentation must remain usable without JavaScript.
- Accessibility checks must cover headings, landmarks, keyboard navigation, contrast, focus visibility, and reduced motion.
- Broken internal links, missing anchors, malformed structured data, and stale generated resources must fail documentation verification.

## Planned Reboil Agent Skill

The Reboil agent skill is a separate artifact from the documentation website. It will help coding agents implement, integrate, review, and document Reboil without repeatedly rediscovering its non-obvious constraints.

The planned repository structure is:

```text
skills/reboil/
├── SKILL.md
├── agents/
│   └── openai.yaml
└── references/
    └── contract.md
```

### Skill discovery

The skill will be named `reboil` and allow normal implicit invocation. Its description will target requests that involve:

- Implementing or reviewing the Reboil package.
- Adding Reboil to an Expo, React Native, or browser React application.
- Using typed Reboil paths and hooks correctly.
- Configuring persistence, migrations, exclusions, or logging.
- Running or maintaining optional `reboil init` behavior.
- Updating Reboil documentation or examples.

It should not activate for unrelated state libraries or generic React state questions that do not involve Reboil.

### Skill responsibilities

The skill will instruct agents to preserve these invariants:

- No React Context or Provider in Reboil's store architecture.
- The default workflow uses typed bindings returned by `createStore` and exported from the application's store module.
- Optional direct package imports require one-time config registration and module augmentation.
- Type inference must work without recurring generation or watch commands.
- Native persistence is synchronous through MMKV; browser persistence is synchronous through `localStorage`.
- Expo native consumers require a development or production build rather than Expo Go.
- Mutations persist before they commit in memory or notify subscribers.
- Invalid mutation paths are logged in development and then throw without changing state.
- Persisted state accepts only the documented JSON-safe values.
- Development logging defaults on, production logging defaults off.
- README, developer documentation, machine-readable resources, and the skill contract must stay consistent after public API changes.

### Progressive disclosure

`SKILL.md` will contain only the routing rules, essential invariants, and task workflow. Detailed API behavior and examples will live in `references/contract.md`, which agents read when implementing or reviewing runtime behavior, types, persistence, or the initializer.

The website will provide a downloadable copy of the complete skill folder. The repository copy remains canonical during development.

### Skill validation

Before release, the skill must:

- Pass the Codex skill validator for frontmatter, naming, metadata, and unfinished placeholders.
- Be tested against realistic integration, implementation, review, and documentation prompts.
- Correctly choose between the default typed-module workflow and optional config registration.
- Avoid suggesting Expo Go, asynchronous hydration, React Context, or recurring code generation.
- Point agents to the current contract instead of embedding stale duplicated specifications.

## Planned Installation

The exact npm package identity must be confirmed before publishing. `reboil` is the current working package and import name.

For Expo and React Native, the native persistence layer will use `react-native-mmkv` v4 and `react-native-nitro-modules`. Expo consumers must install native dependencies with Expo's version-aware installer and create a native build:

```sh
npx expo install reboil react-native-mmkv react-native-nitro-modules
npx expo prebuild
```

MMKV contains native code, so an Expo development or production build is required. It will not run in Expo Go. See the [official MMKV Expo setup](https://github.com/margelo/react-native-mmkv#expo).

Browser React applications will use `localStorage` and will not require MMKV.

## Planned Quick Start

Define the application state and export its inferred bindings from one module:

```ts
// store.ts
import { createStore } from "reboil";

const app = {
  foo: "bar",
  baz: true,
  settings: {
    runTimeVersion: "3.14.15",
  },
};

export const { store, useStore } = createStore(app);
```

Components import the typed hook from the application's store module:

```tsx
import { useStore } from "@/store";

export function Component() {
  const foo = useStore("foo");
  const runTimeVersion = useStore("settings.runTimeVersion");

  return null;
}
```

Importing the application store module initializes it through normal JavaScript module evaluation. There is no separate registration import, generation command, React Context, Provider, store prop, or store parameter.

## Planned Public API

### `createStore(initialState, options?)`

Creates the application store, synchronously restores its persisted state, and returns a typed object containing `store` and `useStore`. The inferred type of `initialState` flows through that return value using standard TypeScript generics.

```ts
export const { store, useStore } = createStore(app, {
  id: "reboil",
  version: 1,
  persist: {
    exclude: ["session.transientValue"],
  },
  migrate(persisted, fromVersion) {
    return migrateToCurrentState(persisted, fromVersion);
  },
  logger: true,
});
```

Planned options:

| Option            | Default            | Behavior                                                            |
| ----------------- | ------------------ | ------------------------------------------------------------------- |
| `id`              | `'reboil'`         | Namespaces the persisted state.                                     |
| `version`         | `1`                | Identifies the current persisted schema.                            |
| `migrate`         | None               | Synchronously converts older persisted state to the current schema. |
| `persist.exclude` | `[]`               | Typed paths that remain reactive in memory but are not persisted.   |
| `logger`          | Development logger | Enables, disables, or replaces the mutation logger.                 |

V1 is designed around one exported application store module. A repeated creation using the same ID is allowed during Fast Refresh and preserves the current state while refreshing its defaults. A second creation in production throws.

### `store.get(path)`

Returns the current value at a typed path.

```ts
const foo = store.get("foo");
//    ^? string

const version = store.get("settings.runTimeVersion");
//    ^? string
```

Typing `store.get('settings.` should suggest `runTimeVersion`. Invalid literal paths must fail TypeScript validation.

### `store.set(path, valueOrUpdater)`

Synchronously validates, persists, commits, and returns a new value.

```ts
const foo = store.set("foo", "bars");
//    ^? string

const nextFoo = store.set("foo", (previous) => `${previous}!`);
//    ^? string

store.set("settings.runTimeVersion", "3.14.16");
```

The provided value and updater return value must match the type at the selected path. A separate `update` method is unnecessary; functional updates use `set`.

Mutations are immutable. Reboil clones only the affected object and array containers along the path.

### `store.subscribe(path, listener)`

Subscribes vanilla JavaScript or other non-React code to a typed path. The listener receives the new value first and the previous value second, and runs only when that selected value changes. The returned function removes the subscription.

```ts
const unsubscribe = store.subscribe("nested.key.or.not", (value, lastValue) => {
  console.log({ value, lastValue });
});

unsubscribe();
```

Subscriptions also receive updates caused by `store.reset(path)` or `store.reset()` when their selected value changes.

### `store.reset(path?)`

Restores a path or the complete store from the original defaults, persists the result, notifies affected subscribers, and returns the restored value.

```ts
const foo = store.reset("foo");
const initialState = store.reset();
```

### `useStore(path)`

Subscribes a React component to the value at one typed path.

```tsx
const foo = useStore("foo");
const version = useStore("settings.runTimeVersion");
```

The hook will use `useSyncExternalStore`. A component rerenders only when its selected value changes according to `Object.is`. Updating one sibling path must not rerender subscribers of an unchanged sibling.

### `setStore(path, valueOrUpdater)`

Writes a value at a typed path from React components or other module code. The value may be passed directly or derived from the previous value with an updater function.

```tsx
import { setStore } from "reboil/react";

setStore("count", 2);
setStore("nested.key", (previous) => previous);
```

The direct `setStore` binding uses the same registered runtime as `useStore` and validates the path and value before committing the update.

## Typed String Paths

V1 paths use dot notation and support nested plain objects and numeric array indices.

```ts
store.get("settings.runTimeVersion");
store.get("todos.0.title");
store.set("todos.0.completed", true);
```

Path rules:

- Object keys containing `.` are unsupported because the dot is the path delimiter.
- Regular arrays accept numeric index segments such as `todos.0`.
- Tuples may expose their known indices precisely.
- Missing intermediate properties and out-of-range array indices are runtime errors.
- Runtime-invalid mutation attempts are logged as rejected and then throw.
- Invalid writes never persist, update memory, or notify subscribers.

## Type Inference

Reboil will use a generic factory rather than generated declarations. `createStore(app)` infers the state type from `app` and carries it into its returned `store` and `useStore` bindings.

```ts
// store.ts
import { createStore } from "reboil";

const app = {
  user: {
    name: "Ada",
  },
  todos: [{ title: "Ship Reboil", completed: false }],
};

export const { store, useStore } = createStore(app);
```

```tsx
// Component.tsx
import { store, useStore } from "@/store";

const name = store.get("user.name");
//    ^? string

const completed = useStore("todos.0.completed");
//    ^? boolean
```

The package will implement reusable `Path<State>` and `PathValue<State, Path>` types. Because the bindings retain the inferred `State` generic:

- IntelliSense is available immediately after ordinary TypeScript analysis.
- Changing the initial state updates path and value types without running a command.
- `tsc`, editor diagnostics, and CI all use the same types.
- There are no generated files, watchers, module augmentations, compiler plugins, or stale schemas.

This requires consumers to import `store` and `useStore` from their application store module rather than directly from `reboil`. The package itself exports `createStore` and its public types.

## Optional Config Registration

The typed application store module remains the default and simplest workflow. Reboil will also offer an optional initializer for teams that prefer this component API:

```tsx
import { useStore } from "reboil/react";

export function Component() {
  const foo = useStore("foo");

  return null;
}
```

The optional workflow begins with one command:

```sh
npx reboil init
```

This is a one-time project setup, not recurring type generation. After initialization, changes to the state file flow into IntelliSense through `typeof initialState`; developers do not run a generator or watcher.

### Initialization flow

`reboil init` will:

1. Detect the application framework and package root.
2. Ask where the state file should live, offering a detected or conventional default.
3. Create the state file when it does not exist.
4. Generate `reboil.config.ts` and link it to the state export.
5. Add the config to the TypeScript program when existing `include` rules would exclude it.
6. Detect and safely wire the application entry point so the config executes before application modules.
7. Show the proposed changes before writing them.

Example interaction:

```text
$ npx reboil init

✓ Detected Expo Router
? Where should the state file live? › src/state.ts
✓ Created reboil.config.ts
✓ Created custom entry: index.ts
✓ Updated package.json main
✓ Registered Reboil with TypeScript
```

### Generated config

The generated TypeScript config will connect the runtime state and its static type:

```ts
// reboil.config.ts
import { createStore, defineConfig } from "reboil";
import { initialState } from "./src/state";

createStore(initialState);

export default defineConfig({
  stateFile: "./src/state.ts",
});

declare module "reboil" {
  interface Register {
    state: typeof initialState;
  }
}
```

Reboil will expose an augmentable named `Register` interface. The direct `store` export and the `useStore` and `setStore` exports from `reboil/react` derive their path and value types from `Register['state']`. The augmentation references the state value rather than copying its shape, so ordinary TypeScript analysis updates IntelliSense whenever the state changes.

The config uses `.ts` rather than `.js` because it contains TypeScript module augmentation. A JavaScript config would require a separate declaration file and provide no DX advantage.

### Smart entry-point handling

The initializer will use framework-specific detection rather than blindly searching for a filename:

| Application                      | Entry handling                                                                                                                |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Expo Router                      | Create or patch a custom root entry that imports `reboil.config` before `expo-router/entry`, then update `package.json#main`. |
| Standard Expo                    | Detect `package.json#main` or create a custom entry using `registerRootComponent`.                                            |
| React Native CLI                 | Patch the root or platform-specific `index` entry before the application import.                                              |
| Vite React                       | Patch the detected `src/main` entry.                                                                                          |
| Create React App                 | Patch the detected `src/index` entry.                                                                                         |
| Ambiguous or unsupported project | Present candidates and require the developer to select or supply an entry path.                                               |

For Expo Router, the resulting custom entry will follow this order:

```ts
import "./reboil.config";
import "expo-router/entry";
```

`expo-router/entry` remains last so Reboil initializes before route modules load.

### Initializer safeguards

- Parse JavaScript and TypeScript entries through an AST rather than regular expressions.
- Make repeated initialization idempotent.
- Never duplicate config imports or overwrite existing state.
- Preserve existing custom-entry logic and comments.
- Detect monorepos and require application-package selection when multiple candidates exist.
- Support `--state <path>` and `--entry <path>` overrides.
- Support `--dry-run` to preview all changes.
- Automatically apply only high-confidence entry detection; prompt on ambiguity.
- Abort with precise manual instructions when a file cannot be modified safely.

### Workflow comparison

| Workflow                     | Component import            | Setup                  | Type maintenance                          |
| ---------------------------- | --------------------------- | ---------------------- | ----------------------------------------- |
| Default typed module         | `@/store`                   | None                   | Automatic generic inference               |
| Optional config registration | `reboil` and `reboil/react` | One-time `reboil init` | Automatic `typeof initialState` inference |

Both workflows use the same runtime store, path types, persistence, logger, and React subscription behavior. The optional initializer changes only how the store is registered and where consumers import its bindings.

## Persistence

Persistence is synchronous on every supported client platform.

| Platform                  | Adapter            | Hydration              | Writes                          |
| ------------------------- | ------------------ | ---------------------- | ------------------------------- |
| Expo/React Native iOS     | MMKV               | Synchronous            | Synchronous                     |
| Expo/React Native Android | MMKV               | Synchronous            | Synchronous                     |
| Expo Web/browser React    | `localStorage`     | Synchronous            | Synchronous                     |
| Server environment        | In-memory defaults | No persisted hydration | Not a supported mutation target |

Reboil will store a versioned JSON envelope under the configured store ID. On registration, persisted plain objects are deeply merged over new defaults so additive schema changes receive their default values. Persisted arrays replace default arrays rather than merging by index.

All paths persist by default. An excluded path remains usable and reactive during the current session but returns to its initial default after reload.

### Atomic mutations

Each mutation follows this order:

1. Validate the path and compute the next immutable state.
2. Validate that the result is JSON-safe.
3. Serialize and synchronously persist the next state.
4. Commit the in-memory state.
5. Notify affected subscribers.
6. Emit the development log.
7. Return the committed path value.

If validation, serialization, migration, or persistence fails, the previous in-memory and persisted states remain authoritative. The failure is logged in development and then thrown.

A no-op `set`, where the next path value is `Object.is` equal to the previous value, is still logged. It does not write or notify subscribers.

### Supported values

Persisted state is limited to JSON-safe values:

- Strings.
- Finite numbers.
- Booleans.
- `null`.
- Plain objects containing supported values.
- Arrays containing supported values.

Reboil rejects `undefined`, `NaN`, infinities, `BigInt`, symbols, functions, cyclic structures, dates, maps, sets, and class instances.

### Browser storage fallback

If browser storage is unavailable, Reboil falls back to in-memory state and emits a development warning. State remains usable but cannot survive a page reload.

## Schema Versions and Migrations

The default schema version is `1`. Additive changes may use the same version because persisted objects are merged over current defaults.

Breaking changes increment `version` and provide a synchronous migration:

```ts
export const { store, useStore } = createStore(app, {
  version: 2,
  migrate(persisted, fromVersion) {
    if (fromVersion === 1) {
      return migrateVersionOne(persisted);
    }

    throw new Error(`Unsupported Reboil schema version: ${fromVersion}`);
  },
});
```

When persisted and configured versions differ, initialization requires a successful migration. Missing or failed migrations preserve the stored data and throw rather than silently discarding user state. A stored version newer than the application version also throws.

## Development Logging

Logging is enabled by default in development and disabled by default in production.

Successful mutations use a collapsed console group similar to `redux-logger` and include:

- Operation and path.
- Previous state.
- Attempted value or updater result.
- Next state.
- Whether the mutation changed a value.

Rejected mutations include:

- Attempted operation and path.
- Current state.
- Attempted value when safely printable.
- The invalid or missing path segment.
- Validation, serialization, migration, or persistence error.

Example development output:

```text
[reboil] set settings.runTimeVersion
  previous state  { ... }
  action          { path: "settings.runTimeVersion", value: "3.14.16" }
  next state      { ... }
```

```text
[reboil] rejected set settings.missing
  current state   { ... }
  action          { path: "settings.missing", value: true }
  error           Path segment "missing" was not found
```

On native, runtime console output appears through Metro. On web, it appears in browser developer tools. Applications may explicitly disable logging or provide a custom logger callback.

## React and Web Behavior

- React integration uses an external store and `useSyncExternalStore`, never React Context.
- Reboil targets client-side React applications and Expo Web.
- Server rendering may read initial defaults through the hook's server snapshot, but server mutations and per-request stores are outside v1.
- Browser persistence activates only where `localStorage` is available.
- Importing the application store module creates the store before its exported bindings can be used.
- In optional config mode, the generated entry import initializes Reboil before application or route modules load.

## Error Handling

Reboil will throw descriptive errors for:

- Direct package access before optional config registration executes.
- Multiple production registrations.
- Missing object path segments.
- Out-of-range array indices.
- Unsupported state values.
- Serialization failures.
- Persistence failures.
- Missing, failed, or incompatible migrations.

Mutation failures are logged before they throw when development logging is active.

## Planned Verification

### Runtime behavior

- Root and nested reads.
- Immutable root, object, and array writes.
- Functional setters.
- Path and complete-store resets.
- No-op mutations.
- Strict invalid paths and array bounds.
- Excluded persistence paths.
- Path-specific subscriptions and cleanup.

### Persistence

- Synchronous hydration before `createStore` returns.
- MMKV and browser reload behavior.
- Deep merging of new defaults.
- Array replacement behavior.
- Versioned migrations.
- Corrupt or unsupported persisted data.
- Browser storage fallback.
- Atomic behavior when persistence fails.

### Type inference

- Path autocomplete at every object level.
- Correct `get` and `useStore` return types.
- Correct `set` value and updater types.
- Typed `store.subscribe` callbacks with new and previous values.
- Numeric array paths and exact tuple indices.
- Compile-time rejection of invalid paths and values.
- Immediate type updates in the default workflow after editing the initial state, without commands or generated files.
- Inference through destructured `store` and `useStore` factory bindings.
- Optional config augmentation that follows `typeof initialState` without regeneration.

### Optional initializer

- Expo Router, standard Expo, React Native CLI, Vite, and Create React App detection fixtures.
- Correct state-file and entry-point suggestions.
- Safe AST insertion before application imports.
- Expo Router custom-entry ordering with `expo-router/entry` last.
- Idempotent reruns and duplicate-import prevention.
- Existing custom-entry preservation.
- Ambiguous, unsupported, and monorepo prompting behavior.
- `--state`, `--entry`, and `--dry-run` behavior.
- TypeScript inclusion when root config files are excluded by the original project configuration.

### React and platforms

- Provider-free hook usage.
- Rerenders only for changed selected values.
- Safe subscription cleanup.
- Expo iOS development build.
- Expo Android development build.
- Expo Web.
- Client-side browser React.

## Technical Decisions

- Reboil creates one application store through a generic factory.
- The application store module exports the typed `store` and `useStore` bindings returned by `createStore`.
- In the default workflow, components import those bindings from the application store module rather than directly from the package.
- Standard TypeScript generic inference provides app-specific paths and values without code generation.
- Optional `reboil init` enables direct package imports through a generated config, one-time module augmentation, and entry-point wiring.
- The optional config references `typeof initialState`, so state edits never require regeneration.
- `set` accepts either a replacement value or a functional updater and returns the committed value.
- `reset` restores one path or all state.
- State persists by default, with optional typed exclusions.
- Native persistence uses MMKV; browser persistence uses `localStorage`.
- Persistence completes before a successful mutation returns.
- Runtime-invalid mutations are logged and throw without changing state.
- React Context is not part of either the public API or internal architecture.
- A dedicated documentation website will serve developers while preserving this README as the canonical specification during development.
- Docusaurus is the selected framework for the documentation website.
- The website will provide matching human-readable pages and agent-ready resources such as `llms.txt`, `llms-full.txt`, `docs.json`, and stable semantic anchors.
- The Reboil agent skill will remain a separate, downloadable artifact whose repository copy is canonical during development.
- The documentation website and agent skill will be implemented only after their contracts are reviewed; neither is part of the current implementation work.

## Discussion Log

### 2026-11-04

- Established `README.md` as the living source of truth.
- Defined the positioning around typed string paths, zero-boilerplate access, and synchronous persistence.
- Chose Expo native and client-side React web as v1 platforms.
- Required path-aware autocomplete and value inference.
- Chose development-on, production-off mutation logging modeled after `redux-logger`.
- Required a Provider-free API with no Context or store parameter.
- Reviewed the `useProps` consumption pattern in `paaorder` and retained its simple call-site experience without its Context-backed implementation.
- Chose direct imports from `reboil` and `reboil/react` backed by config registration and module augmentation.
- Chose MMKV for native synchronous persistence and accepted the Expo development-build requirement.
- Chose runtime console output: Metro on native and browser developer tools on web.
- Chose client-side React support rather than full SSR state management.
- Added typed object and numeric array paths.
- Selected one global store with Fast Refresh-safe re-registration.
- Added optional versioned migrations and strict invalid-path failures.
- Required rejected mutation attempts to appear in the development logger.
- Chose persistence-by-default with typed exclusions.
- Added path and full-store reset behavior.
- Defined `set` to return the committed path value.

### 2026-11-05

- Consolidated all agreed product and implementation details into this README before beginning implementation.
- Replaced direct package-level `store` and `useStore` imports with typed bindings returned by `createStore` and re-exported from the application's store module.
- Removed mandatory codegen, generated declarations, module augmentation, schema watchers, and stale-generation checks from the default design.
- Accepted the local application-store import as the tradeoff for immediate, compiler-native IntelliSense with no extra development commands.
- Added optional config registration for teams that prefer direct imports from `reboil` and `reboil/react`.
- Defined `reboil init` as a one-time setup that creates the state/config bridge, registers its type through module augmentation, and safely wires the application entry point.
- Kept the typed local store module as the default workflow and excluded recurring generation or watch commands from both workflows.
- Planned a dedicated developer documentation website with quick starts, guides, API reference, search, accessible navigation, and explicit release-status labels.
- Selected Docusaurus as the documentation website framework.
- Required agent-ready documentation surfaces including `llms.txt`, `llms-full.txt`, `docs.json`, stable topic identifiers, and a downloadable skill entrypoint.
- Allowed optional read-only WebMCP documentation tools while keeping ordinary pages and machine-readable files fully usable without them.
- Defined the Reboil agent skill as a separate repository artifact with focused instructions, a detailed contract reference, and validation against realistic tasks.
- Deferred all website and skill implementation; only their requirements are documented at this stage.

## Next Steps

1. Review and approve this specification.
2. Scaffold the TypeScript package, platform adapters, React integration, and generic path types.
3. Implement the runtime and default typed-module API against this contract.
4. Implement the optional initializer and framework-aware entry-point handling.
5. Add type, initializer, runtime, React, persistence, and platform verification.
6. Build the documentation website from the approved contract and add verification that its human- and agent-readable surfaces stay synchronized.
7. Create and validate the separate Reboil agent skill, then make its release copy available through the documentation website.
8. Confirm the final npm package name before publication.
