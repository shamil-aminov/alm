import { expect, type Page } from '@playwright/test'

export const SECTIONS = ['/', '/blog', '/projects', '/favorite'] as const

export const direction = (page: Page) =>
  page.locator('[style*="--dir"]').evaluate((el) =>
    Number(getComputedStyle(el).getPropertyValue('--dir')))

export const hydrated = (page: Page) =>
  expect.poll(() => page.evaluate(() => '__vue_app__' in (document.querySelector('#__nuxt') ?? {})),
    { timeout: 15_000 }).toBe(true)

export const stretchTheReveal = (page: Page) =>
  page.route('**/*.css', async (route) => {
    const answer = await route.fetch()
    const slower = (await answer.text()).replace('--appear:.22s', '--appear:2s')
    await route.fulfill({ response: answer, body: slower })
  })

export const holdTheScripts = (page: Page, ms: number) =>
  page.route('**/*.js', async (route) => {
    await new Promise((wake) => setTimeout(wake, ms))
    await route.continue()
  })

export async function settled(page: Page) {
  await hydrated(page)
  await expect(page.locator('main')).toHaveCount(1)
  await expect(page.locator('.travel-enter-active, .travel-leave-active')).toHaveCount(0)
}

export async function go(page: Page, to: string) {
  await page.locator(`header nav a[href="${to}"]`).click()
  await expect(page).toHaveURL(new RegExp(`${to.replace('/', '\\/')}$`))
  await settled(page)
}

export const box = (page: Page, selector: string) =>
  page.locator(selector).first().evaluate((el) => {
    const { top, bottom, left, right, width, height } = el.getBoundingClientRect()
    return {
      top: Math.round(top),
      bottom: Math.round(bottom),
      left: Math.round(left),
      right: Math.round(right),
      width: Math.round(width),
      height: Math.round(height),
    }
  })

export function watchConsole(page: Page) {
  const complaints: string[] = []

  page.on('console', (message) => {
    const shouted = message.type() === 'error' || /NUXT_E\d+|single root/.test(message.text())
    if (shouted) complaints.push(message.text())
  })
  page.on('pageerror', (error) => complaints.push(String(error)))

  return complaints
}
