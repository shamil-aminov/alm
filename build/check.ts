import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Plugin } from 'vite'
import { checkContent } from '../shared/check.ts'
import { parsePost } from '../shared/post.ts'
import favorites from '../content/favorite.ts'
import projects from '../content/projects.ts'
import site from '../content/site.ts'

const ROOT = join(import.meta.dirname, '..')

function posts() {
  const dir = join(ROOT, 'content/blog')
  const files = existsSync(dir) ? readdirSync(dir).filter((name) => name.endsWith('.md')) : []
  const loose = readdirSync(join(ROOT, 'content')).filter((name) => name.endsWith('.md'))

  return [...files.map((name) => ['blog/' + name, join(dir, name)] as const),
          ...loose.map((name) => [name, join(ROOT, 'content', name)] as const)]
    .map(([file, path]) => {
      const post = parsePost(file.split('/').pop()!, readFileSync(path, 'utf8'))
      return { file: 'content/' + file, lang: post.lang, date: post.date }
    })
}

export function check(): Plugin {
  return {
    name: 'alm:check',
    enforce: 'pre',

    buildStart() {
      const complaints = checkContent({
        languages: site.languages.map((one) => one.code),
        kinds: site.favorite.map((one) => one.kind),
        present: (src) => existsSync(join(ROOT, 'public', src)),
        posts: posts(),
        images: [
          ...(site.ogImage ? [{ where: 'content/site.ts', src: site.ogImage }] : []),
          ...favorites.flatMap((card, at) =>
            card.cover ? [{ where: `content/favorite.ts #${at + 1}`, src: card.cover }] : []),
          ...projects.flatMap((card, at) =>
            card.cover ? [{ where: `content/projects.ts #${at + 1}`, src: card.cover }] : []),
        ],
        cards: favorites.map((card, at) => ({ where: `content/favorite.ts #${at + 1}`, kind: card.kind })),
      })

      if (complaints.length) {
        this.error(`content is broken:\n  ${complaints.join('\n  ')}`)
      }
    },
  }
}
