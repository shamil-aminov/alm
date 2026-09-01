import { expect, test } from '@playwright/test'
import { say } from '../shared/content.ts'
import { SITE } from './helpers.ts'

test('the feed carries a title and posts', async ({ request }) => {
  for (const [at, lang] of [['/rss.xml', SITE.languages[0]!], ['/en/rss.xml', 'en']] as const) {
    const xml = await (await request.get(at)).text()
    expect(xml, at).toContain(`<title>${say(SITE.name, lang)}</title>`)
    expect(xml.match(/<item>/g)?.length ?? 0, at).toBeGreaterThan(0)
  }
})
