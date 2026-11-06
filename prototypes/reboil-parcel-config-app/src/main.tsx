import '../reboil.config'
import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { store } from 'reboil'
import { setStore, useStore } from 'reboil/react'
import './styles.css'

type Language = 'javascript' | 'typescript'

const codeExamples = {
  javascript: {
    source: `import { setStore, useStore } from 'reboil/react'

function Counter() {
  const count = useStore('count')

  return (
    <button onClick={() => setStore('count', value => value + 1)}>
      {count}
    </button>
  )
}`,
    markup: `<span class="keyword">import</span> { <span class="imported">setStore</span>, <span class="imported">useStore</span> } <span class="keyword">from</span> <span class="string">'reboil/react'</span>

<span class="keyword">function</span> <span class="function">Counter</span>() {
  <span class="keyword">const</span> <span class="variable">count</span> = <span class="function">useStore</span>(<span class="string">'count'</span>)

  <span class="keyword">return</span> (
    &lt;<span class="tag">button</span> <span class="attribute">onClick</span>={() =&gt; <span class="function">setStore</span>(<span class="string">'count'</span>, value =&gt; value + <span class="number">1</span>)}&gt;
      {<span class="variable">count</span>}
    &lt;/<span class="tag">button</span>&gt;
  )
}`,
  },
  typescript: {
    source: `import { store } from 'reboil'
import { useStore } from 'reboil/react'

function Counter() {
  const count = useStore('count')

  return (
    <button onClick={() => store.set('count', value => value + 1)}>
      {count}
    </button>
  )
}`,
    markup: `<span class="keyword">import</span> { <span class="imported">store</span> } <span class="keyword">from</span> <span class="string">'reboil'</span>
<span class="keyword">import</span> { <span class="imported">useStore</span> } <span class="keyword">from</span> <span class="string">'reboil/react'</span>

<span class="keyword">function</span> <span class="function">Counter</span>() {
  <span class="keyword">const</span> <span class="variable">count</span> = <span class="function">useStore</span>(<span class="string">'count'</span>)

  <span class="keyword">return</span> (
    &lt;<span class="tag">button</span> <span class="attribute">onClick</span>={() =&gt; <span class="variable">store</span>.<span class="function">set</span>(<span class="string">'count'</span>, value =&gt; value + <span class="number">1</span>)}&gt;
      {<span class="variable">count</span>}
    &lt;/<span class="tag">button</span>&gt;
  )
}`,
  },
} satisfies Record<Language, { source: string; markup: string }>

function CodeWindow() {
  const [language, setLanguage] = useState<Language>('typescript')
  const [copied, setCopied] = useState(false)
  const example = codeExamples[language]
  const filename = `src/main.${language === 'javascript' ? 'jsx' : 'tsx'}`

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(example.source)
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
          <span>{filename}</span>
        </div>
        <pre>
          <code dangerouslySetInnerHTML={{ __html: example.markup }} />
        </pre>
      </div>
      <div className="code-controls">
        <label className="sr-only" htmlFor="language">
          Code language
        </label>
        <select id="language" value={language} onChange={(event) => setLanguage(event.target.value as Language)}>
          <option value="javascript">JavaScript</option>
          <option value="typescript">TypeScript</option>
        </select>
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

function CounterCard() {
  const count = useStore('count')
  const lastAction = useStore('lastAction')

  function increment() {
    const previous = store.get('count')
    const value = setStore('count', previous + 1)
    setStore('lastAction', `${previous} → ${value}`)
  }

  function reset() {
    const previous = store.get('count')
    const value = store.reset('count')
    if (previous !== value) setStore('lastAction', `${previous} → ${value}`)
  }

  return (
    <aside className="counter-card" aria-label="Live counter">
      <div className="counter-heading">
        <span className="counter-label">count</span>
        <span className="counter-note" aria-live="polite">
          {lastAction}
        </span>
      </div>
      <strong>{count}</strong>
      <button type="button" onClick={increment}>
        one up
      </button>
      <button className="reset-link" type="button" onClick={reset}>
        reset
      </button>
    </aside>
  )
}

function App() {
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
        <section className="demo" aria-label="Reboil config registration code example">
          <CodeWindow />
          <CounterCard />
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
