import { say } from '../../shared/content.ts'
import { languages, posts, site } from './content.ts'
import { escape } from './xml.ts'

const BASE = site.url.replace(/\/$/, '')

function titleOf(post: { title?: string, body: string }) {
  if (post.title) return post.title

  const first = post.body.split('\n').find((line) => line.trim()) ?? ''
  return first.replace(/^#+\s*/, '').slice(0, 80)
}

export function feed(lang: string) {
  const home = lang === languages[0]!.code ? BASE : `${BASE}/${lang}`

  const items = posts(lang).slice(0, 50).map((post) => {
    const link = `${home}/blog/${post.slug}`
    const published = post.date ? `\n    <pubDate>${new Date(post.date).toUTCString()}</pubDate>` : ''

    return `  <item>
    <title>${escape(titleOf(post))}</title>
    <link>${link}</link>
    <guid isPermaLink="true">${link}</guid>${published}
    <description>${escape(post.body)}</description>
  </item>`
  })

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
  <title>${escape(site.name)}</title>
  <link>${home}</link>
  <description>${escape(say(site.tagline, lang))}</description>
  <language>${lang}</language>
${items.join('\n')}
</channel></rss>`
}
