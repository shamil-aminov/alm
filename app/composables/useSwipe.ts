import { bare, stopAt, stops } from '~/utils/content'

const EDGE = 28
const FAR = 48
const STRAIGHT = 1.6
const PATIENCE = 800

function scrollsSideways(from: Element | null) {
  for (let at = from; at && at !== document.body; at = at.parentElement) {
    const flow = getComputedStyle(at).overflowX
    if (flow === 'auto' || flow === 'scroll') return true
  }
  return false
}

export function useSwipe() {
  const router = useRouter()
  const route = useRoute()
  const localePath = useLocalePath()

  let start: { x: number, y: number, at: number } | null = null
  const off = () => { start = null }

  function down(event: TouchEvent) {
    const finger = event.touches.length === 1 ? event.touches[0]! : null
    start = null
    if (!finger || finger.clientX < EDGE || finger.clientX > window.innerWidth - EDGE) return
    if (scrollsSideways(event.target as Element)) return
    start = { x: finger.clientX, y: finger.clientY, at: Date.now() }
  }

  function move(event: TouchEvent) {
    const from = start
    const finger = event.touches[0]
    if (!from || !finger) return

    if (Date.now() - from.at > PATIENCE) { start = null; return }

    const across = finger.clientX - from.x
    const along = finger.clientY - from.y
    if (Math.abs(across) < FAR || Math.abs(across) < Math.abs(along) * STRAIGHT) return

    start = null
    const next = stops[stopAt(bare(route.path), String(route.query.kind ?? '')) + (across < 0 ? 1 : -1)]
    if (next) router.push({ path: localePath(next.to), query: next.kind ? { kind: next.kind } : {} })
  }

  return { down, move, off }
}
