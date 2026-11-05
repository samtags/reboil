import js from '@eslint/js'
import prettier from 'eslint-config-prettier/flat'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'
import tseslint from 'typescript-eslint'

const typescriptFiles = ['**/*.{ts,tsx,mts,cts}']

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/.parcel-cache/**',
      'docs-site/.docusaurus/**',
      'docs-site/static/**',
    ],
  },
  {
    ...js.configs.recommended,
    files: ['**/*.{js,mjs,cjs}'],
  },
  ...tseslint.configs.recommended.map((config) => ({ ...config, files: typescriptFiles })),
  {
    files: ['scripts/**/*.{js,mjs,cjs}', 'eslint.config.mjs'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['examples/reboil-vanilla-app/src/**/*.js'],
    languageOptions: { globals: globals.browser },
  },
  {
    ...reactHooks.configs.flat.recommended,
    files: ['examples/**/*.{jsx,tsx}', 'docs-site/src/**/*.{jsx,tsx}'],
  },
  prettier,
)
