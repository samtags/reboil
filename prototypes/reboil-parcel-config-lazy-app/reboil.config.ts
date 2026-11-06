import { createStore, defineConfig } from 'reboil'
import { state } from './src/state'

export const app = createStore(state, {
  id: 'reboil-config-lazy-example',
  persist: {
    exclude: ['settings.showCounterWindow'],
  },
})

export default defineConfig({
  stateFile: './src/state.ts',
})

declare module 'reboil' {
  interface Register {
    bindings: typeof app
  }
}
