const path = require('node:path')

const externalStore = path.join(__dirname, 'node_modules/use-sync-external-store')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // This compatibility fixture should not create framework-managed agent
  // instruction files while a verifier starts the development server.
  agentRules: false,
  turbopack: {
    // Reboil is a file: dependency in this fixture. Alias only its external
    // store shim; aliasing React would rewrite Next's own server renderer.
    resolveAlias: {
      'use-sync-external-store': externalStore,
    },
  },
}

module.exports = nextConfig
