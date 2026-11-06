import { createRequire } from 'node:module'
import { defineConfig } from 'tsup'
import type * as TypeScript from 'typescript'

const requireFromTsup = createRequire(createRequire(import.meta.url).resolve('tsup'))
const tsupTypescript = requireFromTsup('typescript') as typeof TypeScript
const dtsCompilerOptions =
  Number.parseInt(tsupTypescript.versionMajorMinor, 10) >= 6 ? { ignoreDeprecations: '6.0' } : {}

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    react: 'src/react.ts',
    next: 'src/next.ts',
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
  noExternal: ['chalk', 'ora'],
  external: ['react', 'react-native-mmkv', 'react-native-nitro-modules'],
})
