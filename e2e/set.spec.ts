import { expect, test } from '@playwright/test'
import site from '../content/site.ts'
import { say } from '../shared/content.ts'
import { FIRST, LISTED, TABS, settled } from './helpers'

const [EARLIER, LATER] = LISTED
const link = (page: import('@playwright/test').Page, to: string) =>
  page.locator(`header nav a[href="${to}"]`)

const size = (page: import('@playwright/test').Page, to: string) =>
  link(page, to).evaluate((el) => parseFloat(getComputedStyle(el).fontSize))

test.skip(LISTED.length < 2, 'this site has fewer than two sections to compare')

test('exactly one item in a row is large, and it is the current section', async ({ page }) => {
  await page.goto(LATER!.to)
  await settled(page)

  const active = await size(page, LATER!.to)
  const other = await size(page, EARLIER!.to)
  expect(active).toBeGreaterThan(other)

  const sizes = await page.locator('header nav a').evaluateAll((els) =>
    els.map((el) => parseFloat(getComputedStyle(el).fontSize)))
  expect(sizes.filter((s) => s === Math.max(...sizes))).toHaveLength(1)
})

test('hover moves the type size and the row does not jump', async ({ page }) => {
  await page.goto(LATER!.to)
  await settled(page)

  const nav = page.locator('header nav')
  const rowHeight = () => nav.evaluate((el) => Math.round(el.getBoundingClientRect().height))
  const before = await rowHeight()

  const bigger = async (a: string, b: string) => await size(page, a) > await size(page, b)

  await link(page, EARLIER!.to).hover()
  await expect.poll(() => bigger(EARLIER!.to, LATER!.to)).toBe(true)
  expect(await rowHeight()).toBe(before)

  await page.mouse.move(0, 400)
  await expect.poll(() => bigger(LATER!.to, EARLIER!.to)).toBe(true)
  expect(await rowHeight()).toBe(before)
})

test('the highlight does not drop in the gap between words', async ({ page }) => {
  await page.goto(LATER!.to)
  await settled(page)

  const earlier = await link(page, EARLIER!.to).boundingBox()
  const later = await link(page, LATER!.to).boundingBox()
  const y = earlier!.y + earlier!.height / 2

  for (let x = earlier!.x + earlier!.width; x < later!.x; x += 2) {
    await page.mouse.move(x, y)
    const marked = await page.locator('header nav [data-hover]').count()
    expect(marked).toBe(1)
  }
})

test('there is nothing to select in a row, but the text of a post selects', async ({ page }) => {
  await page.goto('/blog')
  await settled(page)

  const selectable = (el: Element) => {
    const style = getComputedStyle(el)
    return style.userSelect ?? style.webkitUserSelect
  }
  const header = await page.locator('header').evaluate(selectable)
  const article = await page.locator('main').evaluate(selectable)
  expect(header).toBe('none')
  expect(article).not.toBe('none')
})

test('tabs are the same buttons as the items of the header', async ({ page }) => {
  await page.goto('/favorite')
  await settled(page)

  const tab = page.locator('main button').first()
  expect(await tab.evaluate((el) => getComputedStyle(el).cursor)).toBe('pointer')
  expect(await tab.evaluate((el) => getComputedStyle(el).textTransform)).toBe('lowercase')
})

test('the header is built from the settings, not from the code', async ({ page }) => {
  await page.goto('/')
  await settled(page)
  const words = await page.locator('header nav a').allTextContents()
  expect(words.map((w) => w.trim())).toEqual(site.sections.map((s) => say(s.label, FIRST)))

  const other = site.languages[1]!
  await expect(page.locator(`header a[href^="/${other.code}"]`)).toHaveAttribute('aria-label', other.label)
})

test('the row does not change height while the type travels', async ({ page }) => {
  await page.goto(EARLIER!.to)
  await settled(page)

  const height = () => page.locator('header').evaluate((el) => el.getBoundingClientRect().height)
  const seen = new Set<number>([Math.round(await height())])

  await link(page, LATER!.to).hover()
  for (let i = 0; i < 6; i++) {
    await page.waitForTimeout(90)
    seen.add(Math.round(await height()))
  }

  await page.mouse.move(0, 500)
  for (let i = 0; i < 6; i++) {
    await page.waitForTimeout(90)
    seen.add(Math.round(await height()))
  }

  expect([...seen], 'the header changes height under the cursor').toHaveLength(1)
})

test('a finger can hit a tab, not only a cursor', async ({ page }) => {
  await page.goto('/favorite')
  await settled(page)

  const alive = await page.locator('main .choices button').first().evaluate((el) => {
    const box = el.getBoundingClientRect()
    let top = box.top

    while (top < box.bottom && document.elementFromPoint(box.left + 5, top + 1) !== el) top += 1
    return Math.round(box.bottom - top)
  })

  expect(alive, 'a finger cannot hit the tab').toBeGreaterThanOrEqual(44)
})

test('one row highlights, not both at once', async ({ page }) => {
  test.skip(!TABS.length, 'this site has no tabs to highlight')
  await page.goto('/favorite')
  await settled(page)

  const lit = () => page.evaluate(() => ({
    header: document.querySelectorAll('header nav [data-hover]').length,
    tabs: document.querySelectorAll('main .choices [data-hover]').length,
  }))

  await link(page, EARLIER!.to).hover()
  await expect.poll(lit).toEqual({ header: 1, tabs: 0 })

  await page.locator('main .choices button').last().hover()
  await expect.poll(lit).toEqual({ header: 0, tabs: 1 })
})

test('switching language does not rewind the wheel', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/favorite')
  await settled(page)

  const at = () => page.locator('header nav').evaluate((el) => Math.round(el.scrollLeft))
  const before = await at()
  expect(before, 'the wheel was not turned to begin with').toBeGreaterThan(20)

  await page.evaluate(() => {
    ;(window as unknown as { seen: number[] }).seen = []
    const tick = () => {
      const row = document.querySelector('header nav')
      if (row) (window as unknown as { seen: number[] }).seen.push(Math.round(row.scrollLeft))
      requestAnimationFrame(tick)
    }
    tick()
  })

  await page.locator('header a.language').click()
  await settled(page)
  await page.waitForTimeout(700)

  const seen = await page.evaluate(() => (window as unknown as { seen: number[] }).seen)
  const rewound = seen.filter((one) => one < before / 2).length
  expect(rewound, 'the wheel went back to the start and turned again').toBeLessThan(3)
})
