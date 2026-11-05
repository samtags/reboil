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
  StoreBindings,
  StoreOptions,
  StoreSubscriber,
} from './types'

type Listener = () => void
type ChangeListener = StoreSubscriber<JsonValue>
type RootChangeListener<State extends StateShape> = (value: State, lastValue: State) => void

export type RuntimeBindings<State extends StateShape> = StoreBindings<State>

export interface RuntimePersistence {
  adapter: PersistenceAdapter
  key: string
  epoch: number
  pathPrefix?: string
  inheritedLogger?: StoreOptions<StateShape>['logger']
}

export function pathSegments(path: string): string[] {
  if (!path || path.startsWith('.') || path.endsWith('.') || path.includes('..')) {
    throw new ReboilPathError(path, path || '<empty>')
  }
  return path.split('.')
}

function arrayIndex(segment: string): number | null {
  if (!/^(0|[1-9]\d*)$/.test(segment)) return null
  return Number(segment)
}

export function readAt(root: JsonValue, path: string): JsonValue {
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

export function writeAt(root: JsonValue, path: string, value: JsonValue): JsonValue {
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

export class StoreRuntime<State extends StateShape> {
  readonly id: string
  private state: State
  private defaults: State
  private readonly version: number
  private readonly exclude: string[]
  private readonly migrate: StoreOptions<State>['migrate']
  private readonly logger
  private readonly adapter: PersistenceAdapter
  private readonly persistenceKey: string
  private epoch?: number
  private readonly pathPrefix?: string
  private readonly listeners = new Map<string, Set<ChangeListener>>()
  private readonly rootListeners = new Set<RootChangeListener<State>>()

  constructor(
    initialState: State,
    private readonly options: StoreOptions<State>,
    persistence?: RuntimePersistence,
  ) {
    this.id = options.id ?? 'reboil'
    this.version = options.version ?? 1
    this.exclude = options.persist?.exclude?.map(String) ?? []
    this.migrate = options.migrate
    this.logger = resolveLogger(options.logger ?? (persistence?.inheritedLogger as StoreOptions<State>['logger']))
    this.defaults = this.validateState(initialState, 'initial state')
    this.adapter =
      persistence?.adapter ??
      createPersistenceAdapter((message) => {
        if (typeof console !== 'undefined' && !this.isProduction()) console.warn(`[reboil] ${message}`)
      }, this.id)
    this.persistenceKey = persistence?.key ?? this.id
    this.epoch = persistence?.epoch
    this.pathPrefix = persistence?.pathPrefix
    this.state = this.hydrate()
  }

  get bindings(): RuntimeBindings<State> {
    const store: Store<State> = {
      get: (path) => this.get(path),
      set: (path, value) => this.set(path, value),
      subscribe: (path, listener) => this.subscribe(path, listener),
      reset: (path?: never) => (path === undefined ? this.reset() : this.reset(path)) as never,
      load: async () => undefined,
    } as Store<State>
    return {
      store,
      useStore: (path) => this.use(path),
    } as RuntimeBindings<State>
  }

  get snapshot(): State {
    return this.state
  }

  get defaultSnapshot(): State {
    return this.defaults
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
      if (!isJsonSafe(attempted)) throw new ReboilError(`Value at "${this.fullPath(pathName)}" is not JSON-safe.`)
      const storedValue = cloneJson(attempted)
      const next = writeAt(previous, pathName, storedValue) as State
      if (!isJsonSafe(next) || !isPlainObject(next))
        throw new ReboilError('Reboil next state must be a JSON-safe plain object.')
      const changed = !Object.is(previousValue, attempted)
      if (changed) this.commit(previous, next)
      this.emit({
        kind: 'mutation',
        operation: 'set',
        path: this.fullPath(pathName),
        previousState: previous,
        action: {
          path: this.fullPath(pathName),
          value: safeActionValue(attempted),
          updater: typeof value === 'function',
        },
        nextState: changed ? next : previous,
        changed,
      })
      return attempted as import('./types').PathValue<State, PathName>
    } catch (error) {
      this.reject('set', pathName, value, previous, error)
      throw error
    }
  }

  replace(nextValue: State): void {
    const previous = this.state
    const next = this.validateState(nextValue, 'replacement state')
    if (Object.is(previous, nextValue)) return
    this.commit(previous, next)
  }

  reset<PathName extends Path<State>>(path?: PathName): void | import('./types').PathValue<State, PathName> {
    const previous = this.state
    try {
      if (path === undefined) {
        const next = cloneJson(this.defaults)
        const changed = JSON.stringify(previous) !== JSON.stringify(next)
        if (changed) this.commit(previous, next)
        this.emit({
          kind: 'mutation',
          operation: 'reset',
          previousState: previous,
          nextState: changed ? next : previous,
          changed,
        })
        return
      }

      const pathName = String(path)
      const restored = readAt(this.defaults, pathName)
      const previousValue = readAt(previous, pathName)
      const changed = !Object.is(previousValue, restored)
      if (changed) {
        const next = writeAt(previous, pathName, cloneJson(restored)) as State
        this.commit(previous, next)
        this.emit({
          kind: 'mutation',
          operation: 'reset',
          path: this.fullPath(pathName),
          previousState: previous,
          nextState: next,
          changed: true,
        })
      } else {
        this.emit({
          kind: 'mutation',
          operation: 'reset',
          path: this.fullPath(pathName),
          previousState: previous,
          nextState: previous,
          changed: false,
        })
      }
      return cloneJson(restored) as import('./types').PathValue<State, PathName>
    } catch (error) {
      this.reject('reset', path === undefined ? undefined : String(path), undefined, previous, error)
      throw error
    }
  }

  resetInMemory(): void {
    const previous = this.state
    const next = cloneJson(this.defaults)
    this.state = next
    this.notify(previous, next)
  }

  resetForEpoch(epoch: number): void {
    this.epoch = epoch
    this.resetInMemory()
  }

  subscribe<PathName extends Path<State>>(
    path: PathName,
    listener: StoreSubscriber<import('./types').PathValue<State, PathName>>,
  ): () => void {
    const pathName = String(path)
    readAt(this.state, pathName)
    const changeListener = listener as ChangeListener
    const listeners = this.listeners.get(pathName) ?? new Set<ChangeListener>()
    listeners.add(changeListener)
    this.listeners.set(pathName, listeners)
    return () => {
      listeners.delete(changeListener)
      if (listeners.size === 0) this.listeners.delete(pathName)
    }
  }

  subscribeRoot(listener: RootChangeListener<State>): () => void {
    this.rootListeners.add(listener)
    return () => this.rootListeners.delete(listener)
  }

  use<PathName extends Path<State>>(path: PathName): import('./types').PathValue<State, PathName> {
    const subscribe = (listener: Listener) => this.subscribe(path, () => listener())
    const getSnapshot = () => this.get(path)
    return useSyncExternalStore(subscribe, getSnapshot, getSnapshot) as import('./types').PathValue<State, PathName>
  }

  private hydrate(): State {
    const raw = this.adapter.read(this.persistenceKey)
    if (raw === null) return cloneJson(this.defaults)

    try {
      const envelope = parseEnvelope(raw)
      if (this.epoch !== undefined && envelope.epoch !== this.epoch) return cloneJson(this.defaults)
      let persisted: StateShape = envelope.state
      let migrated = false
      if (envelope.version !== this.version) {
        if (envelope.version > this.version) {
          throw new ReboilError(
            `Persisted Reboil schema version ${envelope.version} is newer than application version ${this.version}.`,
          )
        }
        if (!this.migrate) {
          throw new ReboilError(
            `Persisted Reboil schema version ${envelope.version} requires a migration to version ${this.version}.`,
          )
        }
        persisted = this.migrate(cloneJson(persisted), envelope.version)
        migrated = true
      }
      if (!isJsonSafe(persisted) || !isPlainObject(persisted)) {
        throw new ReboilError('Migrated or persisted Reboil state is not JSON-safe.')
      }
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

  private commit(previous: State, next: State): void {
    this.writeEnvelope(this.restoreExcludedDefaults(cloneJson(next)))
    this.state = next
    this.notify(previous, next)
  }

  private writeEnvelope(state: State): void {
    this.adapter.write(
      this.persistenceKey,
      serializeEnvelope({ version: this.version, state, ...(this.epoch === undefined ? {} : { epoch: this.epoch }) }),
    )
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
    if (!isJsonSafe(value) || !isPlainObject(value)) {
      throw new ReboilError(`Reboil ${label} must be a JSON-safe plain object.`)
    }
    return cloneJson(value as State)
  }

  private notify(previous: State, next: State): void {
    for (const [path, listeners] of this.listeners) {
      const lastValue = readAt(previous, path)
      const value = readAt(next, path)
      if (!Object.is(lastValue, value)) {
        for (const listener of [...listeners]) listener(value, lastValue)
      }
    }
    if (previous !== next) {
      for (const listener of [...this.rootListeners]) listener(next, previous)
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
      path: path === undefined ? this.pathPrefix : this.fullPath(path),
      currentState,
      action: {
        path: path === undefined ? this.pathPrefix : this.fullPath(path),
        value: safeActionValue(value),
        updater: typeof value === 'function',
      },
      error: error instanceof Error ? error : new Error(String(error)),
    })
  }

  private fullPath(path: string): string {
    return this.pathPrefix ? `${this.pathPrefix}.${path}` : path
  }

  private emit(event: MutationEvent<State>): void {
    emitLog(this.logger, event)
  }

  private isProduction(): boolean {
    return typeof process !== 'undefined' && process.env.NODE_ENV === 'production'
  }
}
