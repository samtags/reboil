import { createStore } from 'reboil'
import './styles.css'

const { store } = createStore({
  count: 1,
}, {
  id: 'reboil-vanilla-app',
  logger: true,
})

const countElement = document.querySelector('#count')
const lastChangeElement = document.querySelector('#last-change')
const incrementButton = document.querySelector('#increment')
const resetButton = document.querySelector('#reset')
const codeElement = document.querySelector('#code-example')
const codeFilename = document.querySelector('#code-filename')
const languageSelect = document.querySelector('#language')
const copyButton = document.querySelector('#copy-code')

function renderCode(language) {
  const template = document.querySelector(`#${language}-example`)
  codeElement.replaceChildren(template.content.cloneNode(true))
  codeFilename.textContent = `src/main.${language === 'javascript' ? 'jsx' : 'tsx'}`
}

function activeCode() {
  return codeElement.textContent.trim()
}

async function copyCode() {
  const text = activeCode()

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
    } else {
      const temporaryInput = document.createElement('textarea')
      temporaryInput.value = text
      temporaryInput.style.position = 'fixed'
      temporaryInput.style.opacity = '0'
      document.body.appendChild(temporaryInput)
      temporaryInput.select()
      document.execCommand('copy')
      temporaryInput.remove()
    }

    copyButton.setAttribute('aria-label', 'Copied')
    copyButton.title = 'Copied'
    copyButton.classList.add('copied')
    window.setTimeout(() => {
      copyButton.setAttribute('aria-label', 'Copy code')
      copyButton.title = 'Copy code'
      copyButton.classList.remove('copied')
    }, 1400)
  } catch (error) {
    console.error('Could not copy code', error)
  }
}

function renderCount(value) {
  countElement.textContent = String(value)
}

renderCount(store.get('count'))
renderCode(languageSelect.value)

const unsubscribe = store.subscribe('count', (value, lastValue) => {
  renderCount(value)
  lastChangeElement.textContent = `${lastValue} → ${value}`
  console.log('count changed', { value, lastValue })
})

incrementButton.addEventListener('click', () => {
  store.set('count', (value) => value + 1)
})

resetButton.addEventListener('click', () => {
  store.reset('count')
})

languageSelect.addEventListener('change', () => {
  renderCode(languageSelect.value)
})

copyButton.addEventListener('click', copyCode)

window.addEventListener('beforeunload', unsubscribe, { once: true })
