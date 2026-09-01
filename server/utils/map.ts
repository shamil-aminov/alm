import { languages, posts, site } from './content.ts'
import { escape } from './xml.ts'

const BASE = site.url.replace(/\/$/, '')
const CODES = languages.map((l) => l.code)

export const addressOf = (lang: string, path: string) =>
  lang === CODES[0] ? path : `/${lang}${path === '/' ? '' : path}`

const url = (loc: string, alternates: string, lastmod?: string) => `  <url>
    <loc>${escape(loc)}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}
${alternates}
  </url>`

function entry(langs: string[], pathIn: (lang: string) => string, lastmod?: string) {
  const alternates = langs.map((lang) =>
    `    <xhtml:link rel="alternate" hreflang="${lang}" href="${escape(BASE + pathIn(lang))}"/>`)

  return langs.map((lang) => url(BASE + pathIn(lang), alternates.join('\n'), lastmod)).join('\n')
}

export function sitemap() {
  const sections = site.sections.map((section) =>
    entry(CODES, (lang) => addressOf(lang, section.to)))

  const byLang = new Map(CODES.map((lang) => [lang, posts(lang)]))
  const slugs = [...new Set(CODES.flatMap((lang) => posts(lang).map((post) => post.slug)))]

  const stories = slugs.map((slug) => {
    const written = CODES.filter((lang) => byLang.get(lang)!.some((post) => post.slug === slug))
    const dates = written
      .map((lang) => byLang.get(lang)!.find((post) => post.slug === slug)?.date)
      .filter((date): date is string => !!date)

    return entry(written, (lang) => addressOf(lang, `/blog/${slug}`), dates.sort().at(-1))
  })

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${[...sections, ...stories].join('\n')}
</urlset>`
}
