const path = require('node:path')
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config')

const projectRoot = __dirname
const reboilRoot = path.resolve(projectRoot, '../../../packages/reboil')
const defaultConfig = getDefaultConfig(projectRoot)

module.exports = mergeConfig(defaultConfig, {
  watchFolders: [reboilRoot],
  resolver: {
    extraNodeModules: {
      '@babel/runtime': path.resolve(projectRoot, 'node_modules/@babel/runtime'),
      reboil: reboilRoot,
      'use-sync-external-store': path.resolve(projectRoot, 'node_modules/use-sync-external-store'),
    },
    sourceExts: [...defaultConfig.resolver.sourceExts, 'cjs'],
  },
})
