import { createStore, defineConfig, lazy } from 'reboil'

const profile = createStore({
  displayName: 'Avery',
  plan: 'Team',
})

const reports = lazy(
  () => new Promise<void>((resolve) => window.setTimeout(resolve, 350)).then(() => import('./src/reports-state')),
)

export const app = createStore(
  {
    count: 0,
    settings: {
      runTimeVersion: '1.0.0',
      theme: 'midnight',
    },
    session: {
      lastChecked: 'Not checked',
    },
    profile,
    reports,
  },
  {
    id: 'reboil-use-cases-lab',
    persist: {
      // This value is intentionally retained only for the current browser session.
      exclude: ['session.lastChecked'],
    },
  },
)

export default defineConfig({
  stateFile: './src/state.ts',
})

declare module 'reboil' {
  interface Register {
    bindings: typeof app
  }
}
