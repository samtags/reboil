import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createLazyStore, createRegisteredStore, resetRegistryForTests } from '../src/registry'
import { StoreRuntime } from '../src/runtime'
import type { StoreBindings } from '../src/types'

function installStorage() {
  const values = new Map<string, string>()
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  }
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { localStorage: storage } })
  return values
}

function state() {
  return {
    user: { name: 'Ada', active: true },
    todos: [
      { title: 'Ship Reboil', completed: false },
      { title: 'Write docs', completed: false },
    ],
    session: { transient: 0 },
  }
}

describe('Reboil runtime', () => {
  beforeEach(() => {
    resetRegistryForTests()
    delete (globalThis as { window?: unknown }).window
  })

  it('reads and immutably updates nested object and array paths', () => {
    const { store } = createRegisteredStore(state(), { id: `read-write-${Math.random()}` })
    expect(store.get('user.name')).toBe('Ada')
    store.set('todos.0.completed', true)
    expect(store.get('todos.0.completed')).toBe(true)
    expect(store.get('todos.1.completed')).toBe(false)
  })

  it('supports functional setters and resets', () => {
    const { store } = createRegisteredStore(state(), { id: `reset-${Math.random()}` })
    expect(store.set('session.transient', (value) => value + 1)).toBe(1)
    expect(store.reset('session.transient')).toBe(0)
    expect(store.reset()).toBeUndefined()
    expect(store.get('session.transient')).toBe(0)
  })

  it('rejects invalid paths without changing state', () => {
    const { store } = createRegisteredStore(state(), { id: `invalid-${Math.random()}` })
    expect(() => store.set('user.missing' as never, true as never)).toThrow(/Path segment/)
    expect(store.get('user.name')).toBe('Ada')
  })

  it('hydrates synchronously, deep merges objects, and replaces arrays', async () => {
    const values = installStorage()
    values.set(
      'hydrate',
      JSON.stringify({
        version: 1,
        state: { user: { name: 'Grace' }, todos: [{ title: 'Persisted', completed: true }] },
      }),
    )
    const { store } = createRegisteredStore(state(), { id: 'hydrate' })
    expect(store.get('user.name')).toBe('Grace')
    expect(store.get('user.active')).toBe(true)
    expect(store.get('todos.0.title')).toBe('Persisted')
    expect(() => store.get('todos.1' as never)).toThrow(/Path segment/)
  })

  it('restores excluded values from defaults after reload', () => {
    const values = installStorage()
    const first = createRegisteredStore(state(), { id: 'exclude', persist: { exclude: ['session.transient'] } })
    first.store.set('session.transient', 42)
    const raw = JSON.parse(values.get('exclude:$root')!)
    expect(raw.state.session.transient).toBe(0)
  })

  it('logs no-ops and rejected mutations through a custom logger', () => {
    const logger = vi.fn()
    const { store } = createRegisteredStore(state(), { id: `logger-${Math.random()}`, logger })
    store.set('user.name', 'Ada')
    expect(() => store.set('user.missing' as never, true as never)).toThrow()
    expect(logger).toHaveBeenCalledWith(expect.objectContaining({ kind: 'mutation', changed: false }))
    expect(logger).toHaveBeenCalledWith(expect.objectContaining({ kind: 'rejected' }))
  })

  it('notifies only subscribers whose selected value changed', () => {
    const runtime = new StoreRuntime(state(), { id: `subscriptions-${Math.random()}` })
    const userName = vi.fn()
    const active = vi.fn()
    runtime.subscribe('user.name', userName)
    runtime.subscribe('user.active', active)
    runtime.set('user.name', 'Grace')
    expect(userName).toHaveBeenCalledTimes(1)
    expect(active).not.toHaveBeenCalled()
  })

  it('supports vanilla subscriptions with current and previous values', () => {
    const { store } = createRegisteredStore(state(), { id: `vanilla-subscriptions-${Math.random()}` })
    const listener = vi.fn()
    const unsubscribe = store.subscribe('user.name', listener)

    store.set('user.name', 'Grace')
    expect(listener).toHaveBeenCalledWith('Grace', 'Ada')

    unsubscribe()
    store.set('user.name', 'Lin')
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('does not replace parent snapshots or notify on no-op sets', () => {
    const runtime = new StoreRuntime(state(), { id: `noop-${Math.random()}` })
    const parent = vi.fn()
    runtime.subscribe('user', parent)
    runtime.set('user.name', 'Ada')
    expect(parent).not.toHaveBeenCalled()
    expect(runtime.get('user.name')).toBe('Ada')
  })

  it('migrates older envelopes before merging current defaults', () => {
    const values = installStorage()
    values.set('migration', JSON.stringify({ version: 1, state: { user: { name: 'Grace' } } }))
    const initial = state()
    const { store } = createRegisteredStore<typeof initial>(initial, {
      id: 'migration',
      version: 2,
      migrate(persisted, fromVersion) {
        expect(fromVersion).toBe(1)
        return { ...(persisted as typeof initial), session: { transient: 7 } }
      },
    })
    expect(store.get('user.name')).toBe('Grace')
    expect(store.get('user.active')).toBe(true)
    expect(store.get('session.transient')).toBe(7)
    expect(JSON.parse(values.get('migration:$root')!).version).toBe(2)
  })

  it('keeps memory and persisted data unchanged when a write fails', () => {
    const values = installStorage()
    values.set('atomic', JSON.stringify({ version: 1, state: state() }))
    const { store } = createRegisteredStore(state(), { id: 'atomic' })
    expect(store.get('user.name')).toBe('Ada')
    const originalSet = window.localStorage.setItem.bind(window.localStorage)
    window.localStorage.setItem = () => {
      throw new Error('disk full')
    }
    expect(() => store.set('user.name', 'Grace')).toThrow('disk full')
    expect(store.get('user.name')).toBe('Ada')
    expect(JSON.parse(values.get('atomic:$root')!).state.user.name).toBe('Ada')
    window.localStorage.setItem = originalSet
  })

  it('composes eager stores into one typed runtime with separate persistence partitions', () => {
    const values = installStorage()
    const reports = createRegisteredStore({ count: 1 })
    const app = createRegisteredStore({ session: { ready: true }, reports }, { id: 'composed' })

    expect(app.store.get('reports.count')).toBe(1)
    expect(reports.store.set('count', 2)).toBe(2)
    app.store.set('session.ready', false)
    expect(app.store.get('reports.count')).toBe(2)
    expect(JSON.parse(values.get('composed:$part:reports')!).state.count).toBe(2)
    expect(JSON.parse(values.get('composed:$root')!).state).toEqual({ session: { ready: false } })
  })

  it('requires one unparented application root', () => {
    const first = createRegisteredStore({ count: 1 })
    createRegisteredStore({ other: true })
    expect(() => first.store.get('count')).toThrow(/multiple unparented stores/i)
  })

  it('preserves state and refreshes eager defaults across development re-registration', () => {
    const reports = createRegisteredStore({ count: 1 })
    const app = createRegisteredStore({ version: 1, reports }, { id: 'fast-refresh' })
    app.store.set('version', 2)
    reports.store.set('count', 5)

    const refreshedReports = createRegisteredStore({ count: 7 })
    const refreshedApp = createRegisteredStore({ version: 9, reports: refreshedReports }, { id: 'fast-refresh' })

    expect(refreshedApp.store.get('version')).toBe(2)
    expect(refreshedReports.store.get('count')).toBe(5)
    expect(refreshedApp.store.reset('version')).toBe(9)
    expect(refreshedReports.store.reset('count')).toBe(7)
  })

  it('loads a lazy store once and shares it between root and scoped bindings', async () => {
    const loader = vi.fn(async () => ({ default: createRegisteredStore({ count: 1 }) }))
    const reports = createLazyStore(loader)
    const app = createRegisteredStore({ ready: true, reports }, { id: 'lazy' })

    expect(app.store.get('ready')).toBe(true)
    expect(() => app.store.get('reports.count')).toThrow(/not loaded/i)
    await Promise.all([reports.load(), app.store.load('reports')])
    expect(loader).toHaveBeenCalledTimes(1)
    expect(app.store.get('reports.count')).toBe(1)
    reports.store.set('count', 3)
    expect(app.store.get('reports.count')).toBe(3)
  })

  it('caches a rejected lazy loader', async () => {
    const failure = new Error('feature unavailable')
    const loader = vi.fn(async () => {
      throw failure
    })
    const reports = createLazyStore(loader)
    const app = createRegisteredStore({ reports }, { id: 'lazy-error' })

    await expect(app.store.load('reports')).rejects.toBe(failure)
    await expect(reports.load()).rejects.toBe(failure)
    expect(loader).toHaveBeenCalledTimes(1)
  })

  it('throws the lazy loading promise from useStore for React Suspense', async () => {
    type ReportStore = StoreBindings<{ count: number }>
    let resolveModule!: (value: { default: ReportStore }) => void
    const reports = createLazyStore(
      () =>
        new Promise<{ default: ReportStore }>((resolve) => {
          resolveModule = resolve
        }),
    )
    const app = createRegisteredStore({ reports }, { id: 'suspense' })

    let suspended: unknown
    try {
      app.useStore('reports.count')
    } catch (error) {
      suspended = error
    }
    expect(suspended).toBeInstanceOf(Promise)
    resolveModule({ default: createRegisteredStore({ count: 1 }) })
    await suspended
    expect(app.store.get('reports.count')).toBe(1)
  })

  it('preserves legacy nested state when the lazy partition loads', async () => {
    const values = installStorage()
    values.set('legacy-composed', JSON.stringify({ version: 1, state: { ready: true, reports: { count: 42 } } }))
    const reports = createLazyStore(async () => ({ default: createRegisteredStore({ count: 1 }) }))
    const app = createRegisteredStore({ ready: false, reports }, { id: 'legacy-composed' })

    expect(app.store.get('ready')).toBe(true)
    expect(values.has('legacy-composed')).toBe(false)
    await reports.load()
    expect(reports.store.get('count')).toBe(42)
  })

  it('invalidates loaded and unloaded partitions through a reset epoch', async () => {
    installStorage()
    const reports = createLazyStore(async () => ({ default: createRegisteredStore({ count: 1 }) }))
    const app = createRegisteredStore({ ready: true, reports }, { id: 'epoch-reset' })
    await reports.load()
    app.store.set('reports.count', 9)
    app.store.reset()
    expect(app.store.get('reports.count')).toBe(1)

    resetRegistryForTests()
    const nextReports = createLazyStore(async () => ({ default: createRegisteredStore({ count: 1 }) }))
    const nextApp = createRegisteredStore({ ready: true, reports: nextReports }, { id: 'epoch-reset' })
    expect(nextApp.store.get('ready')).toBe(true)
    await nextReports.load()
    expect(nextReports.store.get('count')).toBe(1)
  })
})
