import { expect, test } from '@playwright/test'
import { checkContent } from '../shared/check.ts'
import { byDate, nextLang, say } from '../shared/content.ts'
import { parsePost } from '../shared/post.ts'

test.describe('post frontmatter', () => {
  test('Windows line endings do not hide the title', () => {
    const post = parsePost('a.ru.md', '---\r\ntitle: Заголовок\r\ndate: 2026-08-01\r\n---\r\n\r\nТекст\r\n')
    expect(post.title).toBe('Заголовок')
    expect(post.date).toBe('2026-08-01')
    expect(post.body).toBe('Текст')
  })

  test('a date arrives as a string, not an object', () => {
    const post = parsePost('a.ru.md', '---\ndate: 2026-08-01\n---\n\nТекст\n')
    expect(typeof post.date).toBe('string')
  })

  test('a dot in the address is not a language', () => {
    const post = parsePost('v1.2.ru.md', '---\ntitle: X\n---\n\nТ\n')
    expect(post.slug).toBe('v1.2')
    expect(post.lang).toBe('ru')
  })

  test('a file without frontmatter stays text all through', () => {
    const post = parsePost('a.ru.md', '# Просто текст\n')
    expect(post.title).toBeUndefined()
    expect(post.body).toBe('# Просто текст')
  })

  test('a name without a language is an error, not a guess', () => {
    expect(() => parsePost('readme.md', 'текст')).toThrow(/No language/)
  })
})

test.describe('the language switch', () => {
  const THREE = [{ code: 'ru' }, { code: 'en' }, { code: 'de' }]

  test('offers the next language and comes back round', () => {
    expect(nextLang(THREE, 'ru')?.code).toBe('en')
    expect(nextLang(THREE, 'en')?.code).toBe('de')
    expect(nextLang(THREE, 'de')?.code).toBe('ru')
  })

  test('skips a language the page does not exist in', () => {
    const has = (code: string) => code !== 'en'
    expect(nextLang(THREE, 'ru', has)?.code, 'stopped at the missing one').toBe('de')
  })

  test('a lone language has nowhere to switch to', () => {
    expect(nextLang([{ code: 'en' }], 'en')).toBeUndefined()
  })

  test('no reachable language means no switch at all', () => {
    expect(nextLang(THREE, 'ru', () => false)).toBeUndefined()
  })
})

test.describe('a string in two languages', () => {
  test('a plain string is the same in every language', () => {
    expect(say('GitHub', 'ru')).toBe('GitHub')
    expect(say('GitHub', 'en')).toBe('GitHub')
  })

  test('a missing translation falls back to the original, never to a hole', () => {
    expect(say({ ru: 'Книги' }, 'en'), 'left an empty space instead of the original').toBe('Книги')
  })

  test('nothing at all is an empty string, not a crash', () => {
    expect(say(undefined, 'en')).toBe('')
  })
})

test.describe('order of posts', () => {
  test('the newest comes first', () => {
    const posts = [{ date: '2026-01-01' }, { date: '2026-08-01' }, { date: '2026-04-01' }]
    expect(posts.sort(byDate).map((p) => p.date)).toEqual(['2026-08-01', '2026-04-01', '2026-01-01'])
  })

  test('a post without a date sinks to the bottom', () => {
    const posts = [{ date: undefined }, { date: '2026-01-01' }]
    expect(posts.sort(byDate)[0]!.date, 'a dateless post floated to the top').toBe('2026-01-01')
  })
})

test.describe('what the build refuses to publish', () => {
  const whole = {
    languages: ['ru', 'en'],
    kinds: ['film'],
    present: (src: string) => src === '/demo.webp',
    images: [{ where: 'favorite.ts', src: '/demo.webp' }],
    posts: [{ file: 'a.ru.md', lang: 'ru', date: '2026-08-01' }],
    cards: [{ where: 'favorite.ts', kind: 'film' }],
  }

  test('healthy content has nothing to say', () => {
    expect(checkContent(whole)).toEqual([])
  })

  test('an image that is not there', () => {
    const said = checkContent({ ...whole, images: [{ where: 'favorite.ts', src: '/gone.webp' }] })
    expect(said.join(' ')).toContain('/gone.webp')
  })

  test('an address in a bucket is nobody business of ours', () => {
    const far = [{ where: 'favorite.ts', src: 'https://bucket/cover.webp' }]
    expect(checkContent({ ...whole, images: far }), 'a remote address was checked on disk').toEqual([])
  })

  test('a language the site does not have', () => {
    const said = checkContent({ ...whole, posts: [{ file: 'a.de.md', lang: 'de' }] })
    expect(said.join(' ')).toContain('never shown')
  })

  test('a date written the human way', () => {
    const said = checkContent({ ...whole, posts: [{ file: 'a.ru.md', lang: 'ru', date: '01.08.2026' }] })
    expect(said.join(' ')).toContain('YYYY-MM-DD')
  })

  test('a card of a kind that has no tab', () => {
    const said = checkContent({ ...whole, cards: [{ where: 'favorite.ts', kind: 'movie' }] })
    expect(said.join(' ')).toContain('no tab')
  })
})
