import { expect, test } from '@playwright/test'
import { SECTIONS, direction, go, settled, watchConsole } from './helpers'

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
    await expect(tab).toHaveText('Фильмы')

    await page.locator('header a[href^="/en"]').click()

    await page.waitForTimeout(80)
    await expect(tab).toHaveText('Фильмы')

    await settled(page)
    await expect(page.locator('main button').first()).toHaveText('Films')
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

    const top = () => page.evaluate(() => {
      const li = document.querySelector('main li')
      const box = li?.getBoundingClientRect()
      return box?.height ? Math.round(box.top) : null
    })

    const before = await top()
    expect(before).not.toBeNull()

    await page.locator('header nav a[href="/favorite"]').click()
    for (let i = 0; i < 5; i++) {
      await page.waitForTimeout(40)
      const now = await top()
      if (now === null) break
      expect(now).toBe(before)
    }
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
    await page.goto('/favorite')
    await settled(page)

    await page.locator('main button', { hasText: 'музыка' }).click()
    await expect(page).toHaveURL(/\?kind=music/)
    await expect(page.locator('main li p').first()).toHaveText('Альбом 1')

    await page.goBack()
    await expect(page).toHaveURL(/\/favorite$/)
    await expect(page.locator('main li p').first()).toHaveText('Фильм 1')

    await page.goto('/favorite?kind=book')
    await settled(page)
    await expect(page.locator('main li p').first()).toHaveText('Книга 1')
  })

  test('a tab switches the content, not just the highlight', async ({ page }) => {
    const bad = watchConsole(page)
    await page.goto('/favorite')
    await settled(page)

    const cards = page.locator('main li')
    await expect(cards.first().locator('p').first()).toHaveText('Фильм 1')

    await page.locator('main button', { hasText: 'музыка' }).click()
    await expect(page.locator('main button', { hasText: 'музыка' })).toHaveClass(/current/)
    await expect(cards.first().locator('p').first()).toHaveText('Альбом 1')
    await expect(cards).toHaveCount(8)
    expect(bad).toEqual([])
  })

  test('a section stays alive after clicking through its tabs', async ({ page }) => {
    const bad = watchConsole(page)
    await page.goto('/favorite')
    await settled(page)

    const tabs = page.locator('main button')
    await tabs.nth(1).click()
    await tabs.nth(2).click()
    await tabs.nth(0).click()

    await go(page, '/projects')
    await expect(page.locator('main li')).toHaveCount(8)
    expect(bad).toEqual([])
  })
})
