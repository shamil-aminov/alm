import favorites from '~~/content/favorite'
import projects from '~~/content/projects'
import site from '~~/content/site'
import { byDate, say, type Page } from '~~/shared/content'

const files = import.meta.glob<Page>('../../content/**/*.md', { import: 'default', eager: true })
const pages = Object.entries(files).map(([path, page]) => ({ ...page, isPost: path.includes('/blog/') }))

export { favorites, projects, say, site }
export const { languages, sections } = site
export const kinds = site.favorite

export const posts = (lang: string) =>
  pages.filter((page) => page.isPost && page.lang === lang).sort(byDate)

export const post = (slug: string, lang: string) =>
  pages.find((page) => page.isPost && page.slug === slug && page.lang === lang)

export const homePage = (lang: string) =>
  pages.find((page) => !page.isPost && page.slug === 'home' && page.lang === lang)

export const sectionName = (to: string, lang: string) =>
  say(sections.find((section) => section.to === to)?.label, lang)
