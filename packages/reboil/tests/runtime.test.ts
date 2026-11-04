import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createRegisteredStore, resetRegistryForTests } from '../src/registry'
import { StoreRuntime } from '../src/runtime'

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
    expect(store.reset()).toEqual(state())
  })

  it('rejects invalid paths without changing state', () => {
    const { store } = createRegisteredStore(state(), { id: `invalid-${Math.random()}` })
    expect(() => store.set('user.missing' as never, true as never)).toThrow(/Path segment/)
    expect(store.get('user.name')).toBe('Ada')
  })

  it('hydrates synchronously, deep merges objects, and replaces arrays', async () => {
    const values = installStorage()
    values.set('hydrate', JSON.stringify({
      version: 1,
      state: { user: { name: 'Grace' }, todos: [{ title: 'Persisted', completed: true }] },
    }))
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
    const raw = JSON.parse(values.get('exclude')!)
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
    expect(JSON.parse(values.get('migration')!).version).toBe(2)
  })

  it('keeps memory and persisted data unchanged when a write fails', () => {
    const values = installStorage()
    values.set('atomic', JSON.stringify({ version: 1, state: state() }))
    const { store } = createRegisteredStore(state(), { id: 'atomic' })
    const originalSet = window.localStorage.setItem.bind(window.localStorage)
    window.localStorage.setItem = () => { throw new Error('disk full') }
    expect(() => store.set('user.name', 'Grace')).toThrow('disk full')
    expect(store.get('user.name')).toBe('Ada')
    expect(JSON.parse(values.get('atomic')!).state.user.name).toBe('Ada')
    window.localStorage.setItem = originalSet
  })
})
