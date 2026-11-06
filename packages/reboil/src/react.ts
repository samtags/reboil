import { setStore as setRegisteredStore, useStore as useRegisteredStore } from './config'

/**
 * Selects one typed path from the config-registered store in a React component.
 * The component rerenders only when that selected value changes.
 *
 * ```tsx
 * import { useStore } from 'reboil/react'
 *
 * function Counter() {
 *   const count = useStore('count')
 *   return <p>{count}</p>
 * }
 * ```
 */
export const useStore: typeof useRegisteredStore = useRegisteredStore

/**
 * Writes through the same config-registered runtime as `useStore`.
 *
 * ```tsx
 * setStore('count', (count) => count + 1)
 * ```
 */
export const setStore: typeof setRegisteredStore = setRegisteredStore
