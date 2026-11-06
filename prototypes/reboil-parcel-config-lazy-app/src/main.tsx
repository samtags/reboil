import '../reboil.config'
import { StrictMode, Suspense, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { setStore, useStore } from 'reboil/react'
import './styles.css'

const codeExample = `// src/state.ts
import { lazy } from 'reboil'

export const state = {
  settings: {
    showCounterWindow: false,
  },
  // This dynamic import creates the split point.
  window: lazy(() => import('./window-state')),
}

// src/window-state.ts
import { createStore } from 'reboil'

export default createStore({
  count: 0,
})`

const codeMarkup = `<span class="comment">// src/state.ts</span>
<span class="keyword">import</span> { <span class="imported">lazy</span> } <span class="keyword">from</span> <span class="string">'reboil'</span>

<span class="keyword">export</span> <span class="keyword">const</span> <span class="variable">state</span> = {
  <span class="property">settings</span>: {
    <span class="property">showCounterWindow</span>: <span class="boolean">false</span>,
  },
  <span class="comment">// This dynamic import creates the split point.</span>
  <span class="property">window</span>: <span class="function">lazy</span>(() =&gt; <span class="function">import</span>(<span class="string">'./window-state'</span>)),
}

<span class="comment">// src/window-state.ts</span>
<span class="keyword">import</span> { <span class="imported">createStore</span> } <span class="keyword">from</span> <span class="string">'reboil'</span>

<span class="keyword">export default</span> <span class="function">createStore</span>({
  <span class="property">count</span>: <span class="number">0</span>,
})`

function CodeWindow({ onShowWindow }: { onShowWindow?: () => void }) {
  const [copied, setCopied] = useState(false)

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(codeExample)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1400)
    } catch (error) {
      console.error('Could not copy code', error)
    }
  }

  return (
    <>
      <div className="code-window">
        <div className="window-bar">
          <div className="window-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
          <span>src/state.ts + src/window-state.ts</span>
          {onShowWindow ? (
            <button className="show-window-button" type="button" onClick={onShowWindow}>
              Show window
            </button>
          ) : null}
        </div>
        <pre>
          <code dangerouslySetInnerHTML={{ __html: codeMarkup }} />
        </pre>
      </div>
      <div className="code-controls">
        <button
          className={`copy-button${copied ? ' copied' : ''}`}
          type="button"
          aria-label="Copy code"
          title={copied ? 'Copied' : 'Copy code'}
          onClick={copyCode}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <rect x="8" y="8" width="11" height="11" rx="2" />
            <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
          </svg>
          <span className="sr-only">Copy code</span>
        </button>
      </div>
    </>
  )
}

function CounterWindow() {
  const count = useStore('window.count')

  return (
    <aside className="counter-card" aria-label="Counter window">
      <div className="counter-heading">
        <span className="counter-label">window.count</span>
        <button
          className="close-button"
          type="button"
          aria-label="Close counter window"
          onClick={() => setStore('settings.showCounterWindow', false)}
        >
          ×
        </button>
      </div>
      <strong>{count}</strong>
      <button type="button" onClick={() => setStore('window.count', (value) => value + 1)}>
        one up
      </button>
      <button className="reset-link" type="button" onClick={() => setStore('window.count', 0)}>
        reset
      </button>
    </aside>
  )
}

function App() {
  const showCounterWindow = useStore('settings.showCounterWindow')

  return (
    <>
      <header className="topbar">
        <a className="brand" href="/">
          Reboil
        </a>
        <nav aria-label="Primary navigation">
          <a href="">Documentation</a>
          <a href="">Github</a>
        </nav>
      </header>
      <main className="hero">
        <section className="demo" aria-label="Reboil lazy state code example">
          <CodeWindow
            onShowWindow={showCounterWindow ? undefined : () => setStore('settings.showCounterWindow', true)}
          />
          {showCounterWindow ? (
            <Suspense fallback={<aside className="counter-card counter-fallback">Loading counter state…</aside>}>
              <CounterWindow />
            </Suspense>
          ) : null}
        </section>
      </main>
    </>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
