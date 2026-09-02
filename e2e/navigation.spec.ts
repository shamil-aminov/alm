import { expect, test } from '@playwright/test'
import { say } from '../shared/content.ts'
import { FIRST, PROJECTS, SECOND, SECTIONS, TABS, direction, go, settled, watchConsole } from './helpers'

test.describe('travel between sections', () => {
  test('it goes where the eye goes along the header', async ({ page }) => {
    await page.goto('/blog')
    await settled(page)

    await go(page, '/projects')
    expect(await direction(page)).toBe(1)

    await go(page, '/blog')
    expect(await direction(page)).toBe(-1)
  })

  test('into a post rightwards, out of it leftwards', async ({ page }) => {
    await page.goto('/blog')
    await settled(page)

    await page.locator('main a[href^="/blog/"]').first().click()
    await expect(page).toHaveURL(/\/blog\/[^/]+$/)
    await settled(page)
    expect(await direction(page)).toBe(1)

    await page.goBack()
    await expect(page).toHaveURL(/\/blog$/)
    await settled(page)
    expect(await direction(page)).toBe(-1)
  })

  test('the language changes with the page, not before it', async ({ page }) => {
    await page.goto('/favorite')
    await settled(page)

    const tab = page.locator('main button').first()
    await expect(tab).toHaveText(say(TABS[0]!.label, FIRST))

    await page.locator('header a[href^="/en"]').click()

    await page.waitForTimeout(80)
    await expect(tab).toHaveText(say(TABS[0]!.label, FIRST))

    await settled(page)
    await expect(page.locator('main button').first()).toHaveText(say(TABS[0]!.label, SECOND!))
  })

  test('switching language does not move the page: it is the same page', async ({ page }) => {
    await page.goto('/blog')
    await settled(page)

    await page.locator('header a[href^="/en"]').click()
    await expect(page).toHaveURL(/\/en\/blog/)

    await expect(page.locator('.h-dvh')).toHaveClass(/in-place/)
    await settled(page)
    await expect(page.locator('main')).toBeVisible()
  })

  test('the outgoing page stays put while it leaves', async ({ page }) => {
    await page.goto('/projects')
    await settled(page)

    const leaving = (await page.locator('main li').first().elementHandle())!
    const top = () => leaving.evaluate((el) => {
      const box = el.getBoundingClientRect()
      return box.height ? Math.round(box.top) : null
    })

    const before = await top()
    expect(before).not.toBeNull()

    await page.locator('header nav a[href="/favorite"]').click()
    let seen = 0
    for (let i = 0; i < 5; i++) {
      await page.waitForTimeout(40)
      const now = await top()
      if (now === null) break
      expect(now).toBe(before)
      seen++
    }
    expect(seen, 'the page was already gone at the first look').toBeGreaterThan(0)
  })
})

test.describe('scroll', () => {
  test('through the header from the top, with the back button back into place', async ({ page }) => {
    await page.goto('/favorite')
    await settled(page)

    const grid = page.locator('[data-scroll="favorite"]')
    await grid.evaluate((el) => { el.scrollTop = 300 })
    expect(await grid.evaluate((el) => el.scrollTop)).toBe(300)

    await go(page, '/projects')
    expect(await page.locator('[data-scroll="page"]').evaluate((el) => el.scrollTop)).toBe(0)

    await page.goBack()
    await settled(page)
    expect(await page.locator('[data-scroll="favorite"]').evaluate((el) => el.scrollTop)).toBe(300)

    await go(page, '/blog')
    await go(page, '/favorite')
    expect(await page.locator('[data-scroll="favorite"]').evaluate((el) => el.scrollTop)).toBe(0)
  })
})

test.describe('pages are whole', () => {
  for (const to of SECTIONS) {
    test(`${to} opens without complaining to the console`, async ({ page }) => {
      const bad = watchConsole(page)
      await page.goto(to)
      await settled(page)

      expect(bad).toEqual([])
      await expect(page.locator('main')).toBeVisible()
    })
  }

  test('the whole entry leads into the post, not just its title', async ({ page }) => {
    await page.goto('/blog')
    await settled(page)

    await page.locator('main li p').first().click()
    await expect(page).toHaveURL(/\/blog\/[^/]+$/)
  })

  test('a tab lives in the address: it can be shared and the back button undoes it', async ({ page }) => {
    test.skip(TABS.length < 2, 'this site has one tab, so there is nothing to switch')
    await page.goto('/favorite')
    await settled(page)

    const first = await page.locator('main li p').first().innerText()
    await page.locator('main button').nth(1).click()
    await expect(page).toHaveURL(new RegExp(`\\?kind=${TABS[1]!.kind}`))
    await expect(page.locator('main li p').first()).not.toHaveText(first)

    await page.goBack()
    await expect(page).toHaveURL(/\/favorite$/)
    await expect(page.locator('main li p').first()).toHaveText(first)

    await page.goto(`/favorite?kind=${TABS.at(-1)!.kind}`)
    await settled(page)
    await expect(page.locator('main button').last()).toHaveClass(/current/)
  })

  test('a tab switches the content, not just the highlight', async ({ page }) => {
    test.skip(TABS.length < 2, 'this site has one tab, so there is nothing to switch')
    const bad = watchConsole(page)
    await page.goto('/favorite')
    await settled(page)

    const cards = page.locator('main li')
    const first = await cards.first().locator('p').first().innerText()

    await page.locator('main button').nth(1).click()
    await expect(page.locator('main button').nth(1)).toHaveClass(/current/)
    await expect(cards.first().locator('p').first()).not.toHaveText(first)
    await expect(cards.first()).toBeVisible()
    expect(bad).toEqual([])
  })

  test('a section stays alive after clicking through its tabs', async ({ page }) => {
    const bad = watchConsole(page)
    await page.goto('/favorite')
    await settled(page)

    const tabs = page.locator('main button')
    for (let at = 1; at < Math.min(3, TABS.length); at++) await tabs.nth(at).click()
    await tabs.nth(0).click()

    await go(page, '/projects')
    await expect(page.locator('main li')).toHaveCount(PROJECTS)
    expect(bad).toEqual([])
  })
})
