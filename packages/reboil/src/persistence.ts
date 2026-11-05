import { ReboilError } from './errors'
import type { JsonValue, StateShape } from './types'

export interface PersistenceAdapter {
  read(key: string): string | null
  write(key: string, value: string): void
}

class MemoryAdapter implements PersistenceAdapter {
  read(): string | null {
    return null
  }

  write(): void {
    // Server state is intentionally not persisted.
  }
}

class BrowserAdapter implements PersistenceAdapter {
  constructor(private readonly storage: Storage) {}

  read(key: string): string | null {
    return this.storage.getItem(key)
  }

  write(key: string, value: string): void {
    this.storage.setItem(key, value)
  }
}

class MMKVAdapter implements PersistenceAdapter {
  constructor(
    private readonly storage: { getString(key: string): string | undefined; set(key: string, value: string): unknown },
  ) {}

  read(key: string): string | null {
    return this.storage.getString(key) ?? null
  }

  write(key: string, value: string): void {
    this.storage.set(key, value)
  }
}

function isReactNative(): boolean {
  const globalValue = globalThis as Record<string, unknown>
  const navigatorValue = globalValue.navigator as { product?: string } | undefined
  return navigatorValue?.product === 'ReactNative' || Boolean(globalValue.__fbBatchedBridge)
}

function getBrowserStorage(): Storage | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null
    const probeKey = '__reboil_storage_probe__'
    window.localStorage.setItem(probeKey, '1')
    window.localStorage.removeItem(probeKey)
    return window.localStorage
  } catch {
    return null
  }
}

function optionalRequire(name: string): unknown {
  try {
    // Keeping this as a dynamic require prevents native-only packages from entering browser bundles.
    const runtimeRequire =
      typeof require === 'function' ? require : (globalThis as { require?: (moduleName: string) => unknown }).require
    return runtimeRequire ? runtimeRequire(name) : null
  } catch {
    return null
  }
}

function hasCreateMMKV(value: unknown): value is {
  createMMKV(options: { id: string }): {
    getString(key: string): string | undefined
    set(key: string, value: string): unknown
  }
} {
  return typeof value === 'object' && value !== null && 'createMMKV' in value && typeof value.createMMKV === 'function'
}

function createNativeAdapter(id: string): PersistenceAdapter {
  const mmkvModule = optionalRequire('react-native-mmkv')
  const nitroModule = optionalRequire('react-native-nitro-modules')
  if (!hasCreateMMKV(mmkvModule) || !nitroModule) {
    throw new ReboilError(
      'Reboil native persistence requires react-native-mmkv v4 and react-native-nitro-modules. Install them and rebuild the native app; Expo Go is not supported.',
    )
  }

  const storage = mmkvModule.createMMKV({ id })
  return new MMKVAdapter(storage)
}

export function createPersistenceAdapter(onWarning: (message: string) => void, id = 'reboil'): PersistenceAdapter {
  if (typeof window !== 'undefined') {
    const browserStorage = getBrowserStorage()
    if (browserStorage) return new BrowserAdapter(browserStorage)
    onWarning('Browser storage is unavailable; Reboil is using in-memory state for this session.')
    return new MemoryAdapter()
  }

  if (isReactNative()) return createNativeAdapter(id)
  return new MemoryAdapter()
}

export interface PersistedEnvelope {
  version: number
  state: StateShape
}

export function parseEnvelope(raw: string): PersistedEnvelope {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch (error) {
    throw new ReboilError('Persisted Reboil data is not valid JSON.', { cause: error })
  }

  if (
    !isPlainObject(parsed) ||
    typeof parsed.version !== 'number' ||
    !Number.isInteger(parsed.version) ||
    !isPlainObject(parsed.state)
  ) {
    throw new ReboilError('Persisted Reboil data has an invalid versioned envelope.')
  }

  return { version: parsed.version, state: parsed.state as StateShape }
}

export function serializeEnvelope(envelope: PersistedEnvelope): string {
  try {
    return JSON.stringify(envelope)
  } catch (error) {
    throw new ReboilError('Reboil could not serialize the next persisted state.', { cause: error })
  }
}

export function isPlainObject(value: unknown): value is Record<string, JsonValue> {
  if (value === null || typeof value !== 'object') return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

export function isJsonSafe(value: unknown, seen = new Set<unknown>()): value is JsonValue {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return true
  if (typeof value === 'number') return Number.isFinite(value)
  if (typeof value !== 'object') return false
  if (seen.has(value)) return false
  seen.add(value)

  if (Array.isArray(value)) {
    const valid = value.every((item) => isJsonSafe(item, seen))
    seen.delete(value)
    return valid
  }

  if (!isPlainObject(value)) return false
  const valid = Object.values(value).every((item) => isJsonSafe(item, seen))
  seen.delete(value)
  return valid
}

export function cloneJson<T extends JsonValue>(value: T): T {
  if (Array.isArray(value)) return value.map((item) => cloneJson(item)) as T
  if (isPlainObject(value)) {
    const copy: Record<string, JsonValue> = {}
    for (const [key, item] of Object.entries(value)) copy[key] = cloneJson(item)
    return copy as T
  }
  return value
}

export function deepMergeDefaults<T extends JsonValue>(defaults: T, persisted: JsonValue): T {
  if (Array.isArray(defaults) && Array.isArray(persisted)) return cloneJson(persisted) as T
  if (isPlainObject(defaults) && isPlainObject(persisted)) {
    const merged: Record<string, JsonValue> = cloneJson(defaults)
    for (const [key, value] of Object.entries(persisted)) {
      const defaultValue = defaults[key]
      merged[key] =
        defaultValue !== undefined && isPlainObject(defaultValue) && isPlainObject(value)
          ? deepMergeDefaults(defaultValue, value)
          : cloneJson(value)
    }
    return merged as T
  }
  return cloneJson(persisted) as T
}
