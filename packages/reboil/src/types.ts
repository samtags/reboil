export type JsonPrimitive = string | number | boolean | null

export type JsonValue = JsonPrimitive | JsonObject | JsonValue[]

export type JsonObject = { [key: string]: JsonValue }

export type StateShape = JsonObject

export declare const storeStateType: unique symbol
export declare const storePathType: unique symbol
export declare const lazyPathType: unique symbol

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

export interface Store<
  State extends StateShape,
  ValidPath extends string = Path<State>,
  LoadPath extends string = never,
> {
  get<PathName extends ValidPath>(path: PathName): PathValue<State, PathName>
  set<PathName extends ValidPath>(
    path: PathName,
    value: PathUpdater<PathValue<State, PathName>>,
  ): PathValue<State, PathName>
  subscribe<PathName extends ValidPath>(
    path: PathName,
    listener: StoreSubscriber<PathValue<State, PathName>>,
  ): () => void
  reset<PathName extends ValidPath>(path: PathName): PathValue<State, PathName>
  reset(): void
  load(path: LoadPath): Promise<void>
}

export interface StoreBindings<
  State extends StateShape,
  ValidPath extends string = Path<State>,
  LoadPath extends string = never,
> {
  readonly [storeStateType]: State
  readonly [storePathType]: ValidPath
  readonly [lazyPathType]: LoadPath
  store: Store<State, ValidPath, LoadPath>
  useStore<PathName extends ValidPath>(path: PathName): PathValue<State, PathName>
}

export interface LazyStore<
  State extends StateShape,
  ValidPath extends string = Path<State>,
  LoadPath extends string = never,
> extends StoreBindings<State, ValidPath, LoadPath> {
  load(): Promise<void>
}

export interface StoreTypeMarker {
  readonly [storeStateType]: StateShape
  readonly [storePathType]: string
  readonly [lazyPathType]: string
}

export type StateOf<Value> = Value extends { readonly [storeStateType]: infer State extends StateShape } ? State : never
export type StorePathsOf<Value> = Value extends { readonly [storePathType]: infer ValidPath extends string }
  ? ValidPath
  : never
export type LazyPathsOf<Value> = Value extends { readonly [lazyPathType]: infer LoadPath extends string }
  ? LoadPath
  : never

export type ResolveState<Value> = Value extends { readonly [storeStateType]: infer State extends StateShape }
  ? State
  : Value extends readonly unknown[]
    ? Value
    : Value extends object
      ? { [Key in keyof Value]: ResolveState<Value[Key]> }
      : Value

export type ResolvedState<Definition extends Record<string, unknown>> = ResolveState<Definition> & StateShape

type DefinitionValuePaths<Key extends string, Value> = Value extends {
  readonly [storePathType]: infer ValidPath extends string
}
  ? `${Key}.${ValidPath}`
  : Value extends object
    ? Key | `${Key}.${Paths<Value>}`
    : Key

export type DefinitionPaths<Definition extends Record<string, unknown>> = {
  [Key in StringKey<Definition>]: DefinitionValuePaths<Key, Definition[Key]>
}[StringKey<Definition>]

type ChildLazyPaths<Key extends string, Value> = Value extends {
  readonly [lazyPathType]: infer NestedLoadPath extends string
  load(): Promise<void>
}
  ? Key | (NestedLoadPath extends string ? `${Key}.${NestedLoadPath}` : never)
  : Value extends { readonly [lazyPathType]: infer NestedLoadPath extends string }
    ? NestedLoadPath extends string
      ? `${Key}.${NestedLoadPath}`
      : never
    : never

export type DefinitionLazyPaths<Definition extends Record<string, unknown>> = {
  [Key in StringKey<Definition>]: ChildLazyPaths<Key, Definition[Key]>
}[StringKey<Definition>]

export type OwnState<Definition extends Record<string, unknown>> = {
  [Key in keyof Definition as Definition[Key] extends StoreTypeMarker ? never : Key]: Definition[Key]
} & StateShape

export type ValidStoreDefinition<Definition extends Record<string, unknown>> = {
  [Key in keyof Definition]: Definition[Key] extends StoreTypeMarker
    ? Definition[Key]
    : Definition[Key] extends JsonValue
      ? Definition[Key]
      : never
}
