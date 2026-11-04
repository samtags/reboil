import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    react: 'src/react.ts',
    cli: 'src/cli.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  outExtension({ format }) {
    return { js: format === 'cjs' ? '.cjs' : '.mjs' }
  },
  banner: {
    js: '',
  },
  external: ['react', 'react-native-mmkv', 'react-native-nitro-modules'],
})
