import { themes as prismThemes } from 'prism-react-renderer'
import type { Config } from '@docusaurus/types'
import type * as Preset from '@docusaurus/preset-classic'

const config: Config = {
  title: 'Reboil',
  tagline: 'Typed synchronous state without the ceremony.',
  favicon: 'img/boil.png',
  url: process.env.DOCS_SITE_URL || 'http://localhost:3000',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  markdown: { hooks: { onBrokenMarkdownLinks: 'throw' } },
  i18n: { defaultLocale: 'en', locales: ['en'] },
  presets: [
    [
      'classic',
      {
        docs: {
          routeBasePath: 'docs',
          sidebarPath: './sidebars.ts',
          showLastUpdateTime: false,
        },
        blog: false,
        theme: { customCss: './src/css/custom.css' },
      } satisfies Preset.Options,
    ],
  ],
  themeConfig: {
    image: 'img/reboil-social-card.svg',
    colorMode: { respectPrefersColorScheme: true },
    navbar: {
      title: 'Reboil',
      logo: { alt: 'Reboil mark', src: 'img/boil.png' },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Docs',
        },
        {
          to: '/docs/getting-started/quick-start',
          label: 'Quick start',
          position: 'left',
        },
        { to: '/docs/agents', label: 'For agents', position: 'left' },
        {
          href: 'https://github.com/samtags/reboil',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'light',
      links: [
        {
          title: 'Learn',
          items: [
            { label: 'Overview', to: '/docs/overview' },
            { label: 'Quick start', to: '/docs/getting-started/quick-start' },
          ],
        },
        {
          title: 'Reference',
          items: [
            { label: 'Public API', to: '/docs/reference/api' },
            { label: 'Runtime errors', to: '/docs/reference/errors' },
          ],
        },
        {
          title: 'Agents',
          items: [{ label: 'Agent documentation', to: '/docs/agents' }],
        },
      ],
      copyright: ' ',
    },
    prism: { theme: prismThemes.github, darkTheme: prismThemes.dracula },
  } satisfies Preset.ThemeConfig,
}

export default config
