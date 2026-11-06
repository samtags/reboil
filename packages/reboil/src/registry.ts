import { ReboilError, ReboilStoreNotLoadedError } from './errors'
import {
  cloneJson,
  createPersistenceAdapter,
  isJsonSafe,
  isPlainObject,
  parseEnvelope,
  serializeEnvelope,
  type PersistenceAdapter,
} from './persistence'
import { pathSegments, StoreRuntime } from './runtime'
import type {
  DefinitionLazyPaths,
  DefinitionPaths,
  JsonValue,
  LazyPathsOf,
  LazyStore,
  OwnState,
  PathUpdater,
  ResolvedState,
  StateOf,
  StateShape,
  StoreBindings,
  StoreOptions,
  StorePathsOf,
  StoreSubscriber,
  StoreTypeMarker,
  ValidStoreDefinition,
} from './types'

const graphValueSymbol = Symbol.for('reboil.graph-value')

interface GraphBindings extends Record<PropertyKey, unknown> {
  [graphValueSymbol]: StoreNode | LazyStoreNode
}

interface Manifest {
  format: 2
  epoch: number
}

interface Registry {
  candidates: Set<StoreNode>
  activeRoot?: StoreNode
}

const registryKey = Symbol.for('reboil.registry')
const globalRegistry = globalThis as typeof globalThis & { [registryKey]?: Registry }
const registry: Registry = globalRegistry[registryKey] ?? (globalRegistry[registryKey] = { candidates: new Set() })

function graphValue(value: unknown): StoreNode | LazyStoreNode | null {
  if ((typeof value !== 'object' && typeof value !== 'function') || value === null) return null
  return (value as Partial<GraphBindings>)[graphValueSymbol] ?? null
}

function defineGraphValue<T extends object>(bindings: T, value: StoreNode | LazyStoreNode): T {
  Object.defineProperty(bindings, graphValueSymbol, { configurable: false, enumerable: false, value })
  return bindings
}

function parseManifest(raw: string): Manifest {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch (error) {
    throw new ReboilError('Persisted Reboil partition manifest is not valid JSON.', { cause: error })
  }
  if (
    !isPlainObject(parsed) ||
    parsed.format !== 2 ||
    typeof parsed.epoch !== 'number' ||
    !Number.isInteger(parsed.epoch)
  ) {
    throw new ReboilError('Persisted Reboil partition manifest is invalid.')
  }
  return { format: 2, epoch: parsed.epoch }
}

class StoreTree {
  readonly adapter: PersistenceAdapter
  epoch = 1
  private readonly loaded = new Set<StoreNode>()

  constructor(
    readonly root: StoreNode,
    readonly id: string,
  ) {
    this.adapter = createPersistenceAdapter((message) => {
      if (typeof console !== 'undefined' && !isProduction()) console.warn(`[reboil] ${message}`)
    }, id)
    this.initializeFormat()
  }

  activate(node: StoreNode): void {
    if (node.runtime) return
    node.tree = this
    this.splitPersistedChildren(node)
    node.runtime = new StoreRuntime(node.ownDefaults, node.ownOptions, {
      adapter: this.adapter,
      key: this.partitionKey(node),
      epoch: this.epoch,
      pathPrefix: node.path || undefined,
      inheritedLogger: this.root.ownOptions.logger,
    })
    this.loaded.add(node)
    for (const child of node.children.values()) {
      if (child instanceof StoreNode) this.activate(child)
    }
  }

  resetAll(): void {
    const nextEpoch = this.epoch + 1
    this.adapter.write(this.manifestKey, JSON.stringify({ format: 2, epoch: nextEpoch } satisfies Manifest))
    this.epoch = nextEpoch
    for (const node of this.loaded) node.runtime?.resetForEpoch(nextEpoch)
  }

  partitionKey(node: StoreNode | LazyStoreNode): string {
    const path = node.path
    return path ? `${this.id}:$part:${encodeURIComponent(path)}` : `${this.id}:$root`
  }

  private get manifestKey(): string {
    return `${this.id}:$manifest`
  }

  private initializeFormat(): void {
    const rawManifest = this.adapter.read(this.manifestKey)
    if (rawManifest !== null) {
      this.epoch = parseManifest(rawManifest).epoch
      return
    }

    const legacyRaw = this.adapter.read(this.id)
    if (legacyRaw !== null) {
      const legacy = parseEnvelope(legacyRaw)
      this.stageLegacyNode(this.root, legacy.state, legacy.version)
    }

    this.adapter.write(this.manifestKey, JSON.stringify({ format: 2, epoch: this.epoch } satisfies Manifest))
    if (legacyRaw !== null) this.adapter.remove(this.id)
  }

  private stageLegacyNode(node: StoreNode, rawState: StateShape, version: number): void {
    const ownState: StateShape = { ...rawState }
    for (const [key, child] of node.children) {
      const childState = ownState[key]
      delete ownState[key]
      if (isPlainObject(childState)) {
        this.adapter.write(
          this.partitionKey(child),
          serializeEnvelope({ version, epoch: this.epoch, state: cloneJson(childState) }),
        )
      }
    }
    this.adapter.write(this.partitionKey(node), serializeEnvelope({ version, epoch: this.epoch, state: ownState }))
  }

  private splitPersistedChildren(node: StoreNode): void {
    if (node.children.size === 0) return
    const key = this.partitionKey(node)
    const raw = this.adapter.read(key)
    if (raw === null) return
    const envelope = parseEnvelope(raw)
    if (envelope.epoch !== this.epoch) return

    const ownState: StateShape = { ...envelope.state }
    let changed = false
    for (const [childKey, child] of node.children) {
      const childState = ownState[childKey]
      if (!isPlainObject(childState)) continue
      changed = true
      delete ownState[childKey]
      const childPartitionKey = this.partitionKey(child)
      const existing = this.adapter.read(childPartitionKey)
      if (existing === null || parseEnvelope(existing).epoch !== this.epoch) {
        this.adapter.write(
          childPartitionKey,
          serializeEnvelope({ version: envelope.version, epoch: this.epoch, state: cloneJson(childState) }),
        )
      }
    }
    if (changed) {
      this.adapter.write(key, serializeEnvelope({ version: envelope.version, epoch: this.epoch, state: ownState }))
    }
  }
}

class StoreNode {
  redirect?: StoreNode
  parent?: StoreNode
  parentKey?: string
  tree?: StoreTree
  runtime?: StoreRuntime<StateShape>
  readonly children = new Map<string, StoreNode | LazyStoreNode>()
  readonly ownDefaults: StateShape = {}
  readonly ownOptions: StoreOptions<StateShape>
  readonly bindings: StoreBindings<StateShape, string, string>

  constructor(definition: Record<string, unknown>, options: StoreOptions<StateShape>) {
    this.ownOptions = options
    for (const [key, value] of Object.entries(definition)) {
      const child = graphValue(value)
      if (child) {
        this.attach(key, child)
        continue
      }
      if (!isJsonSafe(value)) {
        throw new ReboilError(
          `Reboil initial state field "${key}" must be JSON-safe or a store returned by createStore() or lazy().`,
        )
      }
      this.ownDefaults[key] = cloneJson(value)
    }
    this.bindings = defineGraphValue(this.createBindings(), this)
    registry.candidates.add(this)
  }

  get path(): string {
    if (!this.parent || !this.parentKey) return ''
    return this.parent.path ? `${this.parent.path}.${this.parentKey}` : this.parentKey
  }

  get fullSnapshot(): StateShape {
    if (this.redirect) return this.redirect.fullSnapshot
    this.ensureRuntime()
    const snapshot: StateShape = { ...this.runtime!.snapshot }
    for (const [key, child] of this.children) {
      if (child instanceof LazyStoreNode && !child.loaded) throw new ReboilStoreNotLoadedError(child.path)
      const childNode = child instanceof LazyStoreNode ? child.node! : child
      snapshot[key] = childNode.fullSnapshot
    }
    return snapshot
  }

  attach(key: string, child: StoreNode | LazyStoreNode): void {
    if (child.parent && child.parent !== this)
      throw new ReboilError(`Reboil store "${key}" is already attached to another parent.`)
    if (child instanceof StoreNode && child.runtime) {
      throw new ReboilError(`Reboil store "${key}" was used independently before it was composed.`)
    }
    if (child instanceof StoreNode && child.ownOptions.id !== undefined) {
      throw new ReboilError(
        `Nested Reboil store "${key}" cannot define its own id; its persistence key comes from its parent path.`,
      )
    }
    child.parent = this
    child.parentKey = key
    this.children.set(key, child)
    if (child instanceof StoreNode) registry.candidates.delete(child)
  }

  get(path: string): JsonValue {
    if (this.redirect) return this.redirect.get(path)
    const target = this.target(path)
    return target.node.getLocal(target.path)
  }

  set(path: string, value: PathUpdater<never>): JsonValue {
    if (this.redirect) return this.redirect.set(path, value)
    const target = this.target(path)
    return target.node.setLocal(target.path, value)
  }

  subscribe(path: string, listener: StoreSubscriber<never>): () => void {
    if (this.redirect) return this.redirect.subscribe(path, listener)
    const target = this.target(path)
    return target.node.subscribeLocal(target.path, listener)
  }

  reset(path?: string): JsonValue | void {
    if (this.redirect) return this.redirect.reset(path)
    if (path === undefined) {
      this.ensureRuntime()
      if (!this.parent) this.tree!.resetAll()
      else this.runtime!.reset()
      return
    }
    const target = this.target(path)
    return target.node.resetLocal(target.path)
  }

  async load(path: string): Promise<void> {
    if (this.redirect) return this.redirect.load(path)
    const [head, ...tail] = pathSegments(path)
    const child = this.children.get(head)
    if (!child) throw new ReboilError(`"${path}" is not a lazy Reboil store path.`)
    if (child instanceof LazyStoreNode) {
      await child.load()
      if (tail.length > 0) await child.node!.load(tail.join('.'))
      return
    }
    if (tail.length === 0) throw new ReboilError(`"${path}" is eager and does not need to be loaded.`)
    await child.load(tail.join('.'))
  }

  use(path: string): JsonValue {
    if (this.redirect) return this.redirect.use(path)
    const [head, ...tail] = pathSegments(path)
    const child = this.children.get(head)
    if (child) {
      if (tail.length === 0) throw new ReboilError(`Store path "${head}" must select a value inside the child store.`)
      if (child instanceof LazyStoreNode && !child.loaded) throw child.load()
      const childNode = child instanceof LazyStoreNode ? child.node! : child
      return childNode.use(tail.join('.'))
    }
    this.ensureRuntime()
    return this.runtime!.use(path as never)
  }

  ensureRuntime(): void {
    if (this.redirect) {
      this.redirect.ensureRuntime()
      return
    }
    if (this.runtime) return
    if (this.parent) {
      this.parent.ensureRuntime()
      this.tree = this.parent.tree
      this.tree!.activate(this)
      return
    }
    if (registry.activeRoot && registry.activeRoot !== this) {
      const activeId = registry.activeRoot.ownOptions.id ?? 'reboil'
      const nextId = this.ownOptions.id ?? 'reboil'
      if (isProduction() || activeId !== nextId) {
        throw new ReboilError('Only the registered Reboil application root can be activated independently.')
      }
      reconcileRefreshedGraph(registry.activeRoot, this)
      return
    }
    const root = resolveRoot()
    if (root !== this)
      throw new ReboilError('Only the registered Reboil application root can be activated independently.')
    this.tree = new StoreTree(this, this.ownOptions.id ?? 'reboil')
    this.tree.activate(this)
    registry.activeRoot = this
  }

  private target(path: string): { node: StoreNode; path: string } {
    const [head, ...tail] = pathSegments(path)
    const child = this.children.get(head)
    if (!child) return { node: this, path }
    if (tail.length === 0) throw new ReboilError(`Store path "${head}" must select a value inside the child store.`)
    if (child instanceof LazyStoreNode && !child.loaded) throw new ReboilStoreNotLoadedError(child.path)
    return { node: child instanceof LazyStoreNode ? child.node! : child, path: tail.join('.') }
  }

  private getLocal(path: string): JsonValue {
    this.ensureRuntime()
    return this.runtime!.get(path as never) as JsonValue
  }

  private setLocal(path: string, value: PathUpdater<never>): JsonValue {
    this.ensureRuntime()
    return this.runtime!.set(path as never, value) as JsonValue
  }

  private subscribeLocal(path: string, listener: StoreSubscriber<never>): () => void {
    this.ensureRuntime()
    return this.runtime!.subscribe(path as never, listener)
  }

  private resetLocal(path: string): JsonValue {
    this.ensureRuntime()
    return this.runtime!.reset(path as never) as unknown as JsonValue
  }

  private createBindings(): StoreBindings<StateShape, string, string> {
    return {
      store: {
        get: (path: string) => this.get(path),
        set: (path: string, value: unknown) => this.set(path, value as never),
        subscribe: (path: string, listener: StoreSubscriber<never>) => this.subscribe(path, listener),
        reset: (path?: string) => (path === undefined ? this.reset() : this.reset(path)) as never,
        load: (path: string) => this.load(path),
      },
      useStore: (path: string) => this.use(path),
    } as unknown as StoreBindings<StateShape, string, string>
  }
}

class LazyStoreNode {
  redirect?: LazyStoreNode
  parent?: StoreNode
  parentKey?: string
  node?: StoreNode
  private loading?: Promise<void>
  readonly bindings: LazyStore<StateShape, string, string>

  constructor(private readonly loader: () => Promise<unknown>) {
    this.bindings = defineGraphValue(this.createBindings(), this)
  }

  get path(): string {
    if (!this.parent || !this.parentKey) return this.parentKey ?? '<unattached>'
    return this.parent.path ? `${this.parent.path}.${this.parentKey}` : this.parentKey
  }

  get loaded(): boolean {
    return this.redirect ? this.redirect.loaded : Boolean(this.node)
  }

  load(): Promise<void> {
    if (this.redirect) return this.redirect.load()
    if (this.node) return Promise.resolve()
    if (!this.parent || !this.parentKey) {
      return Promise.reject(new ReboilError('Lazy Reboil stores must be composed before they can be loaded.'))
    }
    this.parent.ensureRuntime()
    const refreshedTarget = this.currentRedirect()
    if (refreshedTarget) return refreshedTarget.load()
    if (!this.loading) {
      this.loading = this.loader().then((moduleValue) => {
        const exported =
          isPlainObject(moduleValue) && Object.prototype.hasOwnProperty.call(moduleValue, 'default')
            ? moduleValue.default
            : undefined
        const loaded = graphValue(exported)
        if (!(loaded instanceof StoreNode)) {
          throw new ReboilError(
            'Reboil lazy() loaders must resolve to a module whose default export is createStore(...).',
          )
        }
        registry.candidates.delete(loaded)
        this.parent!.attach(this.parentKey!, loaded)
        this.node = loaded
        this.parent!.children.set(this.parentKey!, this)
        this.parent!.ensureRuntime()
        this.parent!.tree!.activate(loaded)
      })
    }
    return this.loading
  }

  private requireNode(): StoreNode {
    if (this.redirect) return this.redirect.requireNode()
    if (!this.node) throw new ReboilStoreNotLoadedError(this.path)
    return this.node
  }

  private currentRedirect(): LazyStoreNode | undefined {
    return this.redirect
  }

  private createBindings(): LazyStore<StateShape, string, string> {
    return {
      store: {
        get: (path: string) => this.requireNode().get(path),
        set: (path: string, value: unknown) => this.requireNode().set(path, value as never),
        subscribe: (path: string, listener: StoreSubscriber<never>) => this.requireNode().subscribe(path, listener),
        reset: (path?: string) =>
          (path === undefined ? this.requireNode().reset() : this.requireNode().reset(path)) as never,
        load: (path: string) => this.load().then(() => this.requireNode().load(path)),
      },
      useStore: (path: string) => {
        if (!this.node) throw this.load()
        return this.node.use(path)
      },
      load: () => this.load(),
    } as unknown as LazyStore<StateShape, string, string>
  }
}

/**
 * Creates a typed, composable Reboil store node.
 *
 * Standard application setup runs `npx reboil init`, which calls this from
 * `reboil.config.ts` and registers direct bindings. The returned local
 * bindings are useful for explicit low-level access and store composition.
 *
 * ```ts
 * import { createStore } from 'reboil'
 *
 * const { store, useStore } = createStore({ count: 0 })
 * store.set('count', (count) => count + 1)
 * ```
 */
export function createRegisteredStore<Definition extends Record<string, unknown>>(
  initialState: Definition extends ValidStoreDefinition<Definition> ? Definition : never,
  options: StoreOptions<OwnState<Definition>> = {},
): StoreBindings<ResolvedState<Definition>, DefinitionPaths<Definition>, DefinitionLazyPaths<Definition>> {
  const node = new StoreNode(initialState, options as unknown as StoreOptions<StateShape>)
  return node.bindings as unknown as StoreBindings<
    ResolvedState<Definition>,
    DefinitionPaths<Definition>,
    DefinitionLazyPaths<Definition>
  >
}

export function createLazyStore<Loaded extends StoreTypeMarker>(
  loader: () => Promise<{ default: Loaded }>,
): LazyStore<StateOf<Loaded>, StorePathsOf<Loaded>, LazyPathsOf<Loaded>> {
  const node = new LazyStoreNode(loader)
  return node.bindings as unknown as LazyStore<StateOf<Loaded>, StorePathsOf<Loaded>, LazyPathsOf<Loaded>>
}

export function getRegisteredRuntime(): StoreNode {
  return registry.activeRoot ?? resolveRoot()
}

export function resetRegistryForTests(): void {
  registry.candidates.clear()
  registry.activeRoot = undefined
}

function resolveRoot(): StoreNode {
  if (registry.activeRoot) return registry.activeRoot
  if (registry.candidates.size === 0) {
    throw new ReboilError(
      'Reboil has not been initialized. Import the generated reboil.config.ts before using direct package bindings.',
    )
  }
  if (registry.candidates.size > 1) {
    throw new ReboilError(
      'Reboil found multiple unparented stores. Compose createStore() results into one application root.',
    )
  }
  return [...registry.candidates][0]
}

function reconcileRefreshedGraph(active: StoreNode, fresh: StoreNode): void {
  fresh.redirect = active
  fresh.tree = active.tree
  fresh.runtime = active.runtime
  registry.candidates.delete(fresh)

  for (const key of Object.keys(active.ownDefaults)) delete active.ownDefaults[key]
  Object.assign(active.ownDefaults, cloneJson(fresh.ownDefaults))
  active.runtime?.refreshDefaults(active.ownDefaults)

  for (const [key, freshChild] of fresh.children) {
    const activeChild = active.children.get(key)
    if (!activeChild) continue
    if (activeChild instanceof StoreNode && freshChild instanceof StoreNode) {
      reconcileRefreshedGraph(activeChild, freshChild)
      continue
    }
    if (activeChild instanceof LazyStoreNode && freshChild instanceof LazyStoreNode) {
      freshChild.redirect = activeChild
    }
  }
}

function isProduction(): boolean {
  return typeof process !== 'undefined' && process.env.NODE_ENV === 'production'
}
