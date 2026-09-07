import { expect, test } from '@playwright/test'
import { CARDS, POSTS, PROJECTS, SECOND, SECTIONS, SITE, TABS, TRANSLATED, box, inSecond, settled } from './helpers'
import favorites from '../content/favorite.ts'
import { lookUp } from '../shared/content.ts'

test('the gap between frames is one number everywhere and clearly thinner than the margin', async ({ page }) => {
  const seen = new Set<string>()

  for (const to of ['/projects', '/favorite']) {
    await page.goto(to)
    await settled(page)

    const { gap, edge } = await page.locator('main ul').evaluate((el) => {
      const style = getComputedStyle(el)
      return { gap: parseFloat(style.columnGap), edge: parseFloat(style.paddingLeft) }
    })
    seen.add(String(gap))
    expect(gap, `${to}: the gap is not thinner than the margin`).toBeLessThan(edge)
  }

  expect(seen.size, 'the showcases disagree about the gap').toBe(1)
})

test('the tabs stay put while the content travels', async ({ page }) => {
  test.skip(TABS.length < 2, 'this site has no tabs to switch')

  await page.goto('/favorite')
  await settled(page)

  const before = await box(page, 'main .choices button')
  await page.locator('[data-scroll="favorite"]').evaluate((el) => { el.scrollTop = 300 })
  const after = await box(page, 'main .choices button')

  expect(after.top).toBe(before.top)
})

test('the fog ends where the content begins', async ({ page }) => {
  const fogOf = async (to: string, pane: string) => {
    await page.goto(to)
    await settled(page)

    return page.locator(`[data-scroll="${pane}"]`).evaluate((el) => {
      const style = getComputedStyle(el)
      const stops = [...style.maskImage.matchAll(/([\d.]+)px/g)].map((m) => Number(m[1]))
      return { mask: style.maskImage, fog: Math.max(...stops), start: parseFloat(style.paddingTop) }
    })
  }

  const column = await fogOf('/blog', 'page')
  const grid = await fogOf('/favorite', 'favorite')

  for (const [where, seen] of [['column', column], ['tabbed page', grid]] as const) {
    expect(seen.mask, where).toContain('linear-gradient')

    expect(seen.fog, `${where}: content begins inside the fog`).toBeLessThanOrEqual(seen.start + 1)
    expect(seen.start - seen.fog, `${where}: a hole between the fog and the content`).toBeLessThan(16)
  }

  expect(grid.fog).toBeCloseTo(column.fog, 0)
  expect(grid.start).toBeGreaterThan(column.start)
})

test('on a tabbed page the showcase scrolls, not the column', async ({ page }) => {
  test.skip(!CARDS, 'this site has nothing in favorites yet')

  await page.goto('/favorite')
  await settled(page)
  const columnScrolls = await page.locator('[data-scroll="page"]')
    .evaluate((el) => el.scrollHeight > el.clientHeight + 1)
  expect(columnScrolls).toBe(false)
})

test('images are there, not addresses from a previous life', async ({ page }) => {
  for (const to of [...SECTIONS, ...(TRANSLATED ? [`/blog/${TRANSLATED}`, ...(SECOND ? [inSecond(`/blog/${TRANSLATED}`)] : [])] : [])]) {
    await page.goto(to)
    await settled(page)

    await page.evaluate(() => [...document.images].forEach((i) => { i.loading = 'eager' }))
    await page.waitForFunction(() => [...document.images].every((i) => i.complete),
      null, { polling: 100 })

    const broken = await page.evaluate(() => [...document.images]
      .filter((i) => !i.naturalWidth)
      .map((i) => i.getAttribute('src')))
    expect(broken, to).toEqual([])
  }
})

test('a headline never outgrows the column it is set in', async ({ page }) => {
  test.skip(!POSTS, 'this site has no posts yet')

  for (const width of [390, 700, 1100, 1440, 1700, 2560]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/blog')
    await settled(page)

    const fits = await page.locator('main h2').first().evaluate((el) => {
      const range = document.createRange()
      range.selectNodeContents(el)
      const lines = [...range.getClientRects()]
      const column = el.closest('.column')!.getBoundingClientRect().width
      return { lines: lines.length, longest: Math.max(...lines.map((l) => l.width)), column }
    })

    expect(fits.longest, `${width}px: the line is wider than the column`).toBeLessThanOrEqual(fits.column)
    expect(fits.lines, `${width}px: a two-word title broke onto two lines`).toBe(1)
  }
})

test('a frame holds its place while the picture is still coming', async ({ page }) => {
  test.skip(!PROJECTS, 'this site has no projects yet')

  const held: (() => void)[] = []
  await page.route('**/*.webp', async (route) => {
    await new Promise<void>((go) => held.push(go))
    await route.continue()
  })

  await page.goto('/projects', { waitUntil: 'domcontentloaded' })
  await settled(page)

  const frame = page.locator('main li .cover').first()
  const ground = await frame.evaluate((el) => getComputedStyle(el).backgroundColor)
  expect(ground, 'the empty frame is invisible on black').not.toBe('rgba(0, 0, 0, 0)')
  expect(await frame.boundingBox().then((b) => Math.round(b!.height)),
    'the frame has no height before the picture').toBeGreaterThan(50)

  const cover = page.locator('main li img').first()
  expect(await cover.evaluate((el) => getComputedStyle(el).opacity),
    'the picture is shown before it has arrived').toBe('0')

  for (const go of held) go()
  await expect.poll(() => cover.evaluate((el) => getComputedStyle(el).opacity)).toBe('1')
})

test('a card leads out to its kind, both by the frame and by the caption', async ({ page }) => {
  const first = TABS[0] && favorites.find((card) => card.kind === TABS[0]!.kind)
  const to = first && lookUp(first, SITE.favorite)
  test.skip(!to, 'nothing in favorites leads anywhere yet')

  await page.goto('/favorite')
  await settled(page)

  const card = page.locator('[data-scroll="favorite"] li').first()
  expect(await card.locator(`a[href="${to}"]`).count(),
    'the frame and the caption should both lead to the same place').toBe(2)
  await expect(card.locator('a').first()).toHaveAttribute('target', '_blank')
})

test('past a point the page stops growing and moves in as one', async ({ page }) => {
  await page.setViewportSize({ width: 3200, height: 900 })
  await page.goto(POSTS && TRANSLATED ? `/blog/${TRANSLATED}` : '/')
  await settled(page)

  const header = await box(page, 'header nav a')
  const column = await box(page, 'main .column')

  expect(column.left, 'the text left the header behind at the edge').toBe(header.left)
  expect(header.left, 'nothing moved in at all').toBeGreaterThan(200)
  expect(column.width, 'the line grew past a readable measure').toBeLessThanOrEqual(704)
})

test('a big line hangs by its ink, not by the edge of its box', async ({ page }) => {
  await page.goto('/')
  await settled(page)

  const ink = await page.evaluate(() => {
    const pen = document.createElement('canvas').getContext('2d')!
    const bearing = (el: Element) => {
      const style = getComputedStyle(el)
      pen.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
      return -pen.measureText(el.textContent!.trim()).actualBoundingBoxLeft
    }
    const head = document.querySelector('main :is(.big, .post h1)')
    const body = document.querySelector('main p')
    if (!head || !body) return undefined

    return {
      owed: bearing(head) - bearing(body),
      head: head.getBoundingClientRect().left + bearing(head),
      body: body.getBoundingClientRect().left + bearing(body),
    }
  })

  test.skip(!ink, 'this poster has no headline over a paragraph')
  expect(ink!.head - ink!.body,
    `the headline is set ${ink!.owed.toFixed(1)}px in from the text below it`).toBeLessThan(1)
  expect(ink!.head - ink!.body, 'the headline hangs out on its own').toBeGreaterThan(-3)
})
