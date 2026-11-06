import type { ReactNode } from 'react'
import { useState } from 'react'
import { createStore } from 'reboil'
import Layout from '@theme/Layout'
import Heading from '@theme/Heading'
import styles from './index.module.css'

type Language = 'javascript' | 'tsx'

type HomeState = {
  count: number
  lastAction: string
}

const { store: homeStore, useStore: useHomeStore } = createStore<HomeState>(
  {
    count: 1,
    lastAction: '3 → 1',
  },
  { id: 'reboil-docs-home' },
)

const codeExamples: Record<Language, { source: string; markup: string }> = {
  javascript: {
    source: `import { store } from 'reboil'

const count = document.querySelector('#count')
const increment = document.querySelector('#increment')

store.subscribe('count', (value, lastValue) => {
  count.textContent = value
})

increment.onclick = () => {
  store.set('count', value => value + 1)
}`,
    markup: `<span class="keyword">import</span> { <span class="imported">store</span> } <span class="keyword">from</span> <span class="string">'reboil'</span>

<span class="keyword">const</span> <span class="variable">count</span> = document.<span class="function">querySelector</span>(<span class="string">'#count'</span>)
<span class="keyword">const</span> <span class="variable">increment</span> = document.<span class="function">querySelector</span>(<span class="string">'#increment'</span>)

<span class="variable">store</span>.<span class="function">subscribe</span>(<span class="string">'count'</span>, (<span class="variable">value</span>, <span class="variable">lastValue</span>) =&gt; {
  <span class="variable">count</span>.textContent = <span class="variable">value</span>
})

<span class="variable">increment</span>.<span class="property">onclick</span> = () =&gt; {
  <span class="variable">store</span>.<span class="function">set</span>(<span class="string">'count'</span>, value =&gt; value + <span class="number">1</span>)
}`,
  },
  tsx: {
    source: `// state.ts
import { createStore } from 'reboil'

createStore({
  count: 1,
})

// main.tsx
import { setStore, useStore } from 'reboil/react'

function Counter() {
  const count = useStore('count')

  return (
    <button onClick={() => setStore('count', value => value + 1)}>
      {count}
    </button>
  )
}`,
    markup: `<span class="comment">// state.ts</span>
<span class="keyword">import</span> { <span class="imported">createStore</span> } <span class="keyword">from</span> <span class="string">'reboil'</span>

<span class="function">createStore</span>({
  <span class="property">count</span>: <span class="number">1</span>,
})

<span class="comment">// main.tsx</span>
<span class="keyword">import</span> { <span class="imported">setStore</span>, <span class="imported">useStore</span> } <span class="keyword">from</span> <span class="string">'reboil/react'</span>

<span class="keyword">function</span> <span class="function">Counter</span>() {
  <span class="keyword">const</span> <span class="variable">count</span> = <span class="function">useStore</span>(<span class="string">'count'</span>)

  <span class="keyword">return</span> (
    &lt;<span class="tag">button</span> <span class="attribute">onClick</span>={() =&gt; <span class="function">setStore</span>(<span class="string">'count'</span>, value =&gt; value + <span class="number">1</span>)}&gt;
      {<span class="variable">count</span>}
    &lt;/<span class="tag">button</span>&gt;
  )
}`,
  },
}

function CodeWindow(): ReactNode {
  const [language, setLanguage] = useState<Language>('tsx')
  const [copied, setCopied] = useState(false)
  const example = codeExamples[language]
  const filename = `src/main.${language}`

  async function copyCode() {
    await navigator.clipboard.writeText(example.source)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1400)
  }

  return (
    <>
      <div className={styles.codeWindow}>
        <div className={styles.windowBar}>
          <div className={styles.windowDots} aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
          <span>{filename}</span>
        </div>
        <pre className={styles.codeBody}>
          <code dangerouslySetInnerHTML={{ __html: example.markup }} />
        </pre>
      </div>
      <div className={styles.codeControls}>
        <label className="sr-only" htmlFor="language">
          Code language
        </label>
        <select id="language" value={language} onChange={(event) => setLanguage(event.target.value as Language)}>
          <option value="javascript">JavaScript</option>
          <option value="tsx">TSX</option>
        </select>
        <button
          className={`${styles.copyButton} ${copied ? styles.copied : ''}`}
          type="button"
          aria-label="Copy code"
          onClick={copyCode}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="8" y="8" width="11" height="11" rx="2" />
            <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
          </svg>
        </button>
      </div>
    </>
  )
}

function CounterCard(): ReactNode {
  const count = useHomeStore('count')
  const lastAction = useHomeStore('lastAction')

  function increment() {
    const previous = homeStore.get('count')
    const next = homeStore.set('count', (value) => value + 1)
    homeStore.set('lastAction', `${previous} → ${next}`)
  }

  function reset() {
    const previous = homeStore.get('count')
    const next = homeStore.reset('count')
    if (previous !== next) homeStore.set('lastAction', `${previous} → ${next}`)
  }

  return (
    <aside className={styles.counterCard} aria-label="Live counter">
      <div className={styles.counterHeading}>
        <span className={styles.counterLabel}>count</span>
        <span className={styles.counterNote} aria-live="polite">
          {lastAction}
        </span>
      </div>
      <strong>{count}</strong>
      <button type="button" onClick={increment}>
        one up
      </button>
      <button className={styles.resetLink} type="button" onClick={reset}>
        reset
      </button>
    </aside>
  )
}

export default function Home(): ReactNode {
  return (
    <Layout
      title="Typed synchronous state"
      description="Small, fast, and scalable string-path state access for web and React Native, with zero boilerplate, code splitting, and synchronous persistence out of the box"
    >
      <main>
        <section className={styles.hero}>
          <div className="container">
            <div className={styles.heroIntro}>
              <Heading as="h1">State Simplified</Heading>
              <p>
                Small, fast, and scalable string-path state access for web and React Native, with zero boilerplate, code
                splitting, and synchronous persistence out of the box. Inspired by Recoil’s principles, Redux’s
                observability and scalability, and Zustand’s simplicity.
              </p>
              <p>The core store API is framework agnostic. React bindings are available as an optional integration.</p>
            </div>
            <div className={styles.demo} aria-label="Reboil config registration code example">
              <CodeWindow />
              <CounterCard />
            </div>
          </div>
        </section>
      </main>
    </Layout>
  )
}
