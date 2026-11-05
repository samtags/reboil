export type JsonPrimitive = string | number | boolean | null

export type JsonValue = JsonPrimitive | JsonObject | JsonValue[]

export type JsonObject = { [key: string]: JsonValue }

export type StateShape = JsonObject

type StringKey<T> = Extract<keyof T, string>
type IsTuple<T extends readonly unknown[]> = number extends T['length'] ? false : true
type TupleKey<T extends readonly unknown[]> = Exclude<keyof T, keyof unknown[]> & string

type ChildPaths<T> = T extends readonly unknown[]
  ? IsTuple<T> extends true
    ? {
        [K in TupleKey<T>]: K | (T[K & keyof T] extends object ? `${K}.${Paths<T[K & keyof T]>}` : never)
      }[TupleKey<T>]
    : `${number}` | (T[number] extends object ? `${number}.${Paths<T[number]>}` : never)
  : T extends object
    ? {
        [K in StringKey<T>]: K | (T[K] extends object ? `${K}.${Paths<T[K]>}` : never)
      }[StringKey<T>]
    : never

type Paths<T> = T extends object ? ChildPaths<T> : never

export type Path<State extends StateShape> = Paths<State>

type ArrayValue<T, Segment extends string> = Segment extends `${number}`
  ? T extends readonly (infer Item)[]
    ? Item
    : never
  : never

export type PathValue<State, SelectedPath extends string> = SelectedPath extends `${infer Head}.${infer Tail}`
  ? Head extends keyof State
    ? PathValue<State[Head], Tail>
    : ArrayValue<State, Head> extends never
      ? never
      : PathValue<ArrayValue<State, Head>, Tail>
  : SelectedPath extends keyof State
    ? State[SelectedPath]
    : ArrayValue<State, SelectedPath>

export type PathUpdater<Value> = Value | ((previous: Value) => Value)

export type StoreSubscriber<Value> = (value: Value, lastValue: Value) => void

export interface PersistOptions<State extends StateShape> {
  exclude?: Path<State>[]
}

export interface MutationEvent<State extends StateShape> {
  kind: 'mutation' | 'rejected'
  operation: 'set' | 'reset'
  path?: string
  previousState?: State
  currentState?: State
  action?: {
    path?: string
    value?: unknown
    updater?: boolean
  }
  nextState?: State
  changed?: boolean
  error?: Error
}

export type MutationLogger<State extends StateShape> = (event: MutationEvent<State>) => void

export interface StoreOptions<State extends StateShape> {
  id?: string
  version?: number
  persist?: PersistOptions<State>
  migrate?: (persisted: unknown, fromVersion: number) => State
  logger?: boolean | MutationLogger<State>
}

export interface Store<State extends StateShape> {
  get<PathName extends Path<State>>(path: PathName): PathValue<State, PathName>
  set<PathName extends Path<State>>(
    path: PathName,
    value: PathUpdater<PathValue<State, PathName>>,
  ): PathValue<State, PathName>
  subscribe<PathName extends Path<State>>(
    path: PathName,
    listener: StoreSubscriber<PathValue<State, PathName>>,
  ): () => void
  reset<PathName extends Path<State>>(path: PathName): PathValue<State, PathName>
  reset(): State
}
