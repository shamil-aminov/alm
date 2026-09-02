import { expect, test } from '@playwright/test'
import { say } from '../shared/content.ts'
import { POSTS, SITE } from './helpers.ts'

test('the feed carries a title and posts', async ({ request }) => {
  test.skip(!POSTS, 'this site has no posts yet')

  const feeds = SITE.languages.map((language, at) =>
    [at ? `/${language.code}/rss.xml` : '/rss.xml', language.code] as const)

  for (const [at, lang] of feeds) {
    const xml = await (await request.get(at)).text()
    expect(xml, at).toContain(`<title>${say(SITE.name, lang)}</title>`)
    expect(xml.match(/<item>/g)?.length ?? 0, at).toBeGreaterThan(0)
  }
})
