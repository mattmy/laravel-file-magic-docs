import { defineConfig } from 'vitepress'

const repositoryUrl = 'https://github.com/mattmy/file-magic'

export default defineConfig({
  title: 'FileMagic',
  description: 'File management for Laravel',
  base: '/file-magic-docs/',
  cleanUrls: true,
  lastUpdated: true,
  sitemap: {
    hostname: 'https://mattmy.github.io/file-magic-docs/',
  },
  locales: {
    root: {
      label: 'English',
      lang: 'en',
      title: 'FileMagic',
      description: 'File management for Laravel',
    },
    'zh-TW': {
      label: '繁體中文',
      lang: 'zh-TW',
      link: '/zh-TW/',
      title: 'FileMagic',
      description: 'Laravel 檔案管理套件',
    },
  },
  themeConfig: {
    logo: '/logo.svg',
    search: {
      provider: 'local',
    },
    socialLinks: [
      {
        icon: 'github',
        link: repositoryUrl,
      },
    ],
    locales: {
      root: {
        nav: [
          {
            text: 'Home',
            link: '/',
          },
          {
            text: 'Documentation',
            link: '/guide/getting-started',
          },
          {
            text: 'GitHub',
            link: repositoryUrl,
          },
        ],
        sidebar: {
          '/guide/': [
            {
              text: 'FileMagic',
              items: [
                {
                  text: 'Getting started',
                  link: '/guide/getting-started',
                },
                {
                  text: 'Storing files',
                  link: '/guide/storing-files',
                },
                {
                  text: 'Remote files',
                  link: '/guide/remote-files',
                },
                {
                  text: 'Documents and images',
                  link: '/guide/documents-and-images',
                },
                {
                  text: 'Querying files',
                  link: '/guide/querying-files',
                },
                {
                  text: 'ZIP and deletion',
                  link: '/guide/zip-and-deletion',
                },
                {
                  text: 'Models and exceptions',
                  link: '/guide/models-and-exceptions',
                },
                {
                  text: 'Reference',
                  link: '/guide/reference',
                },
              ],
            },
          ],
        },
        outline: {
          level: [2, 3],
          label: 'On this page',
        },
        docFooter: {
          prev: false,
          next: false,
        },
        footer: {
          message: 'Released under the MIT License.',
          copyright: 'Copyright © mattmy',
        },
      },
      'zh-TW': {
        nav: [
          {
            text: '首頁',
            link: '/zh-TW/',
          },
          {
            text: '文件',
            link: '/zh-TW/guide/getting-started',
          },
          {
            text: 'GitHub',
            link: repositoryUrl,
          },
        ],
        sidebar: {
          '/zh-TW/guide/': [
            {
              text: 'FileMagic',
              items: [
                {
                  text: '開始使用',
                  link: '/zh-TW/guide/getting-started',
                },
                {
                  text: '儲存檔案',
                  link: '/zh-TW/guide/storing-files',
                },
                {
                  text: '遠端檔案',
                  link: '/zh-TW/guide/remote-files',
                },
                {
                  text: '文件與圖片',
                  link: '/zh-TW/guide/documents-and-images',
                },
                {
                  text: '查詢檔案',
                  link: '/zh-TW/guide/querying-files',
                },
                {
                  text: 'ZIP 與刪除',
                  link: '/zh-TW/guide/zip-and-deletion',
                },
                {
                  text: 'Model 與例外',
                  link: '/zh-TW/guide/models-and-exceptions',
                },
                {
                  text: '參考資料',
                  link: '/zh-TW/guide/reference',
                },
              ],
            },
          ],
        },
        outline: {
          level: [2, 3],
          label: '本頁內容',
        },
        docFooter: {
          prev: false,
          next: false,
        },
        footer: {
          message: '使用 MIT License 發佈。',
          copyright: 'Copyright © mattmy',
        },
      },
    },
  },
})
