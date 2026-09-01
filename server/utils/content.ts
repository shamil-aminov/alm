import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import config from '../../content/site.ts'
import { byDate, type Post } from '../../shared/content.ts'
import { parsePost } from '../../shared/post.ts'

const BLOG = join(process.cwd(), 'content/blog')

function readBlog(): Post[] {
  let names: string[] = []
  try {
    names = readdirSync(BLOG)
  } catch {
    return []
  }

  return names
    .filter((name) => name.endsWith('.md'))
    .map((name) => parsePost(name, readFileSync(join(BLOG, name), 'utf8')))
    .sort(byDate)
}

const all = readBlog()

export const posts = (lang: string) => all.filter((post) => post.lang === lang)
export const site = config
export const languages = config.languages
