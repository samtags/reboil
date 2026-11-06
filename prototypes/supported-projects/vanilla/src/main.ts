import '../reboil.config'
import { store } from 'reboil'
import './styles.css'

const count = document.querySelector<HTMLParagraphElement>('#count')!
const decrement = document.querySelector<HTMLButtonElement>('#decrement')!
const increment = document.querySelector<HTMLButtonElement>('#increment')!
const reset = document.querySelector<HTMLButtonElement>('#reset')!

function render(value: number) {
  count.textContent = `Count: ${value}`
}

render(store.get('count'))
store.subscribe('count', render)
decrement.addEventListener('click', () => store.set('count', (value) => value - 1))
increment.addEventListener('click', () => store.set('count', (value) => value + 1))
reset.addEventListener('click', () => store.set('count', 0))
