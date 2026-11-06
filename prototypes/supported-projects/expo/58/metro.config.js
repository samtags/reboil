const path = require('node:path')
const { getDefaultConfig } = require('expo/metro-config')

const projectRoot = __dirname
const reboilRoot = path.resolve(projectRoot, '../../../../packages/reboil')
const config = getDefaultConfig(projectRoot)

config.watchFolders = [...(config.watchFolders ?? []), reboilRoot]
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules ?? {}),
  reboil: reboilRoot,
  'react-native-mmkv': path.resolve(projectRoot, 'node_modules/react-native-mmkv'),
  'react-native-nitro-modules': path.resolve(projectRoot, 'node_modules/react-native-nitro-modules'),
  'use-sync-external-store': path.resolve(projectRoot, 'node_modules/use-sync-external-store'),
}
config.resolver.sourceExts = [...config.resolver.sourceExts, 'cjs']

module.exports = config
