import { say } from '../../shared/content.ts'
import { languages, posts, site } from './content.ts'
import { escape } from './xml.ts'

const BASE = site.url.replace(/\/$/, '')

export function feed(lang: string) {
  const home = lang === languages[0]!.code ? BASE : `${BASE}/${lang}`

  const items = posts(lang).slice(0, 50).map((post) => {
    const link = `${home}/blog/${post.slug}`
    const published = post.date ? `\n    <pubDate>${new Date(post.date).toUTCString()}</pubDate>` : ''

    return `  <item>
    <title>${escape(post.title)}</title>
    <link>${link}</link>
    <guid isPermaLink="true">${link}</guid>${published}
    <description>${escape(post.html)}</description>
  </item>`
  })

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
  <title>${escape(say(site.name, lang))}</title>
  <link>${home}</link>
  <description>${escape(say(site.tagline, lang))}</description>
  <language>${lang}</language>
${items.join('\n')}
</channel></rss>`
}
