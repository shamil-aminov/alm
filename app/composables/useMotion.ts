import { sections } from '~/utils/content'

export const useDirection = () => useState('direction', () => 1)

export const useInPlace = () => useState('in-place', () => false)

function locate(path: string) {
  const bare = path.replace(/^\/en(?=\/|$)/, '') || '/'
  return {
    path: bare,
    section: Math.max(0, sections.findIndex((s) => s.to !== '/' && bare.startsWith(s.to))),
    depth: bare.split('/').filter(Boolean).length,
  }
}

export function watchMotion() {
  const direction = useDirection()
  const inPlace = useInPlace()

  return useRouter().beforeEach((to, from) => {
    const was = locate(from.path)
    const now = locate(to.path)

    inPlace.value = was.path === now.path && from.path !== to.path

    direction.value = (now.section === was.section
      ? Math.sign(now.depth - was.depth)
      : Math.sign(now.section - was.section)) || 1

    rememberScroll(from.fullPath, to.fullPath, inPlace.value)
  })
}

const positions = new Map<string, Record<string, number>>()
let pending: Record<string, number> = {}

let wentBack = false
if (import.meta.client) addEventListener('popstate', () => { wentBack = true })

const scrollers = () => [...document.querySelectorAll<HTMLElement>('[data-scroll]')]
const positionsNow = () => Object.fromEntries(scrollers().map((el) => [el.dataset.scroll!, el.scrollTop]))

export function rememberScroll(from: string, to: string, inPlace: boolean) {
  if (!import.meta.client) return

  positions.set(from, positionsNow())
  pending = inPlace ? positionsNow() : wentBack ? positions.get(to) ?? {} : {}
  wentBack = false
}

export function restoreScroll() {
  for (const el of scrollers()) el.scrollTop = pending[el.dataset.scroll!] ?? 0
}
