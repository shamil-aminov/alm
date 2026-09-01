import { expect, test } from '@playwright/test'
import { SECTIONS, box, settled } from './helpers'

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
  await page.goto('/favorite')
  await settled(page)
  const columnScrolls = await page.locator('[data-scroll="page"]')
    .evaluate((el) => el.scrollHeight > el.clientHeight + 1)
  expect(columnScrolls).toBe(false)
})

test('images are there, not addresses from a previous life', async ({ page }) => {
  for (const to of [...SECTIONS, '/blog/example', '/en/blog/example']) {
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
