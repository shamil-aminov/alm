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

// Все места сайта одной цепочкой: разделы, а вместо «любимого» — его вкладки.
// По ней считается и сторона перехода, и куда уводит свайп.
export const tabs = kinds.filter((kind) => favorites.some((card) => card.kind === kind.kind))

export const stops = sections.flatMap((section) =>
  section.to === '/favorite' && tabs.length
    ? tabs.map((tab, at) => ({ to: section.to, kind: at ? tab.kind : '' }))
    : [{ to: section.to, kind: '' }])

export function stopAt(path: string, kind: string) {
  const exact = stops.findIndex((stop) => stop.to !== '/' && path.startsWith(stop.to) && stop.kind === kind)
  if (exact >= 0) return exact
  // Незнакомая вкладка: страница показывает первую, и переход должен думать так же.
  return Math.max(0, stops.findIndex((stop) => stop.to !== '/' && path.startsWith(stop.to)))
}

export const sectionName = (to: string, lang: string) =>
  say(sections.find((section) => section.to === to)?.label, lang)
