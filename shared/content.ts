export type Localized = string | Record<string, string>

export type Lang = {
  code: string
  tag?: string
  label: string
}

export type Section = {
  to: string
  label: Localized
}

export type Kind = {
  kind: string
  label: Localized
  ratio?: string
}

export type Site = {
  name: Localized
  tagline?: Localized
  url: string
  ogImage?: string
  languages: Lang[]
  sections: Section[]
  favorite: Kind[]
}

export type Favorite = {
  kind: string
  title?: Localized
  author?: Localized
  cover?: string
}

export type Project = {
  title?: Localized
  cover?: string
  github?: string
  post?: string
}

export type Post = {
  slug: string
  lang: string
  title?: string
  date?: string
  body: string
}

export type Page = {
  slug: string
  lang: string
  title: string
  date?: string
  excerpt: string
  html: string
}

export function say(value: Localized | undefined, lang: string): string {
  if (value === undefined) return ''
  if (typeof value === 'string') return value

  return value[lang] ?? Object.values(value)[0] ?? ''
}

export function byDate(a: { date?: string }, b: { date?: string }) {
  return (b.date ?? '').localeCompare(a.date ?? '')
}

export function nextLang<T extends Lang>(languages: T[], current: string, has?: (code: string) => boolean) {
  const at = languages.findIndex((l) => l.code === current)
  const rotation = [...languages.slice(at + 1), ...languages.slice(0, at)]

  return rotation.find((l) => !has || has(l.code))
}
