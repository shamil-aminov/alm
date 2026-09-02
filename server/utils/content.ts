import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { page } from '../../build/content.ts'
import config from '../../content/site.ts'
import { byDate, type Page } from '../../shared/content.ts'

const CONTENT = join(process.cwd(), 'content')
const BLOG = join(CONTENT, 'blog')

function readBlog(): Page[] {
  if (!existsSync(CONTENT)) {
    throw new Error(`no content at ${CONTENT}: the feed and the sitemap are read from files, so this site has to be generated, not served`)
  }
  if (!existsSync(BLOG)) return []

  return readdirSync(BLOG)
    .filter((name) => name.endsWith('.md'))
    .map((name) => page(name, readFileSync(join(BLOG, name), 'utf8')))
    .sort(byDate)
}

const all = readBlog()

export const posts = (lang: string) => all.filter((post) => post.lang === lang)
export const site = config
export const languages = config.languages
