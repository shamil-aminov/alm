import { languages } from '../utils/content.ts'
import { feed } from '../utils/feed.ts'

export default defineEventHandler((event) => {
  setHeader(event, 'content-type', 'application/rss+xml; charset=utf-8')
  return feed(languages[0]!.code)
})
