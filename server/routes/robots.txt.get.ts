import { site } from '../utils/content.ts'

export default defineEventHandler((event) => {
  setHeader(event, 'content-type', 'text/plain; charset=utf-8')

  const sitemap = `${site.url.replace(/\/$/, '')}/sitemap.xml`
  return `User-Agent: *\nAllow: /\n\nSitemap: ${sitemap}\n`
})
