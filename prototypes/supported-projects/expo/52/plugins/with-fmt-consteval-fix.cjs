const fs = require('node:fs')
const path = require('node:path')
const { withDangerousMod } = require('@expo/config-plugins')

const marker = '# Reboil Expo 52: Xcode 26.4+ fmt consteval workaround'

const podfilePatch = `
    ${marker}
    # React Native 0.76 pins fmt 11.0.2, whose consteval implementation does
    # not compile with Apple Clang 21. This runs on each pod install and is
    # deliberately a no-op if the old fmt definition is no longer present.
    fmt_base = File.join(installer.sandbox.pod_dir('fmt'), 'include', 'fmt', 'base.h')
    if File.exist?(fmt_base)
      fmt_content = File.read(fmt_base)
      fmt_patched = fmt_content.gsub(/#\\s*define FMT_USE_CONSTEVAL 1/, '# define FMT_USE_CONSTEVAL 0')
      if fmt_patched != fmt_content
        File.chmod(0644, fmt_base)
        File.write(fmt_base, fmt_patched)
        puts 'Patched fmt/base.h for Xcode 26.4+ compatibility'
      end
    end
`

module.exports = function withFmtConstevalFix(config) {
  return withDangerousMod(config, [
    'ios',
    async (modConfig) => {
      const podfilePath = path.join(modConfig.modRequest.platformProjectRoot, 'Podfile')
      if (!fs.existsSync(podfilePath)) return modConfig

      const podfile = fs.readFileSync(podfilePath, 'utf8')
      if (podfile.includes(marker)) return modConfig

      const postInstallEnd = /\n  end\nend\s*$/
      const match = postInstallEnd.exec(podfile)
      if (!match || match.index === undefined) {
        throw new Error('Could not add the Xcode 26 fmt workaround: Expo generated an unexpected Podfile.')
      }

      const patchedPodfile = `${podfile.slice(0, match.index)}${podfilePatch}${podfile.slice(match.index)}`
      fs.writeFileSync(podfilePath, patchedPodfile)
      return modConfig
    },
  ])
}
