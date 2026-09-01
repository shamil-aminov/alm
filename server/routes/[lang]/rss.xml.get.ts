import { languages } from '../../utils/content.ts'
import { feed } from '../../utils/feed.ts'

export default defineEventHandler((event) => {
  const lang = getRouterParam(event, 'lang')
  if (!languages.slice(1).some((l) => l.code === lang)) throw createError({ statusCode: 404 })
  setHeader(event, 'content-type', 'application/rss+xml; charset=utf-8')
  return feed(lang!)
})
