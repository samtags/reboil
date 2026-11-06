import { createStore } from '@reboil/store'

const initialState = {
  count: 1,
  lastAction: '',
}

export const { store, useStore } = createStore(initialState, {
  logger: true,
})
