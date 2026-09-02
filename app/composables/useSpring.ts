import { EDGE } from '~~/shared/wheel'

const REACH = 28
const TIME = 340

export function useSpring(target: Ref<HTMLElement | null>) {
  const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches

  const parts = () => [...(target.value?.children ?? [])] as HTMLElement[]
  const at = (el: HTMLElement) => el.scrollLeft
  const room = (el: HTMLElement) => el.scrollWidth - el.clientWidth
  const atStart = (el: HTMLElement) => at(el) <= EDGE
  const atEnd = (el: HTMLElement) => room(el) - at(el) <= EDGE

  let bouncing = 0
  let pulled = 0

  function shift(by: number) {
    const to = by ? `translateX(${by}px)` : ''
    for (const part of parts()) part.style.transform = to
  }

  function release(from: number) {
    pulled = 0
    if (!from || still()) return shift(0)

    cancelAnimationFrame(bouncing)
    const started = performance.now()

    const step = (now: number) => {
      const k = Math.min(1, (now - started) / TIME)
      shift(k < 1 ? from * (1 - k) * Math.cos(k * Math.PI * 1.2) : 0)
      bouncing = k < 1 ? requestAnimationFrame(step) : 0
    }

    bouncing = requestAnimationFrame(step)
  }

  const give = (by: number) => Math.sign(by) * REACH * (1 - 1 / (1 + Math.abs(by) / 90))

  let holding: number | null = null

  function hold(event: TouchEvent) {
    const touch = event.touches[0]
    holding = touch ? touch.clientX : null
  }

  function pull(event: TouchEvent) {
    const el = target.value
    const touch = event.touches[0]
    if (!el || !touch || still() || holding === null) return

    const by = touch.clientX - holding
    const pulling = (atStart(el) && by > 0) || (atEnd(el) && by < 0)

    if (!pulling) {
      holding = touch.clientX
      if (pulled) release(pulled)
      return
    }

    cancelAnimationFrame(bouncing)
    pulled = give(by)
    shift(pulled)
  }

  const let_go = () => { holding = null; release(pulled) }

  let was = 0
  let when = 0
  let speed = 0

  function watchEdge() {
    const el = target.value
    if (!el) return

    const now = performance.now()
    const moved = (at(el) - was) / Math.max(1, now - when)
    if (moved !== 0) speed = moved
    was = at(el)
    when = now

    const intoStart = atStart(el) && speed < -0.4
    const intoEnd = atEnd(el) && speed > 0.4
    if ((!intoStart && !intoEnd) || pulled) return

    const strength = Math.min(1, Math.abs(speed) / 2.5)
    release(intoEnd ? -REACH * strength : REACH * strength)
    speed = 0
  }

  onMounted(() => {
    const el = target.value
    if (!el) return

    el.addEventListener('touchstart', hold, { passive: true })
    el.addEventListener('touchmove', pull, { passive: true })
    el.addEventListener('touchend', let_go, { passive: true })
    el.addEventListener('touchcancel', let_go, { passive: true })
    el.addEventListener('scroll', watchEdge, { passive: true })

    onBeforeUnmount(() => {
      cancelAnimationFrame(bouncing)
      el.removeEventListener('touchstart', hold)
      el.removeEventListener('touchmove', pull)
      el.removeEventListener('touchend', let_go)
      el.removeEventListener('touchcancel', let_go)
      el.removeEventListener('scroll', watchEdge)
    })
  })
}
