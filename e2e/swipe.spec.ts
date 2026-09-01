import { expect, test } from '@playwright/test'
import { settled, TABS } from './helpers'

const PHONE = { width: 390, height: 844 }

// touchmove без CDP не отправить: page.touchscreen умеет только тапать, а в WebKit
// нет конструктора Touch.
const onlyChromium = (name: string) => test.skip(name !== 'chromium', 'нужен CDP')

async function swipe(page: import('@playwright/test').Page, across: number, at = { x: 195, y: 600 }) {
  const touch = await page.context().newCDPSession(page)
  await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: at.x, y: at.y }] })
  for (const part of [0.25, 0.5, 0.75, 1]) {
    await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: at.x + across * part, y: at.y }] })
    await page.waitForTimeout(25)
  }
  await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  // Въезд страницы длится 950 мс: до его конца следующий палец попадает в уезжающее.
  await page.waitForTimeout(1100)
}

test('a swipe walks the sections and the favorite tabs as one chain', async ({ page }, info) => {
  onlyChromium(info.project.name)
  test.skip(TABS.length < 2, 'нужны хотя бы две вкладки')

  await page.setViewportSize(PHONE)
  await page.goto('/projects')
  await settled(page)

  await swipe(page, -140)
  expect(new URL(page.url()).pathname, 'из проектов не попали в любимое').toBe('/favorite')
  expect(new URL(page.url()).searchParams.get('kind'), 'въехали не в первую вкладку').toBe(null)

  await swipe(page, -140)
  expect(new URL(page.url()).searchParams.get('kind'), 'вкладка не перелистнулась').toBe(TABS[1]!.kind)

  await swipe(page, 140)
  expect(new URL(page.url()).searchParams.get('kind'), 'назад по вкладкам').toBe(null)

  await swipe(page, 140)
  expect(new URL(page.url()).pathname, 'с первой вкладки не вышли к проектам').toBe('/projects')
})

test('a swipe leaves alone what is not a swipe', async ({ page }, info) => {
  onlyChromium(info.project.name)

  await page.setViewportSize(PHONE)
  await page.goto('/projects')
  await settled(page)

  await swipe(page, -140, { x: 10, y: 600 })
  expect(page.url(), 'забрали полосу системного жеста').toContain('/projects')

  await swipe(page, -40)
  expect(page.url(), 'уехали от короткого движения').toContain('/projects')

  const row = (await page.locator('header nav').boundingBox())!
  await swipe(page, -140, { x: row.x + row.width / 2, y: row.y + row.height / 2 })
  expect(page.url(), 'свайп по шапке увёл со страницы').toContain('/projects')
})

test('the tabs travel back the way they came', async ({ page }) => {
  test.skip(TABS.length < 3, 'нужны три вкладки')

  await page.goto('/favorite')
  await settled(page)

  const dir = () => page.locator('.arrive').evaluate((el) => getComputedStyle(el).getPropertyValue('--dir').trim())

  await page.getByRole('button').nth(2).click()
  await page.waitForTimeout(150)
  expect(await dir(), 'вперёд по вкладкам').toBe('1')

  await page.getByRole('button').nth(0).click()
  await page.waitForTimeout(150)
  expect(await dir(), 'назад по вкладкам едет как вперёд').toBe('-1')
})
