import tailwindcss from '@tailwindcss/vite'
import type { ModuleOptions } from '@nuxtjs/i18n'
import { content } from './build/content.ts'
import site from './content/site.ts'

const [first] = site.languages

const feeds = site.languages.map((l) => (l === first ? '/rss.xml' : `/${l.code}/rss.xml`))
const locales = site.languages.map((l) => ({
  code: l.code,
  language: l.tag ?? l.code,
  file: `${l.code}.json`,
}))

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/fonts', '@nuxtjs/i18n'],
  css: ['~/assets/main.css'],
  vite: { plugins: [tailwindcss(), content()] },

  app: {
    head: {
      link: [
        { rel: 'alternate', type: 'application/rss+xml', href: '/rss.xml' },
        { rel: 'icon', type: 'image/svg+xml', href: '/icon.svg' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
      ],
      meta: [{ name: 'theme-color', content: '#000000' }],
    },
  },

  nitro: {
    prerender: {
      crawlLinks: true,
      failOnError: true,
      routes: ['/', '/sitemap.xml', '/robots.txt', ...feeds],
    },
  },

  i18n: {
    strategy: 'prefix_except_default',
    defaultLocale: first!.code as ModuleOptions['defaultLocale'],

    baseUrl: site.url,
    experimental: { strictSeo: true },

    detectBrowserLanguage: false,

    // @ts-expect-error
    locales,
  },
})
