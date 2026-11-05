import { createStore, lazy, store } from '../src'
import { setStore, useStore } from '../src/react'
import type { PathValue, Register } from '../src'

const reports = lazy(() => import('./reports-store'))
export const app = createStore({
  settings: { theme: 'light' as 'light' | 'dark' },
  count: 1,
  reports,
})

declare module '../src' {
  interface Register {
    bindings: typeof app
    state: {
      settings: { theme: 'light' | 'dark' }
      count: number
    }
  }
}

if (false) {
  const theme: 'light' | 'dark' = store.get('settings.theme')
  const count: number = useStore('count')
  const generated: number = useStore('reports.count')
  const loadReports: Promise<void> = store.load('reports')
  setStore('count', 2)
  setStore('count', (previous) => previous + 1)
  const typed: PathValue<Register['state'], 'count'> = 1
  const unsubscribe = store.subscribe('count', (value, lastValue) => {
    const next: number = value
    const previous: number = lastValue
    void next
    void previous
  })
  unsubscribe()
  void theme
  void count
  void generated
  void loadReports
  void typed

  // @ts-expect-error invalid direct binding path
  store.get('settings.missing')
  // @ts-expect-error eager root values are not loadable
  store.load('count')
}
