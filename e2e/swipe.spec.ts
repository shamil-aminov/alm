import { expect, test } from '@playwright/test'
import { SECOND, settled, TABS } from './helpers'

const PHONE = { width: 390, height: 844 }

const onlyChromium = (name: string) => test.skip(name !== 'chromium', 'needs CDP')

async function swipe(page: import('@playwright/test').Page, across: number, at = { x: 195, y: 600 }) {
  const touch = await page.context().newCDPSession(page)
  await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: at.x, y: at.y }] })
  for (const part of [0.25, 0.5, 0.75, 1]) {
    await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: at.x + across * part, y: at.y }] })
    await page.waitForTimeout(25)
  }
  await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await page.waitForTimeout(1100)
}

test('a swipe walks the sections and the favorite tabs as one chain', async ({ page }, info) => {
  onlyChromium(info.project.name)
  test.skip(TABS.length < 2, 'needs at least two tabs')

  await page.setViewportSize(PHONE)
  await page.goto('/projects')
  await settled(page)

  await swipe(page, -140)
  expect(new URL(page.url()).pathname, 'a swipe from projects missed favorites').toBe('/favorite')
  expect(new URL(page.url()).searchParams.get('kind'), 'it landed on a tab other than the first').toBe(null)

  await swipe(page, -140)
  expect(new URL(page.url()).searchParams.get('kind'), 'the tab did not turn').toBe(TABS[1]!.kind)

  await swipe(page, 140)
  expect(new URL(page.url()).searchParams.get('kind'), 'the tabs did not walk back').toBe(null)

  await swipe(page, 140)
  expect(new URL(page.url()).pathname, 'the first tab did not let go back to projects').toBe('/projects')
})

test('a swipe leaves alone what is not a swipe', async ({ page }, info) => {
  onlyChromium(info.project.name)

  await page.setViewportSize(PHONE)
  await page.goto('/projects')
  await settled(page)

  await swipe(page, -140, { x: 10, y: 600 })
  expect(page.url(), 'it took the strip the system gesture owns').toContain('/projects')

  await swipe(page, -40)
  expect(page.url(), 'a short drag moved the page').toContain('/projects')

  const row = (await page.locator('header nav').boundingBox())!
  await swipe(page, -140, { x: row.x + row.width / 2, y: row.y + row.height / 2 })
  expect(page.url(), 'a swipe along the header left the page').toContain('/projects')
})

test('the finger on a row of tabs belongs to the row, not to the page', async ({ page }, info) => {
  onlyChromium(info.project.name)
  test.skip(!TABS.length, 'this site has no tabs')

  await page.setViewportSize(PHONE)
  await page.goto('/favorite')
  await settled(page)

  const row = (await page.locator('main .choices').boundingBox())!
  await swipe(page, -140, { x: row.x + row.width / 2, y: row.y + row.height / 2 })
  expect(new URL(page.url()).searchParams.get('kind'), 'a drag along the tabs turned the tab').toBe(null)
  expect(new URL(page.url()).pathname, 'a drag along the tabs left the section').toBe('/favorite')
})

test('the tabs travel back the way they came', async ({ page }) => {
  test.skip(TABS.length < 3, 'needs three tabs')

  await page.goto('/favorite')
  await settled(page)

  const dir = () => page.locator('.arrive').evaluate((el) => getComputedStyle(el).getPropertyValue('--dir').trim())

  await page.getByRole('button').nth(2).click()
  await page.waitForTimeout(150)
  expect(await dir(), 'forward through the tabs').toBe('1')

  await page.getByRole('button').nth(0).click()
  await page.waitForTimeout(150)
  expect(await dir(), 'back through the tabs travels like forward').toBe('-1')
})

test('a swipe lands while the page is still arriving', async ({ page }, info) => {
  onlyChromium(info.project.name)

  await page.setViewportSize(PHONE)
  await page.goto('/blog')
  await settled(page)

  await page.locator('header nav a[href="/projects"]').click()
  await page.waitForTimeout(500)

  await swipe(page, -140)
  expect(new URL(page.url()).pathname, 'a swipe during the arrival was eaten').toBe('/favorite')
})

test('a swipe knows where it is in the second language too', async ({ page }, info) => {
  onlyChromium(info.project.name)
  test.skip(!SECOND, 'this site speaks one language')

  await page.setViewportSize(PHONE)
  await page.goto(`/${SECOND}/projects`)
  await settled(page)

  await swipe(page, -140)
  expect(new URL(page.url()).pathname, 'a swipe went the wrong way behind a language prefix')
    .toBe(`/${SECOND}/favorite`)
})

test('a section travels back in the second language too', async ({ page }) => {
  test.skip(!SECOND, 'this site speaks one language')

  await page.goto(`/${SECOND}/favorite`)
  await settled(page)

  await page.locator(`header nav a[href="/${SECOND}/blog"]`).click()
  await page.waitForTimeout(150)

  const dir = await page.locator('.arrive').evaluate((el) => getComputedStyle(el).getPropertyValue('--dir').trim())
  expect(dir, 'going back behind a language prefix travelled forward').toBe('-1')
})
