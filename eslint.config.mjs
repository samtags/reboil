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
      '.vercel/**',
      'prototypes/init/react/cra/**',
      'prototypes/init/react/parcel/**',
      'prototypes/init/react/vite/**',
      'prototypes/init/react/next/**',
      'prototypes/init/vanilla/**',
      'prototypes/init/react-native/**',
      'prototypes/init/expo/**',
    ],
  },
  {
    ...js.configs.recommended,
    files: ['**/*.{js,mjs,cjs}'],
  },
  ...tseslint.configs.recommended.map((config) => ({ ...config, files: typescriptFiles })),
  {
    files: ['scripts/**/*.{js,mjs,cjs}', 'prototypes/init/scripts/**/*.{js,mjs,cjs}', 'eslint.config.mjs'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['prototypes/reboil-vanilla-app/src/**/*.js'],
    languageOptions: { globals: globals.browser },
  },
  {
    ...reactHooks.configs.flat.recommended,
    files: ['prototypes/**/*.{jsx,tsx}', 'docs-site/src/**/*.{jsx,tsx}'],
  },
  prettier,
)
