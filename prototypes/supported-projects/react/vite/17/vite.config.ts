import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

const projectRoot = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Reboil is installed from a local file: link in these fixtures.  Its
    // `use-sync-external-store` dependency otherwise resolves from the
    // workspace and can load a second copy of React.
    alias: {
      react: `${projectRoot}node_modules/react`,
      'react-dom': `${projectRoot}node_modules/react-dom`,
    },
    dedupe: ['react', 'react-dom', 'use-sync-external-store'],
  },
})
