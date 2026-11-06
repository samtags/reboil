/* global __dirname, module, require */

const path = require('node:path')
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config')

const projectRoot = __dirname
const reboilRoot = path.resolve(projectRoot, '../../../../packages/reboil')
const defaultConfig = getDefaultConfig(projectRoot)

function resolveReboilRequest(context, moduleName, platform) {
  if (moduleName === '@reboil/store') {
    return { type: 'sourceFile', filePath: path.join(reboilRoot, 'dist/native.cjs') }
  }
  if (moduleName === '@reboil/store/react') {
    return { type: 'sourceFile', filePath: path.join(reboilRoot, 'dist/react-native.cjs') }
  }
  return context.resolveRequest(context, moduleName, platform)
}

module.exports = mergeConfig(defaultConfig, {
  watchFolders: [reboilRoot],
  resolver: {
    extraNodeModules: {
      '@babel/runtime': path.resolve(projectRoot, 'node_modules/@babel/runtime'),
      'react-native-mmkv': path.resolve(projectRoot, 'node_modules/react-native-mmkv'),
      'react-native-nitro-modules': path.resolve(projectRoot, 'node_modules/react-native-nitro-modules'),
      'use-sync-external-store': path.resolve(projectRoot, 'node_modules/use-sync-external-store'),
    },
    resolveRequest: resolveReboilRequest,
    sourceExts: [...defaultConfig.resolver.sourceExts, 'cjs'],
  },
})
