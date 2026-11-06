const path = require('node:path')

const externalStore = path.join(__dirname, 'node_modules/use-sync-external-store')

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config) {
    // Reboil is a file: dependency in this fixture. Point only its external
    // store shim at the fixture, whose React peer resolves to this app's
    // React. Do not alias React itself: Next owns its server renderer copy.
    config.resolve.alias = {
      ...config.resolve.alias,
      'use-sync-external-store': externalStore,
    }
    return config
  },
  experimental: {
    turbo: {
      resolveAlias: {
        'use-sync-external-store': externalStore,
      },
    },
  },
}

module.exports = nextConfig
