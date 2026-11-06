import { getRegisteredRuntime } from './registry'
import type { LazyPathsOf, Path, PathValue, StateOf, StateShape, Store, StorePathsOf, StoreSubscriber } from './types'

// Application config files augment this marker with their inferred state type.
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface Register {}

type RegisteredState = Register extends { bindings: infer Bindings }
  ? StateOf<Bindings>
  : Register extends { state: infer State }
    ? State extends StateShape
      ? State
      : StateShape
    : StateShape

type RegisteredPath = Register extends { bindings: infer Bindings } ? StorePathsOf<Bindings> : Path<RegisteredState>

type RegisteredLoadPath = Register extends { bindings: infer Bindings } ? LazyPathsOf<Bindings> : never

export interface ReboilConfig {
  stateFile: string
}

/**
 * Declares the generated Reboil configuration.
 *
 * Run `npx reboil init` to create this file and import it before modules use
 * the direct `store`, `setStore`, or `useStore` bindings.
 */
export function defineConfig(config: ReboilConfig): ReboilConfig {
  return config
}

export const store: Store<RegisteredState, RegisteredPath, RegisteredLoadPath> = {
  get(path) {
    return getRegisteredRuntime().get(path as never) as never
  },
  set(path, value) {
    return getRegisteredRuntime().set(path as never, value as never) as never
  },
  subscribe(path, listener) {
    return getRegisteredRuntime().subscribe(path as never, listener as StoreSubscriber<never>)
  },
  reset(path?: never) {
    return path === undefined
      ? (getRegisteredRuntime().reset() as never)
      : (getRegisteredRuntime().reset(path as never) as never)
  },
  load(path) {
    return getRegisteredRuntime().load(path as never)
  },
}

/**
 * Selects one value from the config-registered store in a React component.
 * The component rerenders only when the selected value changes.
 *
 * ```tsx
 * import { useStore } from 'reboil/react'
 *
 * function Counter() {
 *   const count = useStore('count')
 *   return <p>{count}</p>
 * }
 * ```
 *
 * Import the generated `reboil.config.ts` before rendering components that
 * use this binding.
 */
export function useStore<PathName extends RegisteredPath>(path: PathName): PathValue<RegisteredState, PathName> {
  return getRegisteredRuntime().use(path as never) as PathValue<RegisteredState, PathName>
}

/**
 * Writes one value through the config-registered store.
 *
 * ```ts
 * setStore('count', (count) => count + 1)
 * ```
 */
export function setStore<PathName extends RegisteredPath>(
  path: PathName,
  value: import('./types').PathUpdater<PathValue<RegisteredState, PathName>>,
): PathValue<RegisteredState, PathName> {
  return store.set(path, value)
}
