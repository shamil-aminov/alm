import { readdirSync } from 'node:fs'
import { expect, type Page } from '@playwright/test'
import favorites from '../content/favorite.ts'
import projects from '../content/projects.ts'
import site from '../content/site.ts'

export const SECTIONS = ['/', '/blog', '/projects', '/favorite'] as const

export const SITE = site

export const PROJECTS = projects.length

// Вкладки берутся из содержимого, а не из демо: у настоящего сайта их может быть одна,
// и тогда проверять переключение нечего.
export const TABS = site.favorite.filter((kind) => favorites.some((card) => card.kind === kind.kind))

// Какие записи есть и на скольких языках — читается из самих файлов, потому что
// проверять «нет перевода — нет ссылки» можно только на записи, которой правда нет
// на втором языке. У чужого содержимого такой может не оказаться вовсе.
const written = new Map<string, string[]>()
for (const file of readdirSync(new URL('../content/blog', import.meta.url))) {
  const name = file.replace(/\.md$/, '')
  const dot = name.lastIndexOf('.')
  if (dot < 0) continue
  const slug = name.slice(0, dot)
  written.set(slug, [...(written.get(slug) ?? []), name.slice(dot + 1)])
}

const first = site.languages[0]!.code

/** Запись, переведённая на все языки сайта. */
export const TRANSLATED = [...written].find(([, langs]) => langs.length === site.languages.length)?.[0]

/** Запись, которая есть только на первом языке. */
export const ALONE = [...written].find(([, langs]) => langs.length === 1 && langs[0] === first)?.[0]

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
