import { ReboilError } from './errors'
import { StoreRuntime, type RuntimeBindings } from './runtime'
import type { StateShape, StoreOptions } from './types'

interface Registry {
  runtime?: StoreRuntime<StateShape>
}

const registryKey = Symbol.for('reboil.registry')
const globalRegistry = globalThis as typeof globalThis & { [registryKey]?: Registry }
const registry: Registry = globalRegistry[registryKey] ?? (globalRegistry[registryKey] = {})

export function createRegisteredStore<State extends StateShape>(
  initialState: State,
  options: StoreOptions<State> = {},
): RuntimeBindings<State> {
  const id = options.id ?? 'reboil'
  if (registry.runtime) {
    if (registry.runtime.id !== id)
      throw new ReboilError(`Reboil supports one application store; "${registry.runtime.id}" is already registered.`)
    if (isProduction()) throw new ReboilError(`Reboil store "${id}" was registered more than once in production.`)
    registry.runtime.refreshDefaults(initialState)
    return registry.runtime.bindings as unknown as RuntimeBindings<State>
  }

  const runtime = new StoreRuntime(initialState, options)
  registry.runtime = runtime as unknown as StoreRuntime<StateShape>
  return runtime.bindings
}

export function getRegisteredRuntime(): StoreRuntime<StateShape> {
  if (!registry.runtime)
    throw new ReboilError(
      'Reboil has not been initialized. Import the generated reboil.config.ts before using direct package bindings.',
    )
  return registry.runtime
}

export function resetRegistryForTests(): void {
  registry.runtime = undefined
}

function isProduction(): boolean {
  return typeof process !== 'undefined' && process.env.NODE_ENV === 'production'
}
