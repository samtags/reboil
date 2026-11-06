import "../reboil.config";
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Counter } from './Counter'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Counter />
  </StrictMode>,
)
