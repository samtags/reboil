import { createStore } from 'reboil'

const initialState = {
  count: 0,
  lastAction: 'Ready',
  settings: {
    theme: 'light' as 'light' | 'dark',
  },
}

export const { store, useStore } = createStore(initialState, {
  id: 'reboil-parcel-app',
  logger: true,
})

