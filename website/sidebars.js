// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  docsSidebar: [
    'intro',
    'how-it-works',
    {
      type: 'category',
      label: 'Getting Started',
      collapsed: false,
      items: [
        'getting-started/quick-start',
        'getting-started/configuration',
      ],
    },
    {
      type: 'category',
      label: 'Use Cases',
      items: [
        'tutorials/hugo-multilingual-site',
        'tutorials/translate-30-languages',
        'tutorials/build-a-plugin',
        'guides/translation-methods',
        'guides/serving-a-method',
      ],
    },
    {
      type: 'category',
      label: 'Core Concepts',
      items: [
        'concepts/architecture',
        'concepts/how-sync-works',
        'concepts/translation-memory',
        'concepts/coaching-data',
        'concepts/quality-gate',
        'concepts/script-converters',
        'concepts/security',
      ],
    },
    {
      type: 'category',
      label: 'Reference',
      items: [
        'reference/cli',
        'reference/plugin-spec',
        'reference/supported-languages',
      ],
    },
    {
      type: 'category',
      label: 'Integrations',
      items: [
        'guides/bridge',
        'guides/ci-cd',
        'guides/content-translation',
        'guides/conlangs-scripts-orthography',
        'guides/comparison',
      ],
    },
    {
      type: 'category',
      label: 'Guides',
      items: [
        'guides/professional-translators',
        'guides/troubleshooting',
      ],
    },
  ],
};

export default sidebars;
