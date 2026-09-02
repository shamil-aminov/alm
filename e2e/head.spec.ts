import { expect, test } from '@playwright/test'
import { ALONE, FIRST, SECOND, SECTIONS, SITE, TRANSLATED, lost, settled } from './helpers'

const head = (page: import('@playwright/test').Page, selector: string) =>
  page.locator(selector).evaluateAll((els) => els.map((el) => el.getAttribute('href') ?? ''))

test('a page declares its language and its canonical address', async ({ page }) => {
  for (const to of [...SECTIONS, '/en', ...(TRANSLATED ? [`/blog/${TRANSLATED}`] : [])]) {
    await page.goto(to)
    await settled(page)

    const lang = await page.locator('html').getAttribute('lang')
    expect(lang, to).toMatch(to.startsWith('/en') ? /^en/ : /^ru/)

    const [canonical] = await head(page, 'link[rel="canonical"]')
    expect(canonical, to).toBe(`${SITE.url}${to === '/' ? '' : to}`)
  }
})

test('hreflang promises only the versions that exist', async ({ page }) => {
  test.skip(!TRANSLATED, 'nothing here is written in every language')

  await page.goto(`/blog/${TRANSLATED}`)
  await settled(page)
  expect(await head(page, 'link[hreflang="en"]')).toEqual([`${SITE.url}/en/blog/${TRANSLATED}`])

  test.skip(!ALONE, 'everything here is translated, so there is no promise to withhold')
  await page.goto(`/blog/${ALONE}`)
  await settled(page)
  expect(await head(page, 'link[hreflang="en"]')).toEqual([])
  expect(await head(page, 'link[hreflang="ru"]')).toEqual([`${SITE.url}/blog/${ALONE}`])
})

test('an unknown address gets our page, not a blank default', async ({ page }) => {
  await page.goto('/nope')
  await settled(page)

  await expect(page.locator('main h1')).toHaveText('404')
  await expect(page.locator('main p')).toHaveText(lost(FIRST))
  expect(await page.locator('main a').count()).toBe(0)
})

test('404 is a page, not a dead end: it travels and it switches language', async ({ page }) => {
  await page.goto('/nope')
  await settled(page)

  await page.locator('header a[href="/en/nope"]').click()
  await settled(page)
  await expect(page.locator('main p')).toHaveText(lost(SECOND!))

  await page.locator('header nav a[href="/en"]').click()
  await page.waitForTimeout(100)
  await expect(page.locator('main h1')).toHaveText('404')

  await settled(page)
  await expect(page.locator('main article')).toBeVisible()
})

test('language still switches on a post that does not exist', async ({ page }) => {
  await page.goto('/blog/nope')
  await settled(page)
  await expect(page.locator('main h1')).toHaveText('404')
  await expect(page.locator('header a[href="/en/blog/nope"]')).toBeVisible()

  test.skip(!ALONE, 'everything here is translated, so the switch never hides')
  await page.goto(`/blog/${ALONE}`)
  await settled(page)
  expect(await page.locator('header a[href^="/en"]').count()).toBe(0)
})

test('the sitemap lists sections and posts, and only the ones that exist', async ({ request }) => {
  const xml = await (await request.get('/sitemap.xml')).text()
  const loc = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]!)

  for (const to of SECTIONS) expect(loc, to).toContain(`${SITE.url}${to === '/' ? '/' : to}`)
  if (TRANSLATED) expect(loc).toContain(`${SITE.url}/en/blog/${TRANSLATED}`)
  if (ALONE) expect(loc).not.toContain(`${SITE.url}/en/blog/${ALONE}`)

  const robots = await (await request.get('/robots.txt')).text()
  expect(robots).toContain(`Sitemap: ${SITE.url}/sitemap.xml`)
})

test('the share image is an absolute address', async ({ page }) => {
  for (const to of ['/', ...(TRANSLATED ? [`/blog/${TRANSLATED}`] : [])]) {
    await page.goto(to)
    const image = page.locator('meta[property="og:image"]')
    await expect(image, to).toHaveAttribute('content', /^https?:\/\//)
  }
})

test('the icons and the browser colour are declared and really there', async ({ page, request }) => {
  await page.goto('/')

  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#000000')

  const assets = ['/icon.svg', '/apple-touch-icon.png', '/og.png', '/favicon.ico']
  for (const at of assets) {
    expect((await request.get(at)).status(), at).toBe(200)
  }

  for (const rel of ['icon', 'apple-touch-icon']) {
    await expect(page.locator(`link[rel="${rel}"]`), rel).toHaveCount(1)
  }
})
