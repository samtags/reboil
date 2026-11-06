'use client'

import { createStore, defineConfig } from 'reboil'
import { initialState } from './src/state'

createStore(initialState)

export default defineConfig({
  stateFile: './src/state.ts',
})

declare module 'reboil' {
  interface Register {
    state: typeof initialState
  }
}
