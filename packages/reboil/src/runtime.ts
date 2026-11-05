import { useSyncExternalStore } from 'use-sync-external-store/shim'
import { ReboilError, ReboilPathError } from './errors'
import { emitLog, resolveLogger } from './logger'
import {
  cloneJson,
  createPersistenceAdapter,
  deepMergeDefaults,
  isJsonSafe,
  isPlainObject,
  parseEnvelope,
  serializeEnvelope,
  type PersistenceAdapter,
} from './persistence'
import type {
  JsonValue,
  MutationEvent,
  Path,
  PathUpdater,
  StateShape,
  Store,
  StoreOptions,
  StoreSubscriber,
} from './types'

type Listener = () => void
type ChangeListener = StoreSubscriber<JsonValue>

export interface RuntimeBindings<State extends StateShape> {
  store: Store<State>
  useStore: <PathName extends Path<State>>(path: PathName) => import('./types').PathValue<State, PathName>
}

function pathSegments(path: string): string[] {
  if (!path || path.startsWith('.') || path.endsWith('.') || path.includes('..')) {
    throw new ReboilPathError(path, path || '<empty>')
  }
  return path.split('.')
}

function arrayIndex(segment: string): number | null {
  if (!/^(0|[1-9]\d*)$/.test(segment)) return null
  return Number(segment)
}

function readAt(root: JsonValue, path: string): JsonValue {
  const segments = pathSegments(path)
  let current: JsonValue = root
  for (const segment of segments) {
    if (Array.isArray(current)) {
      const index = arrayIndex(segment)
      if (index === null || index >= current.length) throw new ReboilPathError(path, segment)
      current = current[index]
    } else if (isPlainObject(current) && Object.prototype.hasOwnProperty.call(current, segment)) {
      current = current[segment]
    } else {
      throw new ReboilPathError(path, segment)
    }
  }
  return current
}

function writeAt(root: JsonValue, path: string, value: JsonValue): JsonValue {
  const segments = pathSegments(path)
  const containers: JsonValue[] = [root]
  let current: JsonValue = root
  for (const segment of segments.slice(0, -1)) {
    current = readAt(current, segment)
    containers.push(current)
  }

  let replacement: JsonValue = value
  for (let index = segments.length - 1; index >= 0; index -= 1) {
    const container = containers[index]
    const segment = segments[index]
    if (Array.isArray(container)) {
      const itemIndex = arrayIndex(segment)
      if (itemIndex === null || itemIndex >= container.length) throw new ReboilPathError(path, segment)
      const next = container.slice()
      next[itemIndex] = replacement
      replacement = next
    } else if (isPlainObject(container)) {
      if (!Object.prototype.hasOwnProperty.call(container, segment)) throw new ReboilPathError(path, segment)
      replacement = { ...container, [segment]: replacement }
    } else {
      throw new ReboilPathError(path, segment)
    }
  }
  return replacement
}

function safeActionValue(value: unknown): unknown {
  if (typeof value === 'function') return '[updater]'
  if (isJsonSafe(value)) return cloneJson(value)
  return '[unprintable value]'
}

function isSameValue(a: unknown, b: unknown): boolean {
  return Object.is(a, b)
}

export class StoreRuntime<State extends StateShape> {
  readonly id: string
  private state: State
  private defaults: State
  private version: number
  private exclude: string[]
  private migrate: StoreOptions<State>['migrate']
  private logger
  private adapter: PersistenceAdapter
  private listeners = new Map<string, Set<ChangeListener>>()

  constructor(
    initialState: State,
    private readonly options: StoreOptions<State>,
  ) {
    this.id = options.id ?? 'reboil'
    this.version = options.version ?? 1
    this.exclude = options.persist?.exclude?.map(String) ?? []
    this.migrate = options.migrate
    this.logger = resolveLogger(options.logger)
    this.defaults = this.validateState(initialState, 'initial state')
    this.adapter = createPersistenceAdapter((message) => {
      if (typeof console !== 'undefined' && !this.isProduction()) console.warn(`[reboil] ${message}`)
    }, this.id)
    this.state = this.hydrate()
  }

  get bindings(): RuntimeBindings<State> {
    const store: Store<State> = {
      get: (path) => this.get(path),
      set: (path, value) => this.set(path, value),
      subscribe: (path, listener) => this.subscribe(path, listener),
      reset: (path?: never) => (path === undefined ? this.reset() : this.reset(path)),
    } as Store<State>
    return {
      store,
      useStore: (path) => this.use(path),
    }
  }

  refreshDefaults(initialState: State): void {
    this.defaults = this.validateState(initialState, 'refreshed initial state')
  }

  get<PathName extends Path<State>>(path: PathName): import('./types').PathValue<State, PathName> {
    return readAt(this.state, String(path)) as import('./types').PathValue<State, PathName>
  }

  set<PathName extends Path<State>>(
    path: PathName,
    value: PathUpdater<import('./types').PathValue<State, PathName>>,
  ): import('./types').PathValue<State, PathName> {
    const pathName = String(path)
    const previous = this.state
    try {
      const previousValue = readAt(previous, pathName)
      const attempted = typeof value === 'function' ? (value as (previous: unknown) => unknown)(previousValue) : value
      if (!isJsonSafe(attempted)) throw new ReboilError(`Value at "${pathName}" is not JSON-safe.`)
      const next = this.validateState(writeAt(previous, pathName, attempted as JsonValue) as State, 'next state')
      const changed = !isSameValue(previousValue, attempted)
      if (changed) {
        this.persist(next)
        this.state = next
        this.notify(previous, next)
      }
      this.emit({
        kind: 'mutation',
        operation: 'set',
        path: pathName,
        previousState: previous,
        action: { path: pathName, value: safeActionValue(attempted), updater: typeof value === 'function' },
        nextState: changed ? next : previous,
        changed,
      })
      return attempted as import('./types').PathValue<State, PathName>
    } catch (error) {
      this.reject('set', pathName, value, previous, error)
      throw error
    }
  }

  reset<PathName extends Path<State>>(path?: PathName): State | import('./types').PathValue<State, PathName> {
    const previous = this.state
    try {
      if (path === undefined) {
        const next = cloneJson(this.defaults)
        if (!isSameValue(previous, next)) this.persist(next)
        this.state = next
        this.notify(previous, next)
        this.emit({
          kind: 'mutation',
          operation: 'reset',
          previousState: previous,
          nextState: next,
          changed: !isSameValue(previous, next),
        })
        return next
      }

      const pathName = String(path)
      const restored = readAt(this.defaults, pathName)
      const next = this.validateState(writeAt(previous, pathName, cloneJson(restored)) as State, 'reset state')
      const changed = !isSameValue(readAt(previous, pathName), restored)
      if (changed) this.persist(next)
      this.state = next
      this.notify(previous, next)
      this.emit({
        kind: 'mutation',
        operation: 'reset',
        path: pathName,
        previousState: previous,
        nextState: next,
        changed,
      })
      return restored as import('./types').PathValue<State, PathName>
    } catch (error) {
      this.reject('reset', path === undefined ? undefined : String(path), undefined, previous, error)
      throw error
    }
  }

  subscribe<PathName extends Path<State>>(
    path: PathName,
    listener: StoreSubscriber<import('./types').PathValue<State, PathName>>,
  ): () => void {
    const pathName = String(path)
    const changeListener = listener as ChangeListener
    const listeners = this.listeners.get(pathName) ?? new Set<ChangeListener>()
    listeners.add(changeListener)
    this.listeners.set(pathName, listeners)
    return () => {
      listeners.delete(changeListener)
      if (listeners.size === 0) this.listeners.delete(pathName)
    }
  }

  use<PathName extends Path<State>>(path: PathName): import('./types').PathValue<State, PathName> {
    const pathName = String(path)
    const subscribe = (listener: Listener) => this.subscribe(pathName as PathName, () => listener())
    const getSnapshot = () => this.get(path)
    return useSyncExternalStore(subscribe, getSnapshot, getSnapshot) as import('./types').PathValue<State, PathName>
  }

  private hydrate(): State {
    const raw = this.adapter.read(this.id)
    if (raw === null) return cloneJson(this.defaults)

    try {
      const envelope = parseEnvelope(raw)
      let persisted: StateShape = envelope.state
      let migrated = false
      if (envelope.version !== this.version) {
        if (envelope.version > this.version) {
          throw new ReboilError(
            `Persisted Reboil schema version ${envelope.version} is newer than application version ${this.version}.`,
          )
        }
        if (!this.migrate)
          throw new ReboilError(
            `Persisted Reboil schema version ${envelope.version} requires a migration to version ${this.version}.`,
          )
        persisted = this.migrate(cloneJson(persisted), envelope.version)
        migrated = true
      }
      if (!isJsonSafe(persisted) || !isPlainObject(persisted))
        throw new ReboilError('Migrated or persisted Reboil state is not JSON-safe.')
      const merged = deepMergeDefaults(this.defaults, persisted) as State
      const hydrated = this.restoreExcludedDefaults(merged)
      if (migrated) this.writeEnvelope(hydrated)
      return hydrated
    } catch (error) {
      this.emit({
        kind: 'rejected',
        operation: 'reset',
        currentState: this.defaults,
        error: error instanceof Error ? error : new Error(String(error)),
      })
      throw error
    }
  }

  private persist(next: State): void {
    this.writeEnvelope(this.restoreExcludedDefaults(cloneJson(next)))
  }

  private writeEnvelope(state: State): void {
    this.adapter.write(this.id, serializeEnvelope({ version: this.version, state }))
  }

  private restoreExcludedDefaults(state: State): State {
    let next = state as JsonValue
    for (const excludedPath of this.exclude) {
      try {
        const defaultValue = readAt(this.defaults, excludedPath)
        next = writeAt(next, excludedPath, cloneJson(defaultValue))
      } catch (error) {
        throw new ReboilError(`Persistence exclusion "${excludedPath}" is invalid.`, { cause: error })
      }
    }
    return next as State
  }

  private validateState(value: unknown, label: string): State {
    if (!isJsonSafe(value) || !isPlainObject(value))
      throw new ReboilError(`Reboil ${label} must be a JSON-safe plain object.`)
    return cloneJson(value as State)
  }

  private notify(previous: State, next: State): void {
    for (const [path, listeners] of this.listeners) {
      const lastValue = readAt(previous, path)
      const value = readAt(next, path)
      if (!isSameValue(lastValue, value)) {
        for (const listener of [...listeners]) listener(value, lastValue)
      }
    }
  }

  private reject(
    operation: 'set' | 'reset',
    path: string | undefined,
    value: unknown,
    currentState: State,
    error: unknown,
  ): void {
    this.emit({
      kind: 'rejected',
      operation,
      path,
      currentState,
      action: { path, value: safeActionValue(value), updater: typeof value === 'function' },
      error: error instanceof Error ? error : new Error(String(error)),
    })
  }

  private emit(event: MutationEvent<State>): void {
    emitLog(this.logger, event)
  }

  private isProduction(): boolean {
    return typeof process !== 'undefined' && process.env.NODE_ENV === 'production'
  }
}
