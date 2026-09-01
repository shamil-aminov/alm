export type Complaint = string

export function checkContent(input: {
  languages: string[]
  kinds: string[]
  images: { where: string, src: string }[]
  present: (src: string) => boolean
  posts: { file: string, lang: string, date?: string }[]
  cards: { where: string, kind: string }[]
}): Complaint[] {
  const complaints: Complaint[] = []

  for (const { where, src } of input.images) {
    if (!src.startsWith('/')) continue
    if (!input.present(src)) complaints.push(`${where}: no such image in public — ${src}`)
  }

  for (const { file, lang, date } of input.posts) {
    if (!input.languages.includes(lang)) {
      complaints.push(`${file}: language «${lang}» is not in site.ts, so this file is never shown`)
    }
    if (date !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      complaints.push(`${file}: date «${date}» is not YYYY-MM-DD`)
    }
  }

  for (const { where, kind } of input.cards) {
    if (!input.kinds.includes(kind)) {
      complaints.push(`${where}: kind «${kind}» is not in site.ts, so this card has no tab`)
    }
  }

  return complaints
}
