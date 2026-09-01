import { bare } from '~/composables/useMotion'
import { stopAt, stops } from '~/utils/content'

// Полосы у краёв отданы системе: на андроиде это жест «назад».
const EDGE = 28
const FAR = 60
const STRAIGHT = 1.6
const PATIENCE = 800

function scrollsSideways(from: Element | null) {
  for (let at = from; at && at !== document.body; at = at.parentElement) {
    const flow = getComputedStyle(at).overflowX
    if ((flow === 'auto' || flow === 'scroll') && at.scrollWidth > at.clientWidth + 1) return true
  }
  return false
}

export function useSwipe() {
  const router = useRouter()
  const route = useRoute()
  const localePath = useLocalePath()

  let start: { x: number, y: number, at: number } | null = null
  const off = () => { start = null }

  // Считается по touch, а не по pointer: как только браузер забирает палец под
  // прокрутку, pointerup не приходит вовсе — вместо него pointercancel.
  function down(event: TouchEvent) {
    const finger = event.touches.length === 1 ? event.touches[0]! : null
    start = null
    if (!finger || finger.clientX < EDGE || finger.clientX > window.innerWidth - EDGE) return
    if (scrollsSideways(event.target as Element)) return
    start = { x: finger.clientX, y: finger.clientY, at: Date.now() }
  }

  function up(event: TouchEvent) {
    const from = start
    const finger = event.changedTouches[0]
    start = null
    if (!from || !finger || Date.now() - from.at > PATIENCE) return

    const across = finger.clientX - from.x
    const along = finger.clientY - from.y
    if (Math.abs(across) < FAR || Math.abs(across) < Math.abs(along) * STRAIGHT) return

    const next = stops[stopAt(bare(route.path), String(route.query.kind ?? '')) + (across < 0 ? 1 : -1)]
    if (next) router.push({ path: localePath(next.to), query: next.kind ? { kind: next.kind } : {} })
  }

  return { down, up, off }
}
