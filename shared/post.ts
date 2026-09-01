import matter from 'gray-matter'
import type { Post } from './content.ts'

function splitName(fileName: string) {
  const name = fileName.replace(/\.md$/, '')
  const dot = name.lastIndexOf('.')

  if (dot === -1) throw new Error(`No language in «${fileName}»: expected «address.language.md»`)

  return { slug: name.slice(0, dot), lang: name.slice(dot + 1) }
}

function asDay(value: unknown) {
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  return typeof value === 'string' ? value : undefined
}

export function parsePost(fileName: string, text: string): Post {
  const { slug, lang } = splitName(fileName)
  const { data, content } = matter(text)
  const head = data as { title?: string, date?: unknown }

  return { slug, lang, title: head.title, date: asDay(head.date), body: content.trim() }
}
