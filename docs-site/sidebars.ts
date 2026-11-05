import type { SidebarsConfig } from '@docusaurus/plugin-content-docs'

const sidebars: SidebarsConfig = {
  docsSidebar: [
    'overview',
    {
      type: 'category',
      label: 'Get started',
      items: ['getting-started/installation', 'getting-started/quick-start', 'getting-started/platform-support'],
    },
    {
      type: 'category',
      label: 'Core concepts',
      items: [
        'concepts/store-creation',
        'concepts/typed-paths',
        'concepts/react-subscriptions',
        'concepts/lazy-stores',
        'concepts/persistence',
      ],
    },
    { type: 'category', label: 'Reference', items: ['reference/api', 'reference/errors'] },
    { type: 'doc', id: 'agents', label: 'For agents' },
  ],
}

export default sidebars
