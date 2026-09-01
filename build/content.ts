import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { imageSize } from 'image-size'
import { Marked, type Token, type Tokens } from 'marked'
import type { Plugin } from 'vite'
import type { Page } from '../shared/content.ts'
import { parsePost } from '../shared/post.ts'

const PUBLIC = join(import.meta.dirname, '../public')

const escape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

const isDangerous = (href: string) => /^\s*(javascript|data|vbscript):/i.test(href)

function sizeOf(src: string) {
  if (!src.startsWith('/')) return ''

  try {
    const { width, height } = imageSize(readFileSync(join(PUBLIC, src)))
    return ` width="${width}" height="${height}"`
  } catch {
    return ''
  }
}

const markdown = new Marked({
  renderer: {
    html: () => '',

    image({ href, text }) {
      if (isDangerous(href)) return ''
      return `<img src="${escape(href)}" alt="${escape(text)}"${sizeOf(href)} loading="lazy">`
    },

    link({ href, tokens }) {
      const text = this.parser.parseInline(tokens)
      if (isDangerous(href)) return text
      return `<a href="${escape(href)}">${text}</a>`
    },
  },
})

function plainText(tokens: Token[]) {
  const words: string[] = []

  markdown.walkTokens(tokens, (token) => {
    if (token.type === 'text' || token.type === 'codespan') words.push(token.raw)
  })

  return words.join(' ').replace(/\s+/g, ' ').trim()
}

function page(fileName: string, text: string): Page {
  const post = parsePost(fileName, text)
  const tokens = markdown.lexer(post.body)

  const [opening] = tokens
  const heading = !post.title && opening?.type === 'heading' ? opening as Tokens.Heading : undefined
  const rest = heading ? tokens.slice(1) : tokens

  return {
    slug: post.slug,
    lang: post.lang,
    title: post.title ?? heading?.text ?? '',
    date: post.date,
    excerpt: plainText(rest).slice(0, 300),
    html: markdown.parser(tokens),
  }
}

export function content(): Plugin {
  return {
    name: 'alm:content',
    enforce: 'pre',

    transform(code, id) {
      const path = id.split('?')[0]!
      if (!path.includes('/content/') || !path.endsWith('.md')) return

      const fileName = path.split('/').pop()!
      return { code: `export default ${JSON.stringify(page(fileName, code))}`, map: null }
    },
  }
}
