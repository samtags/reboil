import { createStore } from 'reboil'

// This module is emitted as its own Parcel bundle and is only fetched on demand.
export default createStore({
  visits: 12,
  status: 'ready',
})
