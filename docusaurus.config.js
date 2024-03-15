// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import {themes as prismThemes} from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Powerful Network Toolbox for iOS & tvOS',
  tagline: 'Employing Loon for effortless and secure Internet browsing by overseeing, administrating, and refining the entire device network.',
  favicon: 'img/favicon.png',

  // Set the production url of your site here
  url: 'https://loon0x00.github.io/',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'Loon0x00', // Usually your GitHub org/user name.
  projectName: 'Loon0x00.github.io', // Usually your repo name.

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
        },
        blog: {
          showReadingTime: true,
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Replace with your project's social card
      image: 'img/loon.png',
      navbar: {
        title: 'Loon',
        logo: {
          alt: 'Loon Logo',
          src: 'img/loon.png',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'tutorialSidebar',
            position: 'left',
            label: 'Manual',
          },
          {to: '/blog', label: 'Tutorial', position: 'left'},
          {
            href: 'https://github.com/Loon0x00/LoonManual',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Docs',
            items: [
              {
                label: 'Manual',
                to: '/docs/intro',
              },
            ],
          },
          {
            title: 'Community',
            items: [
              {
                label: 'Telegram',
                href: 'https://t.me/Loon0x00',
              },
              {
                label: 'Twitter',
                href: 'https://twitter.com/loon0x00',
              }
            ],
          },
          {
            title: 'More',
            items: [
              {
                label: 'Tutorial',
                to: '/blog',
              },
              {
                label: 'GitHub',
                href: 'https://github.com/Loon0x00/LoonManual',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Loon Lab Limit. Built with Docusaurus.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
      },
    }),
};

export default config;
