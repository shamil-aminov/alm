import { expect, test } from '@playwright/test'
import { page as build, imagesIn } from '../build/content.ts'
import { bare, stopAt, stops, withoutLang } from '../shared/stops.ts'
import { FIRST, SECOND } from './helpers'

test('a post whose title is its first heading says it once', () => {
  const made = build('a.ru.md', '---\ndate: 2026-08-01\n---\n\n# Имя\n\nТекст\n')
  expect(made.title).toBe('Имя')
  expect(made.opensWithTitle, 'the page cannot tell that the body already shows the title').toBe(true)
  expect(made.html).toContain('<h1>Имя</h1>')

  const titled = build('b.ru.md', '---\ntitle: Имя\ndate: 2026-08-01\n---\n\nТекст\n')
  expect(titled.opensWithTitle, 'a frontmatter title is not in the body').toBe(false)

  const both = build('c.ru.md', '---\ntitle: Из шапки\n---\n\n# Из текста\n\nТело\n')
  expect(both.title, 'the head takes the title from the frontmatter').toBe('Из шапки')
  expect(both.opensWithTitle, 'the page would print a second first-level heading').toBe(true)
  expect(both.excerpt, 'the heading leaked into the excerpt').toBe('Тело')
})

test('an excerpt says every word once and without its markup', () => {
  const list = build('d.ru.md', '---\ntitle: T\n---\n\n- Один\n- Два\n\nХвост\n')
  expect(list.excerpt, 'a list item was counted twice').toBe('Один Два Хвост')

  const code = build('e.ru.md', '---\ntitle: T\n---\n\nТут `код` внутри\n')
  expect(code.excerpt, 'the backticks came along').toBe('Тут код внутри')

  const rich = build('f.ru.md', '---\ntitle: T\n---\n\nОбычный **жирный** и [ссылка](/a) тут\n')
  expect(rich.excerpt).toBe('Обычный жирный и ссылка тут')
})

test('images are found wherever markdown puts them', () => {
  expect(imagesIn('![a](/one.webp)')).toEqual(['/one.webp'])
  expect(imagesIn('текст ![a](/two.webp) ещё'), 'an image inside a line was missed').toEqual(['/two.webp'])
  expect(imagesIn('![a][ref]\n\n[ref]: /three.webp'), 'a reference image was missed').toEqual(['/three.webp'])
  expect(imagesIn('> ![a](/four.webp)'), 'an image inside a quote was missed').toEqual(['/four.webp'])
  expect(imagesIn('no pictures here')).toEqual([])
})

test('an address is read without the language in front of it', () => {
  expect(withoutLang('/de/blog', ['de']), 'the prefix is read from the settings, not from a word in the code').toBe('/blog')
  expect(withoutLang('/de', ['de']), 'a language home did not come out as the home').toBe('/')
  expect(withoutLang('/de/blog', ['fr']), 'a prefix this site does not speak was cut off anyway').toBe('/de/blog')
  expect(withoutLang('/blog', ['de'])).toBe('/blog')
  expect(withoutLang('/', ['de'])).toBe('/')

  expect(bare('/blog')).toBe('/blog')
  expect(bare(`/${FIRST}/blog`), 'the first language has no prefix to strip').toBe(`/${FIRST}/blog`)
  if (SECOND) expect(bare(`/${SECOND}/blog`)).toBe('/blog')
})

test('a section is matched whole, not by the letters it starts with', () => {
  const listed = stops.filter((stop) => stop.to !== '/')
  for (const [at, stop] of stops.entries()) {
    if (stop.to === '/' || stop.kind) continue
    expect(stopAt(stop.to, ''), `${stop.to} landed on another stop`).toBe(at)
    expect(stopAt(`${stop.to}/whatever`, ''), `${stop.to}/whatever left its section`).toBe(at)
    expect(stopAt(`${stop.to}-else`, ''), `${stop.to}-else was taken for ${stop.to}`).not.toBe(at)
  }
  expect(listed.length, 'no sections to check').toBeGreaterThan(0)
})
