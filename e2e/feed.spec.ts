import { expect, test } from '@playwright/test'

test('the feed carries a title and posts', async ({ request }) => {
  for (const at of ['/rss.xml', '/en/rss.xml']) {
    const xml = await (await request.get(at)).text()
    expect(xml, at).toContain('<title>ALM</title>')
    expect(xml.match(/<item>/g)?.length ?? 0, at).toBeGreaterThan(0)
  }
})
