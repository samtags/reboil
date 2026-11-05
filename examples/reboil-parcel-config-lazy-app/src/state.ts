import { lazy } from 'reboil'

export const state = {
  settings: {
    showCounterWindow: false,
  },
  // The counter state and defaults are emitted in a separate bundle.
  window: lazy(() => import('./window-state')),
}
