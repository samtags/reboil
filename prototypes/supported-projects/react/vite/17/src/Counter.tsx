import { setStore, useStore } from '@reboil/store/react'

export function Counter() {
  const count = useStore('count')
  return (
    <main>
      <h1>Reboil + Vite + React 17</h1>
      <p aria-live="polite">Count: {count}</p>
      <button type="button" onClick={() => setStore('count', (value) => value - 1)}>
        Decrement
      </button>
      <button type="button" onClick={() => setStore('count', (value) => value + 1)}>
        Increment
      </button>
      <button type="button" onClick={() => setStore('count', 0)}>
        Reset
      </button>
    </main>
  )
}
