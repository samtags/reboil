import { getRegisteredRuntime } from './registry'
import type { Path, PathValue, StateShape, Store, StoreSubscriber } from './types'

export interface Register {}

type RegisteredState = Register extends { state: infer State }
  ? State extends StateShape ? State : StateShape
  : StateShape

export interface ReboilConfig {
  stateFile: string
}

export function defineConfig(config: ReboilConfig): ReboilConfig {
  return config
}

export const store: Store<RegisteredState> = {
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
    return path === undefined ? getRegisteredRuntime().reset() as never : getRegisteredRuntime().reset(path as never) as never
  },
}

export function useStore<PathName extends Path<RegisteredState>>(path: PathName): PathValue<RegisteredState, PathName> {
  return getRegisteredRuntime().use(path as never) as PathValue<RegisteredState, PathName>
}

export function setStore<PathName extends Path<RegisteredState>>(
  path: PathName,
  value: import('./types').PathUpdater<PathValue<RegisteredState, PathName>>,
): PathValue<RegisteredState, PathName> {
  return store.set(path, value)
}
