import { defineConfig } from 'tsup'
import * as ts from 'typescript'

const dtsCompilerOptions = Number.parseInt(ts.versionMajorMinor, 10) >= 6 ? { ignoreDeprecations: '6.0' } : {}

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    react: 'src/react.ts',
    cli: 'src/cli.ts',
  },
  format: ['esm', 'cjs'],
  dts: { compilerOptions: dtsCompilerOptions },
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
