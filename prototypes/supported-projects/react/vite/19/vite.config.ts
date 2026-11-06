import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

const projectRoot = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Keep the local Reboil link and this app on one React instance.
    alias: {
      react: `${projectRoot}node_modules/react`,
      'react-dom': `${projectRoot}node_modules/react-dom`,
    },
    dedupe: ['react', 'react-dom', 'use-sync-external-store'],
  },
})
