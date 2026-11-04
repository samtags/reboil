import { store } from '../src'
import { setStore, useStore } from '../src/react'
import type { PathValue, Register } from '../src'

declare module '../src' {
  interface Register {
    state: {
      settings: { theme: 'light' | 'dark' }
      count: number
    }
  }
}

if (false) {
  const theme: 'light' | 'dark' = store.get('settings.theme')
  const count: number = useStore('count')
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
  void typed

  // @ts-expect-error invalid direct binding path
  store.get('settings.missing')
}
