<script setup lang="ts">
const { as = 'div', wheel = false } = defineProps<{ as?: string, wheel?: boolean }>()

import { fitWheel, markEdges as markRowEdges, placeWheel } from '~~/shared/wheel'

const route = useRoute()
const el = useTemplateRef<HTMLElement>('row')

useSpring(el)
const choices = () => [...(el.value?.children ?? [])] as HTMLElement[]

const REACH = 24

const REACH_DOWN = 8

function lettersOf(choice: HTMLElement) {
  const box = choice.getBoundingClientRect()
  const style = getComputedStyle(choice)
  return {
    left: box.left,
    right: box.right,
    top: box.top + parseFloat(style.paddingBlockStart),
    bottom: box.bottom - parseFloat(style.paddingBlockEnd),
  }
}

function distanceTo(choice: HTMLElement, x: number, y: number) {
  const box = lettersOf(choice)
  const dy = Math.max(box.top - y, 0, y - box.bottom)
  if (dy > REACH_DOWN) return Infinity

  return Math.max(box.left - x, 0, x - box.right)
}

function hovered(x: number, y: number) {
  const all = choices()
  const distance = (choice: HTMLElement) => distanceTo(choice, x, y)

  const held = all.find((choice) => choice.hasAttribute('data-hover'))
  if (held && distance(held) === 0) return held

  const nearest = all.reduce((a, b) => (distance(b) < distance(a) ? b : a), all[0]!)
  return nearest && distance(nearest) <= REACH ? nearest : null
}

function track(event: PointerEvent) {
  if (event.pointerType !== 'mouse' || !choices().length) return

  const near = hovered(event.clientX, event.clientY)
  for (const choice of choices()) choice.toggleAttribute('data-hover', choice === near)
  el.value?.classList.toggle('hovering', !!near)
}

const peek = (row: HTMLElement) => Math.min(row.clientWidth * 0.25, 80)

const CHASE = 0.13

const LIMIT = 2000

let chasing = 0

function markFor(row: HTMLElement) {
  const items = choices()
  const index = items.findIndex((choice) => choice.classList.contains('current'))
  if (index < 0) return null

  const style = getComputedStyle(row)
  const base = parseFloat(style.fontSize)
  const gap = parseFloat(style.columnGap) || 0

  let left = parseFloat(style.paddingInlineStart) || 0
  for (const item of items.slice(0, index)) {
    const size = parseFloat(getComputedStyle(item).fontSize)
    left += item.getBoundingClientRect().width * (base / size) + gap
  }

  return Math.max(0, Math.min(left - peek(row), row.scrollWidth - row.clientWidth))
}

function showCurrent(smoothly = true) {
  const row = el.value
  if (!row) return

  cancelAnimationFrame(chasing)
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches

  if (!smoothly || still) {
    const mark = markFor(row)
    if (mark !== null) row.scrollLeft = mark
    return
  }

  const until = performance.now() + LIMIT
  let was = NaN

  const chase = (now: number) => {
    if (row) fitWheel(row)
    const mark = markFor(row)
    if (mark === null) return

    const left = mark - row.scrollLeft
    const caught = Math.abs(left) < 0.5
    const steady = Math.abs(mark - was) < 0.5
    was = mark

    if (caught) row.scrollLeft = mark
    else row.scrollLeft += left * CHASE
    placed = row.scrollLeft

    chasing = (caught && steady) || now > until ? 0 : requestAnimationFrame(chase)
  }

  chasing = requestAnimationFrame(chase)
}

let placed = 0

function underDarkness() {
  const page = el.value?.closest('.arrive')
  return !!page && parseFloat(getComputedStyle(page).opacity) < 0.01
}

onBeforeUnmount(() => cancelAnimationFrame(chasing))
onMounted(() => {
  if (el.value && wheel) {
    fitWheel(el.value)
    if (underDarkness()) {
      placeWheel(el.value)
      placed = el.value.scrollLeft
    } else {
      showCurrent()
    }
  }
  if (el.value) markRowEdges(el.value)

  addEventListener('pointermove', track, { passive: true })
  onBeforeUnmount(() => removeEventListener('pointermove', track))

  let width = 0

  const watchSize = new ResizeObserver(() => {
    const row = el.value
    if (chasing || !row) return

    const resized = row.clientWidth !== width
    width = row.clientWidth

    if (wheel) {
      fitWheel(row)
      if (resized && row.scrollLeft === placed) placeWheel(row)
      placed = row.scrollLeft
    }
    markRowEdges(row)
  })
  if (el.value) watchSize.observe(el.value)
  onBeforeUnmount(() => watchSize.disconnect())
})
watch(() => route.fullPath, () => {
  if (!wheel || !el.value) return

  fitWheel(el.value)
  showCurrent()
}, { flush: 'post' })

function onScroll() {
  if (el.value) markRowEdges(el.value)
}

function takeOver() {
  cancelAnimationFrame(chasing)
  chasing = 0
  placed = -1
}
</script>

<template>
  <component :is="as" ref="row" class="choices"
             @pointerdown.passive="takeOver" @wheel.passive="takeOver"
             @touchstart.passive="takeOver" @scroll.passive="onScroll">
    <slot />
  </component>
</template>
