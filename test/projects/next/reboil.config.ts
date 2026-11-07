'use client'

import { createStore, defineConfig } from '@reboil/store'
import { initialState } from './src/state'

createStore(initialState)

export default defineConfig({
  stateFile: './src/state.ts',
})

declare module '@reboil/store' {
  interface Register {
    state: typeof initialState
  }
}
