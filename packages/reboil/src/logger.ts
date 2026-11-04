import type { MutationEvent, MutationLogger, StateShape } from './types'

export function isProduction(): boolean {
  return typeof process !== 'undefined' && process.env.NODE_ENV === 'production'
}

export function resolveLogger<State extends StateShape>(
  option: boolean | MutationLogger<State> | undefined,
): MutationLogger<State> | null {
  if (option === false) return null
  if (typeof option === 'function') return option
  if (option === true || option === undefined) return isProduction() ? null : defaultLogger
  return null
}

function defaultLogger<State extends StateShape>(event: MutationEvent<State>): void {
  if (typeof console === 'undefined') return
  const title = event.kind === 'mutation'
    ? `[reboil] ${event.operation} ${event.path ?? '<store>'}`
    : `[reboil] rejected ${event.operation} ${event.path ?? '<store>'}`

  const group = console.groupCollapsed ?? console.group
  if (group) group.call(console, title)
  if (event.kind === 'mutation') {
    console.log('previous state', event.previousState)
    console.log('action', event.action)
    console.log('next state', event.nextState)
    console.log('changed', event.changed)
  } else {
    console.log('current state', event.currentState)
    console.log('action', event.action)
    console.error('error', event.error)
  }
  if (console.groupEnd) console.groupEnd()
}

export function emitLog<State extends StateShape>(logger: MutationLogger<State> | null, event: MutationEvent<State>): void {
  if (!logger) return
  try {
    logger(event)
  } catch (error) {
    if (!isProduction()) console.warn('[reboil] custom logger failed', error)
  }
}

