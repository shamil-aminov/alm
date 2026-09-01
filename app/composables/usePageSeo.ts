import { site } from '~/utils/content'

type Meta = { title?: string, summary?: string, image?: string }

export function usePageSeo(meta: () => Meta) {
  const route = useRoute()
  const base = site.url.replace(/\/$/, '')

  const title = () => meta().title ?? ''
  const description = () => (meta().summary ?? '').slice(0, 200)
  const absolute = (url?: string) => (url?.startsWith('/') ? base + url : url)
  const cover = () => absolute(meta().image ?? site.ogImage)

  useSeoMeta({
    title: () => (title() ? `${title()} — ${site.name}` : site.name),
    description,
    ogTitle: () => title() || site.name,
    ogDescription: description,
    ogSiteName: site.name,
    ogType: () => (title() ? 'article' : 'website'),
    ogUrl: () => base + route.path,
    ogImage: cover,
    twitterCard: () => (cover() ? 'summary_large_image' : 'summary'),
  })
}
