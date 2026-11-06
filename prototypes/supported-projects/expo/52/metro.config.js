const path = require('node:path')
const { getDefaultConfig } = require('expo/metro-config')

const projectRoot = __dirname
const reboilRoot = path.resolve(projectRoot, '../../../../packages/reboil')
const config = getDefaultConfig(projectRoot)

// SDK 52 does not enable package exports by default. Reboil publishes its
// React binding through the `./react` export, so opt in for this fixture.
config.resolver.unstable_enablePackageExports = true
config.watchFolders = [...(config.watchFolders ?? []), reboilRoot]
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules ?? {}),
  '@babel/runtime': path.resolve(projectRoot, 'node_modules/@babel/runtime'),
  reboil: reboilRoot,
  'react-native-mmkv': path.resolve(projectRoot, 'node_modules/react-native-mmkv'),
  'react-native-nitro-modules': path.resolve(projectRoot, 'node_modules/react-native-nitro-modules'),
  'use-sync-external-store': path.resolve(projectRoot, 'node_modules/use-sync-external-store'),
}
config.resolver.sourceExts = [...config.resolver.sourceExts, 'cjs']

module.exports = config
