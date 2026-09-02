import { expect, test } from '@playwright/test'
import { CARDS, holdTheReveal, holdTheScripts, hydrated, inSecond, PROJECTS, SECOND, SECTIONS, settled, stretchTheReveal } from './helpers'

const PHONE = { width: 390, height: 844 }
const DESKTOP = { width: 1440, height: 900 }

test('nothing runs off sideways on a phone', async ({ page }) => {
  await page.setViewportSize(PHONE)

  for (const to of SECTIONS) {
    await page.goto(to)
    await settled(page)

    const extra = await page.evaluate(() => {
      const doc = document.documentElement
      return doc.scrollWidth - doc.clientWidth
    })
    expect(extra, to).toBe(0)
  }
})

test('content starts below the header at every width', async ({ page }) => {
  for (const size of [PHONE, DESKTOP]) {
    await page.setViewportSize(size)

    for (const to of ['/', '/blog', '/projects']) {
      await page.goto(to)
      await settled(page)

      const { header, content } = await page.evaluate(() => ({
        header: document.querySelector('header')!.getBoundingClientRect().bottom,
        content: document.querySelector('main > *')!.getBoundingClientRect().top,
      }))
      expect(content, `${to} at ${size.width}px`).toBeGreaterThanOrEqual(header - 1)
    }
  }
})

test('the edge margin stretches with the window instead of stepping', async ({ page }) => {
  const edgeAt = async (width: number) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/blog')
    await settled(page)
    return page.locator('main').evaluate((el) => parseFloat(getComputedStyle(el).paddingLeft))
  }

  const narrow = await edgeAt(390)
  const middle = await edgeAt(800)
  const wide = await edgeAt(1440)

  expect(narrow).toBeLessThan(middle)
  expect(middle).toBeLessThan(wide)
})

test('on a phone the header is one line and scrolls sideways', async ({ page }) => {
  await page.setViewportSize(PHONE)
  await page.goto('/favorite')
  await settled(page)

  const nav = page.locator('header nav')
  const abreast = await nav.evaluate((el) => {
    const boxes = [...el.querySelectorAll('a')].map((a) => a.getBoundingClientRect())
    return Math.max(...boxes.map((box) => box.top)) < Math.min(...boxes.map((box) => box.bottom))
  })
  expect(abreast, 'the row wrapped onto a second line').toBe(true)

  const shown = await nav.evaluate((el) => {
    const current = el.querySelector('.current')!.getBoundingClientRect()
    const row = el.getBoundingClientRect()
    return current.left >= row.left - 1 && current.right <= row.right + 1
  })
  expect(shown, 'the current section is not pulled into view').toBe(true)

  if (SECOND) {
    const language = await page.locator('header > a').boundingBox()
    expect(language!.x + language!.width).toBeLessThanOrEqual(PHONE.width)
  }
})

test('a narrow cover fits two to a row on a phone, a wide one takes the row', async ({ page }) => {
  test.skip(!CARDS || !PROJECTS, 'this site has no cards to lay out')

  await page.setViewportSize(PHONE)

  const perRow = async (to: string) => {
    await page.goto(to)
    await settled(page)
    return page.locator('main li').first().evaluate((el) => {
      const row = el.getBoundingClientRect()
      const all = [...el.parentElement!.children]
      return all.filter((one) => Math.abs(one.getBoundingClientRect().top - row.top) < 2).length
    })
  }

  expect(await perRow('/favorite?kind=film'), 'a 2:3 poster should pair up').toBe(2)
  expect(await perRow('/projects'), 'a 16:9 cover should take the whole row').toBe(1)
})

test('the wheel turns to the section and leaves the tail of the one before', async ({ page }) => {
  await page.setViewportSize(PHONE)
  const places: number[] = []

  await page.goto(SECTIONS[0]!)
  await settled(page)

  for (const [step, to] of SECTIONS.entries()) {
    if (step > 0) {
      await page.locator(`header nav a[href="${to}"]`).click()
      await settled(page)
      await page.waitForTimeout(900)
    }

    const seen = await page.locator('header nav').evaluate((el) => {
      const row = el.getBoundingClientRect()
      const part = (item: Element) => {
        const box = item.getBoundingClientRect()
        return Math.max(0, Math.min(box.right, row.right) - Math.max(box.left, row.left)) / box.width
      }

      const items = [...el.querySelectorAll('a')]
      const index = items.findIndex((item) => item.classList.contains('current'))
      return {
        current: part(items[index]!),
        previous: index > 0 ? part(items[index - 1]!) : 1,
        place: Math.round(items[index]!.getBoundingClientRect().left - row.left),
      }
    })

    expect(seen.current, `${to}: the section is not fully visible`).toBeGreaterThan(0.95)
    if (step > 0) {
      expect(seen.previous, `${to}: the previous step is not visible`).toBeGreaterThan(0.3)
      places.push(seen.place)
    }
  }

  expect(Math.max(...places) - Math.min(...places), 'the section lands in different places').toBeLessThan(4)
})

test('there is room to scroll past the last section', async ({ page }) => {
  await page.setViewportSize(PHONE)
  await page.goto(SECTIONS.at(-1)!)
  await settled(page)

  const room = await page.locator('header nav').evaluate((el) =>
    parseFloat(getComputedStyle(el).paddingInlineEnd))

  expect(room).toBeGreaterThan(0)
})

test('on a wide screen the row sits at the edge, not in the middle', async ({ page }) => {
  await page.setViewportSize(DESKTOP)
  await page.goto('/favorite')
  await settled(page)

  const scrolls = await page.locator('header nav').evaluate((el) => el.scrollWidth > el.clientWidth)

  expect(scrolls).toBe(false)
})

test('the wheel arrives in one movement, with no rebound', async ({ page }) => {
  await page.setViewportSize(PHONE)
  await page.goto('/')
  await settled(page)

  await page.locator('header nav a[href="/projects"]').click()

  const track: number[] = []
  for (let i = 0; i < 12; i++) {
    track.push(await page.locator('header nav').evaluate((el) =>
      Math.round(el.querySelector('.current')!.getBoundingClientRect().left - el.getBoundingClientRect().left)))
    await page.waitForTimeout(70)
  }

  const settledAt = track.slice(-4)
  expect(Math.max(...settledAt) - Math.min(...settledAt), 'the wheel never came to rest').toBeLessThan(3)

  const rising = track.filter((v, i) => i > 1 && v > track[i - 1]! + 3).length
  expect(rising, 'the word jerks backwards').toBeLessThan(2)
})

test('the wheel behaves the same in either language', async ({ page }) => {
  await page.setViewportSize(PHONE)

  for (const to of ['/blog', ...(SECOND ? [inSecond('/blog')] : [])]) {
    await page.goto(to)
    await settled(page)

    const wheel = await page.locator('header nav').evaluate((el) => ({
      hidden: el.scrollWidth - el.clientWidth,
      place: Math.round(el.querySelector('.current')!.getBoundingClientRect().left - el.getBoundingClientRect().left),
    }))

    expect(wheel.hidden, `${to}: the wheel has no room to turn`).toBeGreaterThan(0)
    expect(wheel.place, `${to}: the section did not land in its place`).toBeGreaterThan(40)
  }
})

test('hydration does not change the height of the header', async ({ page }) => {
  await page.setViewportSize(DESKTOP)
  await page.goto('/blog', { waitUntil: 'domcontentloaded' })

  const before = await page.locator('main > *').first().evaluate((el) => Math.round(el.getBoundingClientRect().top))
  await settled(page)
  const after = await page.locator('main > *').first().evaluate((el) => Math.round(el.getBoundingClientRect().top))

  expect(after, 'content jumped when the page came alive').toBe(before)
})

test('the row stands in place before the page is shown', async ({ page }) => {
  await page.setViewportSize(PHONE)
  await holdTheReveal(page)
  await page.goto('/favorite')
  await hydrated(page)

  const look = () => page.locator('header nav').evaluate((row) => ({
    at: Math.round(row.scrollLeft),
    off: Math.abs(row.querySelector('.current')!.getBoundingClientRect().left
      - row.getBoundingClientRect().left - Math.min(row.clientWidth * 0.25, 80)),
    shown: parseFloat(getComputedStyle(document.querySelector('.arrive')!).opacity),
  }))

  const first = await look()
  expect(first.shown, 'the page was already showing, so this is the other path').toBeLessThan(0.01)
  expect(first.off, 'the row was still on its way when the page came alive').toBeLessThan(1)
  expect(first.at, 'the row never moved, so the check proves nothing').toBeGreaterThan(40)

  await page.waitForTimeout(500)
  expect((await look()).at, 'the row moved after it was placed').toBe(first.at)
})

test('the tab row sits in the faint band, not over bright content', async ({ page }) => {
  test.skip(!CARDS, 'this site has nothing in favorites yet')

  await page.setViewportSize(PHONE)
  await page.goto('/favorite')
  await settled(page)

  const { flat, letters } = await page.locator('[data-scroll="favorite"]').evaluate((el) => {
    const stops = [...getComputedStyle(el).maskImage.matchAll(/([\d.]+)px/g)].map((m) => Number(m[1]))
    const current = document.querySelector('main .choices .current')!
    const box = current.getBoundingClientRect()
    const style = getComputedStyle(current)
    const top = el.getBoundingClientRect().top
    return {
      flat: stops[1]!,
      letters: {
        top: box.top + parseFloat(style.paddingBlockStart) - top,
        bottom: box.bottom - parseFloat(style.paddingBlockEnd) - top,
      },
    }
  })

  expect(flat, 'the fog breaks away from the letters').toBeGreaterThan(letters.top)
  expect(flat, 'the fog breaks away from the letters').toBeLessThanOrEqual(letters.bottom)
})

test('showcase rows do not stretch to the height of the window', async ({ page }) => {
  test.skip(!CARDS, 'this site has nothing in favorites yet')

  await page.setViewportSize(DESKTOP)
  await page.goto('/favorite?kind=game')
  await settled(page)

  const { gap, rows } = await page.locator('main ul').evaluate((el) => {
    const cards = [...el.querySelectorAll('li')].map((li) => li.getBoundingClientRect())
    const first = cards[0]!
    const below = cards.find((box) => box.top > first.top + 10)
    return { gap: below ? below.top - first.bottom : 0, rows: parseFloat(getComputedStyle(el).rowGap) }
  })

  expect(gap, 'the rows drifted apart').toBeCloseTo(rows, 0)
})

test('the finger outranks the wheel: touch the row and the turn stops', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'real touch needs CDP')
  await page.setViewportSize(PHONE)

  await page.goto('/')
  await settled(page)
  await page.locator('header nav a[href="/favorite"]').click()
  await page.waitForTimeout(120)

  const row = (await page.locator('header nav').boundingBox())!
  const y = row.y + row.height / 2
  const touch = await page.context().newCDPSession(page)

  await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: row.x + 300, y }] })
  for (const dx of [30, 60, 90, 120]) {
    await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: row.x + 300 - dx, y }] })
    await page.waitForTimeout(30)
  }
  await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })

  const at = () => page.locator('header nav').evaluate((el) => Math.round(el.scrollLeft))
  const moved = await at()
  await page.waitForTimeout(600)

  expect(await at(), 'the wheel dragged the row back').toBe(moved)
})

test('the row answers a hit against the edge with a spring', async ({ page }) => {
  await page.setViewportSize(PHONE)
  await page.goto('/')
  await settled(page)

  await page.locator('header nav').evaluate((row) => {
    let x = 0
    const push = () => {
      x += 70
      row.scrollLeft = x
      if (x < 400) requestAnimationFrame(push)
    }
    push()
  })

  const shift = () => page.locator('header nav a').first()
    .evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m41)

  const seen: number[] = []
  for (let i = 0; i < 10; i++) {
    seen.push(await shift())
    await page.waitForTimeout(45)
  }

  expect(Math.max(...seen.map(Math.abs)), 'the row does not spring').toBeGreaterThan(5)

  await page.waitForTimeout(500)
  expect(await shift(), 'the spring did not come back').toBe(0)
})

test('the row springs even where the scroll has nowhere to go', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'real touch needs CDP')
  await page.setViewportSize(PHONE)

  await page.goto('/')
  await settled(page)

  const row = (await page.locator('header nav').boundingBox())!
  const y = row.y + row.height / 2
  const from = row.x + row.width / 2
  const touch = await page.context().newCDPSession(page)

  const shift = () => page.locator('header nav a').first()
    .evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m41)

  await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: from, y }] })
  const pulled: number[] = []
  for (const step of [20, 45, 75, 110]) {
    await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: from + step, y }] })
    await page.waitForTimeout(35)
    pulled.push(await shift())
  }
  await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })

  expect(pulled.at(-1)!, 'the row did not give').toBeGreaterThan(8)
  expect(pulled.at(-1)!, 'the row went past its limit').toBeLessThan(30)
  expect(pulled.at(-1)! - pulled.at(-2)!, 'it pulls without easing off').toBeLessThan(pulled[1]! - pulled[0]!)

  await page.waitForTimeout(600)
  expect(await shift(), 'the spring did not come back').toBe(0)
})

test('the pull is measured from the edge, not from the start of the touch', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'real touch needs CDP')
  await page.setViewportSize(PHONE)

  await page.goto('/')
  await settled(page)

  const row = (await page.locator('header nav').boundingBox())!
  const y = row.y + row.height / 2
  const from = row.x + row.width - 30
  const touch = await page.context().newCDPSession(page)

  const shift = () => page.locator('header nav a').first()
    .evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m41)

  await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: from, y }] })
  const seen: number[] = []
  for (const step of [40, 90, 150, 200, 240, 280, 330]) {
    await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: from - step, y }] })
    await page.waitForTimeout(30)
    seen.push(await shift())
  }
  await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })

  const pulled = seen.filter((by) => by !== 0)
  expect(pulled.length, 'the row did not give at the edge').toBeGreaterThan(2)
  expect(Math.abs(pulled.at(-1)!), 'the pull does not grow: it saturated at once')
    .toBeGreaterThan(Math.abs(pulled[0]!) + 2)

  await page.waitForTimeout(600)
  expect(await shift(), 'the spring did not come back').toBe(0)
})

test('the edge counts even when the scroll falls a pixel short of it', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'real touch needs CDP')
  await page.setViewportSize(PHONE)

  await page.goto('/')
  await settled(page)

  await page.locator('header nav').evaluate((row) => {
    const real = row.scrollWidth
    Object.defineProperty(row, 'scrollWidth', { get: () => real + 1 })
    row.scrollLeft = 1e6
  })

  const row = (await page.locator('header nav').boundingBox())!
  const y = row.y + row.height / 2
  const from = row.x + row.width - 30
  const touch = await page.context().newCDPSession(page)

  const shift = () => page.locator('header nav a').first()
    .evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m41)

  await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: from, y }] })
  const seen: number[] = []
  for (const step of [20, 50, 90, 130]) {
    await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: from - step, y }] })
    await page.waitForTimeout(35)
    seen.push(await shift())
  }
  await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })

  expect(Math.abs(seen.at(-1)!), 'the row did not give at the edge').toBeGreaterThan(8)

  await page.waitForTimeout(600)
  expect(await shift(), 'the spring did not come back').toBe(0)
})

test('late hydration turns the wheel instead of throwing it into place', async ({ page }) => {
  await page.setViewportSize(PHONE)

  await stretchTheReveal(page)
  await holdTheScripts(page, 700)

  await page.addInitScript(() => {
    ;(window as unknown as { seen: number[][] }).seen = []
    const watch = () => {
      const row = document.querySelector('header nav')
      const shown = document.querySelector('.arrive')
      if (!row || !shown) return requestAnimationFrame(watch)
      const tick = () => {
        ;(window as unknown as { seen: number[][] }).seen.push([
          Math.round(row.scrollLeft), parseFloat(getComputedStyle(shown).opacity),
        ])
        requestAnimationFrame(tick)
      }
      tick()
    }
    requestAnimationFrame(watch)
  })

  await page.goto('/favorite')
  await settled(page)
  await page.waitForTimeout(2500)

  const seen = await page.evaluate(() => (window as unknown as { seen: number[][] }).seen)
  expect(seen.at(-1)![0]!, 'the wheel did not reach the section').toBeGreaterThan(50)

  const half = seen.filter(([, opacity]) => opacity! > 0.01 && opacity! < 0.99)
  expect(half.length, 'hydration did not land in the middle of the reveal').toBeGreaterThan(3)

  const rest = seen.at(-1)![0]!
  const jumps = seen
    .map(([at, opacity], i) => {
      const was = seen[i - 1]?.[0] ?? at!
      return { by: Math.abs(at! - was), left: Math.abs(rest - was), opacity: opacity! }
    })
    .filter(({ by, left, opacity }) => opacity > 0.01 && by > 8 && by > left * 0.4)

  expect(jumps, 'the wheel jumped in plain sight').toEqual([])
})

test('with motion off a section swaps without a stretch of empty screen', async ({ page }) => {
  await page.setViewportSize(PHONE)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await settled(page)
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches),
    'the page was never told to stop moving').toBe(true)

  await page.evaluate(() => {
    ;(window as unknown as { lit: number[] }).lit = []
    const tick = () => {
      const parts = [...document.querySelectorAll('main :is(.staggered), main .stagger > *')]
      const brightest = parts.length
        ? Math.max(...parts.map((part) => parseFloat(getComputedStyle(part).opacity)))
        : 1
      ;(window as unknown as { lit: number[] }).lit.push(brightest)
      requestAnimationFrame(tick)
    }
    tick()
  })

  await page.locator('header nav a[href="/favorite"]').click()
  await page.waitForTimeout(700)

  const lit = await page.evaluate(() => (window as unknown as { lit: number[] }).lit)
  expect(lit.length, 'nothing was sampled').toBeGreaterThan(20)

  const dark = lit.filter((at) => at === 0).length
  expect(dark, 'the reader was left looking at nothing').toBeLessThan(5)
})
