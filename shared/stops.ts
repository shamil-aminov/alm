import favorites from '../content/favorite.ts'
import site from '../content/site.ts'

export const tabs = site.favorite.filter((kind) => favorites.some((card) => card.kind === kind.kind))

export const stops = site.sections.flatMap((section) =>
  section.to === '/favorite' && tabs.length
    ? tabs.map((tab, at) => ({ to: section.to, kind: at ? tab.kind : '' }))
    : [{ to: section.to, kind: '' }])

const prefixes = site.languages.slice(1).map((language) => language.code)

export function withoutLang(path: string, langs: string[]) {
  const head = path.split('/')[1] ?? ''
  return langs.includes(head) ? path.slice(head.length + 1) || '/' : path
}

export const bare = (path: string) => withoutLang(path, prefixes)

const under = (path: string, to: string) => path === to || path.startsWith(to + '/')

export function stopAt(path: string, kind: string) {
  const exact = stops.findIndex((stop) => stop.to !== '/' && under(path, stop.to) && stop.kind === kind)
  if (exact >= 0) return exact
  return Math.max(0, stops.findIndex((stop) => stop.to !== '/' && under(path, stop.to)))
}
