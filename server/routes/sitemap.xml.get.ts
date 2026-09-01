import { sitemap } from '../utils/map.ts'

export default defineEventHandler((event) => {
  setHeader(event, 'content-type', 'application/xml; charset=utf-8')
  return sitemap()
})
