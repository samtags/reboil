import '../reboil.config'
import { StrictMode, Suspense, useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { store } from 'reboil'
import { setStore, useStore } from 'reboil/react'
import './styles.css'

type EventLog = {
  count: number
  runtime: number
  latest: string
}

type CodeSection = 'create' | 'values' | 'subscription' | 'reset' | 'persistence' | 'splitting'

const codeSnippets: Record<CodeSection, string> = {
  create: `<span class="keyword">import</span> { <span class="imported">createStore</span>, <span class="imported">lazy</span> } <span class="keyword">from</span> <span class="string">'reboil'</span>

<span class="keyword">const</span> <span class="variable">profile</span> = <span class="function">createStore</span>({
  <span class="property">displayName</span>: <span class="string">'Avery'</span>,
  <span class="property">plan</span>: <span class="string">'Team'</span>,
})

<span class="keyword">const</span> <span class="variable">reports</span> = <span class="function">lazy</span>(() =&gt; <span class="function">import</span>(<span class="string">'./reports-state'</span>))

<span class="keyword">export const</span> <span class="variable">app</span> = <span class="function">createStore</span>({
  <span class="property">count</span>: <span class="number">0</span>,
  <span class="property">profile</span>,
  <span class="property">reports</span>,
})`,
  values: `<span class="keyword">import</span> { <span class="imported">store</span> } <span class="keyword">from</span> <span class="string">'reboil'</span>
<span class="keyword">import</span> { <span class="imported">setStore</span> } <span class="keyword">from</span> <span class="string">'reboil/react'</span>

<span class="comment">// Read the current value from any function.</span>
<span class="keyword">const</span> <span class="variable">currentCount</span> = <span class="variable">store</span>.<span class="function">get</span>(<span class="string">'count'</span>)

<span class="function">setStore</span>(<span class="string">'count'</span>, value =&gt; value + <span class="number">1</span>)
<span class="variable">store</span>.<span class="function">set</span>(<span class="string">'count'</span>, value =&gt; value + <span class="number">5</span>)`,
  subscription: `<span class="keyword">const</span> <span class="variable">unsubscribe</span> = <span class="variable">store</span>.<span class="function">subscribe</span>(
  <span class="string">'settings.runTimeVersion'</span>,
  (value, previous) =&gt; {
    console.<span class="function">log</span>(previous, <span class="string">'→'</span>, value)
  },
)

<span class="keyword">const</span> <span class="variable">settings</span> = <span class="variable">store</span>.<span class="function">get</span>(<span class="string">'settings'</span>)
<span class="variable">store</span>.<span class="function">set</span>(<span class="string">'settings'</span>, {
  ...settings,
  <span class="property">runTimeVersion</span>: <span class="string">'2.0.0'</span>,
})

<span class="function">unsubscribe</span>()`,
  reset: `<span class="comment">// Reset one value and return its default.</span>
<span class="variable">store</span>.<span class="function">reset</span>(<span class="string">'count'</span>)

<span class="comment">// Reset every loaded store partition.</span>
<span class="variable">store</span>.<span class="function">reset</span>()`,
  persistence: `<span class="function">createStore</span>(initialState, {
  <span class="property">id</span>: <span class="string">'reboil-use-cases-lab'</span>,
  <span class="property">persist</span>: {
    <span class="comment">// It stays reactive in memory but is not saved.</span>
    <span class="property">exclude</span>: [<span class="string">'session.lastChecked'</span>],
  },
})`,
  splitting: `<span class="comment">// React: the hook suspends at the lazy boundary.</span>
&lt;<span class="tag">Suspense</span> <span class="attribute">fallback</span>={&lt;<span class="tag">Loading</span> /&gt;}&gt;
  &lt;<span class="tag">ReportsPanel</span> /&gt;
&lt;/<span class="tag">Suspense</span>&gt;

<span class="comment">// Vanilla: load before the first synchronous read.</span>
<span class="keyword">await</span> <span class="variable">store</span>.<span class="function">load</span>(<span class="string">'reports'</span>)
<span class="keyword">const</span> <span class="variable">visits</span> = <span class="variable">store</span>.<span class="function">get</span>(<span class="string">'reports.visits'</span>)`,
}

function CodeToggle({
  section,
  openSection,
  onToggle,
}: {
  section: CodeSection
  openSection: CodeSection | null
  onToggle: (section: CodeSection) => void
}) {
  const isOpen = openSection === section
  const label = `${isOpen ? 'Hide' : 'View'} code`

  return (
    <button
      type="button"
      className={`code-toggle${isOpen ? ' is-open' : ''}`}
      aria-label={label}
      aria-expanded={isOpen}
      title={label}
      onClick={() => onToggle(section)}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="m8 9-3 3 3 3M16 9l3 3-3 3M14 5l-4 14" />
      </svg>
    </button>
  )
}

function CodeSnippet({ section, openSection }: { section: CodeSection; openSection: CodeSection | null }) {
  if (openSection !== section) return null

  return (
    <div className="code-snippet" aria-label={`${section} example code`}>
      <div className="snippet-bar">
        <span className="snippet-dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span>example.ts</span>
      </div>
      <pre>
        <code dangerouslySetInnerHTML={{ __html: codeSnippets[section] }} />
      </pre>
    </div>
  )
}

function ReportsPanel() {
  const visits = useStore('reports.visits')
  const status = useStore('reports.status')

  return (
    <div className="report-result" data-testid="reports-result">
      <span className="report-dot" aria-hidden="true" />
      <div>
        <strong>{visits} visits</strong>
        <span>Lazy store loaded · {status}</span>
      </div>
    </div>
  )
}

function StateInspector() {
  const count = useStore('count')
  const runTimeVersion = useStore('settings.runTimeVersion')
  const theme = useStore('settings.theme')
  const lastChecked = useStore('session.lastChecked')
  const displayName = useStore('profile.displayName')
  const plan = useStore('profile.plan')

  return (
    <>
      <div className="inspector-runtime" data-testid="runtime-value">
        <span>runTimeVersion</span>
        <strong>{runTimeVersion}</strong>
      </div>
      <pre className="state-json" data-testid="state-inspector">
        {JSON.stringify(
          {
            count,
            settings: { runTimeVersion, theme },
            session: { lastChecked },
            profile: { displayName, plan },
            reports: 'lazy (load on demand)',
          },
          null,
          2,
        )}
      </pre>
    </>
  )
}

function App() {
  const count = useStore('count')
  const runTimeVersion = useStore('settings.runTimeVersion')
  const lastChecked = useStore('session.lastChecked')
  const subscriptionNumber = useRef(0)
  const [lastRead, setLastRead] = useState('—')
  const [events, setEvents] = useState<EventLog>({ count: 0, runtime: 0, latest: 'Waiting for a state change' })
  const [showReports, setShowReports] = useState(false)
  const [vanillaStatus, setVanillaStatus] = useState('Not loaded')
  const [openCode, setOpenCode] = useState<CodeSection | null>(null)

  useEffect(() => {
    const stopCount = store.subscribe('count', (next, previous) => {
      subscriptionNumber.current += 1
      setEvents((current) => ({
        ...current,
        count: current.count + 1,
        latest: `#${subscriptionNumber.current} count: ${previous} → ${next}`,
      }))
    })
    const stopRuntime = store.subscribe('settings.runTimeVersion', (next, previous) => {
      subscriptionNumber.current += 1
      setEvents((current) => ({
        ...current,
        runtime: current.runtime + 1,
        latest: `#${subscriptionNumber.current} runtime: ${previous} → ${next}`,
      }))
    })
    return () => {
      stopCount()
      stopRuntime()
    }
  }, [])

  function readMostRecentValue() {
    // This is deliberately outside React state: it proves store.get reads the current value synchronously.
    setLastRead(String(store.get('count')))
  }

  function setWithStore() {
    store.set('count', (previous) => previous + 5)
  }

  function updateParentWithNewRuntime() {
    const settings = store.get('settings')
    const nextVersion = settings.runTimeVersion === '1.0.0' ? '2.0.0' : '1.0.0'
    store.set('settings', { ...settings, runTimeVersion: nextVersion })
  }

  function updateParentWithSameRuntime() {
    const settings = store.get('settings')
    store.set('settings', {
      ...settings,
      theme: settings.theme === 'midnight' ? 'daylight' : 'midnight',
    })
  }

  async function preloadWithVanillaApi() {
    setVanillaStatus('Loading…')
    await store.load('reports')
    setVanillaStatus(`Loaded — ${store.get('reports.visits')} visits read with store.get()`)
  }

  function setTransientValue() {
    setStore('session.lastChecked', `Checked at count ${store.get('count')}`)
  }

  function toggleCode(section: CodeSection) {
    setOpenCode((current) => (current === section ? null : section))
  }

  return (
    <main className="app-shell">
      <section className="lab-grid">
        <div className="controls-column">
          <section className="lab-card" aria-labelledby="create-title">
            <div className="card-heading">
              <span className="card-number">01</span>
              <div>
                <p className="section-kicker">Creating stores</p>
                <h2 id="create-title">Simple, nested, lazy</h2>
              </div>
              <CodeToggle section="create" openSection={openCode} onToggle={toggleCode} />
            </div>
            <div className="creation-list">
              <div>
                <span className="check">✓</span>
                <span>
                  <strong>Simple</strong> <code>count</code> starts at 0
                </span>
              </div>
              <div>
                <span className="check">✓</span>
                <span>
                  <strong>Nested</strong> <code>profile.displayName</code> is composed from a child store
                </span>
              </div>
              <div>
                <span className="check lazy-check">↗</span>
                <span>
                  <strong>Lazy</strong> <code>reports</code> imports only when requested
                </span>
              </div>
            </div>
            <CodeSnippet section="create" openSection={openCode} />
          </section>

          <section className="lab-card" aria-labelledby="value-title">
            <div className="card-heading">
              <span className="card-number">02</span>
              <div>
                <p className="section-kicker">Getting & setting value</p>
                <h2 id="value-title">Current value, two write APIs</h2>
              </div>
              <CodeToggle section="values" openSection={openCode} onToggle={toggleCode} />
            </div>
            <div className="metric-row">
              <div>
                <span>count</span>
                <strong data-testid="count-value">{count}</strong>
              </div>
              <div>
                <span>function read</span>
                <strong data-testid="function-read">{lastRead}</strong>
              </div>
            </div>
            <div className="button-row">
              <button
                type="button"
                className="button button-primary"
                data-testid="set-store"
                onClick={() => setStore('count', (value) => value + 1)}
              >
                setStore +1
              </button>
              <button type="button" className="button" data-testid="store-set" onClick={setWithStore}>
                store.set +5
              </button>
              <button
                type="button"
                className="button button-quiet"
                data-testid="read-current"
                onClick={readMostRecentValue}
              >
                Read current value
              </button>
            </div>
            <CodeSnippet section="values" openSection={openCode} />
          </section>

          <section className="lab-card" aria-labelledby="subscription-title">
            <div className="card-heading">
              <span className="card-number">03</span>
              <div>
                <p className="section-kicker">Imperative subscription</p>
                <h2 id="subscription-title">Subscribe to a leaf, update its parent</h2>
              </div>
              <CodeToggle section="subscription" openSection={openCode} onToggle={toggleCode} />
            </div>
            <p className="card-copy">
              The app subscribes to <code>settings.runTimeVersion</code>. Changing the parent object should only notify
              that listener when its selected leaf changes.
            </p>
            <div className="button-row">
              <button
                type="button"
                className="button button-primary"
                data-testid="parent-runtime-change"
                onClick={updateParentWithNewRuntime}
              >
                Update parent + version
              </button>
              <button
                type="button"
                className="button"
                data-testid="parent-same-runtime"
                onClick={updateParentWithSameRuntime}
              >
                Update parent, same version
              </button>
            </div>
            <div className="event-grid" aria-live="polite">
              <div>
                <span>count events</span>
                <strong data-testid="count-events">{events.count}</strong>
              </div>
              <div>
                <span>runtime events</span>
                <strong data-testid="runtime-events">{events.runtime}</strong>
              </div>
              <p data-testid="latest-event">{events.latest}</p>
            </div>
            <CodeSnippet section="subscription" openSection={openCode} />
          </section>

          <section className="lab-card two-up" aria-label="Reset and persistence controls">
            <div className="two-up-content">
              <div className="subsection">
                <div className="subsection-heading">
                  <p className="section-kicker">Reset</p>
                  <CodeToggle section="reset" openSection={openCode} onToggle={toggleCode} />
                </div>
                <h2>Restore defaults</h2>
                <p className="card-copy">Reset one path or reset the complete loaded store tree.</p>
                <div className="button-row">
                  <button
                    type="button"
                    className="button"
                    data-testid="reset-count"
                    onClick={() => store.reset('count')}
                  >
                    Reset count
                  </button>
                  <button
                    type="button"
                    className="button button-danger"
                    data-testid="reset-all"
                    onClick={() => store.reset()}
                  >
                    Reset all
                  </button>
                </div>
              </div>
              <div className="persistence-box subsection">
                <div className="subsection-heading">
                  <p className="section-kicker">Persistence exclusion</p>
                  <CodeToggle section="persistence" openSection={openCode} onToggle={toggleCode} />
                </div>
                <h2>Session-only field</h2>
                <p className="card-copy">
                  <code>session.lastChecked</code> is reactive but excluded from localStorage.
                </p>
                <strong className="transient-value" data-testid="transient-value">
                  {lastChecked}
                </strong>
                <button type="button" className="button" data-testid="set-transient" onClick={setTransientValue}>
                  Set transient value
                </button>
              </div>
            </div>
            <CodeSnippet section="reset" openSection={openCode} />
            <CodeSnippet section="persistence" openSection={openCode} />
          </section>

          <section className="lab-card" aria-labelledby="lazy-title">
            <div className="card-heading">
              <span className="card-number">04</span>
              <div>
                <p className="section-kicker">Code splitting</p>
                <h2 id="lazy-title">Suspense or vanilla preload</h2>
              </div>
              <CodeToggle section="splitting" openSection={openCode} onToggle={toggleCode} />
            </div>
            <div className="split-layout">
              <div>
                <p className="card-copy">
                  A React read crosses the lazy boundary and suspends while the feature module arrives.
                </p>
                <button
                  type="button"
                  className="button button-primary"
                  data-testid="show-suspense"
                  onClick={() => setShowReports(true)}
                >
                  Open with Suspense
                </button>
                {showReports ? (
                  <Suspense
                    fallback={
                      <div className="loading-report" data-testid="suspense-fallback">
                        Loading reports store…
                      </div>
                    }
                  >
                    <ReportsPanel />
                  </Suspense>
                ) : null}
              </div>
              <div className="vanilla-pane">
                <p className="card-copy">Vanilla code loads before its first synchronous read.</p>
                <button type="button" className="button" data-testid="vanilla-load" onClick={preloadWithVanillaApi}>
                  store.load('reports')
                </button>
                <p className="vanilla-status" data-testid="vanilla-status">
                  {vanillaStatus}
                </p>
              </div>
            </div>
            <CodeSnippet section="splitting" openSection={openCode} />
          </section>
        </div>

        <aside className="inspector" aria-label="Live state inspector">
          <div className="inspector-heading">
            <div>
              <p className="section-kicker">Live snapshot</p>
              <h2>State inspector</h2>
            </div>
            <span className="live-label">
              <i /> LIVE
            </span>
          </div>
          <StateInspector />
          <div className="inspector-note">
            <strong>Automated too.</strong>
            <p>
              Run <code>npm run test:e2e --workspace reboil-parcel-use-cases-app</code> to exercise each behavior in
              Cypress.
            </p>
          </div>
        </aside>
      </section>
    </main>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
