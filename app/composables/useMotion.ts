import { bare, stopAt } from '~/utils/content'

export const useDirection = () => useState('direction', () => 1)

export const useInPlace = () => useState('in-place', () => false)

function locate(route: { path: string, query: Record<string, unknown> }) {
  const path = bare(route.path)
  return {
    path,
    stop: stopAt(path, String(route.query.kind ?? '')),
    depth: path.split('/').filter(Boolean).length,
  }
}

export function watchMotion() {
  const direction = useDirection()
  const inPlace = useInPlace()

  return useRouter().beforeEach((to, from) => {
    const was = locate(from)
    const now = locate(to)

    inPlace.value = was.path === now.path && from.path !== to.path

    direction.value = (now.stop === was.stop
      ? Math.sign(now.depth - was.depth)
      : Math.sign(now.stop - was.stop)) || 1

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
