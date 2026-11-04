import "../reboil.config";
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { store } from 'reboil'
import { useStore } from 'reboil/react'
import './styles.css'

function App() {
  const count = useStore('count')
  const lastAction = useStore('lastAction')
  const theme = useStore('settings.theme')

  return (
    <main className="page">
      <p className="eyebrow">Reboil × Parcel × init</p>
      <h1>Config registration works.</h1>
      <p className="lead">
        These bindings come directly from <code>reboil</code>. The generated entry imports
        <code> reboil.config.ts</code> before this module runs.
      </p>

      <section className="card">
        <div className="value-row">
          <span>Count</span>
          <strong>{count}</strong>
        </div>
        <button
          type="button"
          onClick={() => {
            store.set('count', (previous) => previous + 1)
            store.set('lastAction', `Incremented at ${new Date().toLocaleTimeString()}`)
          }}
        >
          Write through store.set
        </button>
        <p className="action">Last action: {lastAction}</p>
      </section>

      <section className="card">
        <div className="value-row">
          <span>Theme subscription</span>
          <strong>{theme}</strong>
        </div>
        <button
          type="button"
          onClick={() => store.set('settings.theme', (previous) => previous === 'light' ? 'dark' : 'light')}
        >
          Toggle theme
        </button>
      </section>

      <p className="hint">Open the browser console to see Reboil’s development mutation logs.</p>
    </main>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
