import { createStore, lazy } from '../src'
import { lazy as reactLazy } from 'react'

if (false) {
  const app = {
    user: { name: 'Ada', active: true },
    todos: [{ title: 'Ship Reboil', completed: false }],
  }

  const { store, useStore } = createStore(app, { id: `types-${Math.random()}` })

  const name: string = store.get('user.name')
  const completed: import('../src/types').PathValue<typeof app, 'todos.0.completed'> = false
  const completedPath: Parameters<typeof useStore>[0] = 'todos.0.completed'
  store.set('user.name', 'Grace')
  store.set('user.name', (previous) => `${previous}!`)
  store.set('todos.0.completed', true)

  void name
  void completed
  void completedPath
  void useStore

  // @ts-expect-error invalid path
  store.get('user.missing')
  // @ts-expect-error invalid hook path
  const invalidHookPath: Parameters<typeof useStore>[0] = 'todos.0.missing'
  // @ts-expect-error invalid value
  store.set('user.active', 'yes')
  void invalidHookPath

  const settings = createStore({ theme: 'system' as 'light' | 'dark' | 'system' })
  const reports = lazy(() => import('./reports-store'))
  const composed = createStore({ ready: true, settings, reports })

  const reportCount: number = composed.store.get('reports.count')
  const scopedCount: number = reports.store.get('count')
  const theme: 'light' | 'dark' | 'system' = composed.useStore('settings.theme')
  const loadReports: Promise<void> = composed.store.load('reports')
  const loadScoped: Promise<void> = reports.load()
  composed.store.set('reports.filters.query', 'open')
  reports.store.set('filters.query', 'closed')

  void reportCount
  void scopedCount
  void theme
  void loadReports
  void loadScoped

  // @ts-expect-error eager child stores are not loadable
  composed.store.load('settings')
  // @ts-expect-error child store roots are not selectable values
  composed.store.get('reports')
  // @ts-expect-error nested store value type remains checked
  composed.store.set('reports.count', 'many')

  const LazyComponent = reactLazy(async () => ({ default: () => null }))
  // @ts-expect-error React.lazy components are not Reboil lazy stores
  createStore({ invalid: LazyComponent })
}
