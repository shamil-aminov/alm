import { readdirSync, readFileSync } from 'node:fs'
import { expect, type Page } from '@playwright/test'
import favorites from '../content/favorite.ts'
import projects from '../content/projects.ts'
import site from '../content/site.ts'

export const SECTIONS = ['/', '/blog', '/projects', '/favorite'] as const

export const SITE = site

export const PROJECTS = projects.length

export const LISTED = site.sections.filter((section) => section.to !== '/')

export const lost = (lang: string) => JSON.parse(
  readFileSync(new URL(`../i18n/locales/${lang}.json`, import.meta.url), 'utf8'),
).lost as string

export const FIRST = site.languages[0]!.code
export const SECOND = site.languages[1]?.code

export const inSecond = (path: string) => `/${SECOND}${path === '/' ? '' : path}`

export const TABS = site.favorite.filter((kind) => favorites.some((card) => card.kind === kind.kind))

export const CARDS = favorites.length

const written = new Map<string, string[]>()
for (const file of readdirSync(new URL('../content/blog', import.meta.url))) {
  const name = file.replace(/\.md$/, '')
  const dot = name.lastIndexOf('.')
  if (dot < 0) continue
  const slug = name.slice(0, dot)
  written.set(slug, [...(written.get(slug) ?? []), name.slice(dot + 1)])
}

export const POSTS = written.size

export const SLUGS = [...written.keys()]

const first = site.languages[0]!.code

export const TRANSLATED = [...written].find(([, langs]) => langs.length === site.languages.length)?.[0]

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

export const holdTheReveal = (page: Page) =>
  page.route('**/*.css', async (route) => {
    const answer = await route.fetch()
    const later = (await answer.text()).replace('--swap:.28s', '--swap:3s')
    await route.fulfill({ response: answer, body: later })
  })

export const holdTheScripts = (page: Page, ms: number) =>
  page.route('**/*.js', async (route) => {
    await new Promise((wake) => setTimeout(wake, ms))
    await route.continue()
  })

export const wheelStill = (page: Page) =>
  expect.poll(() => page.locator('header nav').evaluate((row) =>
    new Promise<boolean>((tell) => {
      const was = row.scrollLeft
      requestAnimationFrame(() => requestAnimationFrame(() => tell(row.scrollLeft === was)))
    })), { message: 'the wheel never came to rest', timeout: 5_000 }).toBe(true)

export async function settled(page: Page) {
  await hydrated(page)
  await expect(page.locator('main')).toHaveCount(1)
  await expect(page.locator('.travel-enter-active, .travel-leave-active')).toHaveCount(0)
  await wheelStill(page)
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
