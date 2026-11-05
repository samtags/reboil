export class ReboilError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message)
    if (options && 'cause' in options) (this as Error & { cause?: unknown }).cause = options.cause
    this.name = 'ReboilError'
  }
}

export class ReboilPathError extends ReboilError {
  constructor(path: string, segment: string) {
    super(`Path segment "${segment}" was not found while reading "${path}"`)
    this.name = 'ReboilPathError'
  }
}

export class ReboilStoreNotLoadedError extends ReboilError {
  constructor(path: string) {
    super(`Lazy Reboil store "${path}" is not loaded. Call await store.load("${path}") before synchronous access.`)
    this.name = 'ReboilStoreNotLoadedError'
  }
}
