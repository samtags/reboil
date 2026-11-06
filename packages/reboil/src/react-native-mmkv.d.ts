declare module 'react-native-mmkv' {
  export interface MMKV {
    getString(key: string): string | undefined
    set(key: string, value: string): void
    remove(key: string): void
  }

  export function createMMKV(configuration?: { id?: string }): MMKV
}
