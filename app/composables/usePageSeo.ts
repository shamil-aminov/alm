import { say } from '~~/shared/content'
import { languages, site } from '~/utils/content'

type Meta = { title?: string, summary?: string, image?: string }

export function usePageSeo(meta: () => Meta) {
  const route = useRoute()
  const { locale } = useI18n()
  const base = site.url.replace(/\/$/, '')
  const name = () => say(site.name, locale.value)

  const title = () => meta().title ?? ''
  const description = () => (meta().summary ?? '').slice(0, 200)
  const absolute = (url?: string) => (url?.startsWith('/') ? base + url : url)
  const cover = () => absolute(meta().image ?? site.ogImage)

  useHead({
    link: [{
      rel: 'alternate',
      type: 'application/rss+xml',
      href: () => (locale.value === languages[0]!.code ? '/rss.xml' : `/${locale.value}/rss.xml`),
    }],
  })

  useSeoMeta({
    title: () => (title() ? `${title()} — ${name()}` : name()),
    description,
    ogTitle: () => title() || name(),
    ogDescription: description,
    ogSiteName: name,
    ogType: () => (title() ? 'article' : 'website'),
    ogUrl: () => base + route.path,
    ogImage: cover,
    twitterCard: () => (cover() ? 'summary_large_image' : 'summary'),
  })
}
