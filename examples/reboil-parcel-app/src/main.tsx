import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { store, useStore } from './store'
import './styles.css'

function Counter() {
  const count = useStore('count')
  const lastAction = useStore('lastAction')

  return (
    <section className="card">
      <p className="eyebrow">Live subscription</p>
      <h2>{count}</h2>
      <p className="muted">The count and action label subscribe to separate paths.</p>
      <button
        type="button"
        onClick={() => {
          store.set('count', (previous) => previous + 1)
          store.set('lastAction', `Incremented at ${new Date().toLocaleTimeString()}`)
        }}
      >
        Increment count
      </button>
      <p className="action">Last action: {lastAction}</p>
    </section>
  )
}

function ThemeControl() {
  const theme = useStore('settings.theme')

  return (
    <section className="card">
      <p className="eyebrow">Sibling subscription</p>
      <h2>{theme}</h2>
      <p className="muted">This component only rerenders when settings.theme changes.</p>
      <button
        type="button"
        onClick={() => store.set('settings.theme', (previous) => previous === 'light' ? 'dark' : 'light')}
      >
        Toggle theme
      </button>
    </section>
  )
}

function App() {
  return (
    <main className="page">
      <div className="intro">
        <p className="eyebrow">Reboil × Parcel</p>
        <h1>Small real-app integration</h1>
        <p className="lead">
          Import the typed bindings from one store module, subscribe by path, and write synchronously.
        </p>
      </div>
      <div className="grid">
        <Counter />
        <ThemeControl />
      </div>
      <p className="hint">Open the browser console to see Reboil’s development mutation logs.</p>
    </main>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

