export const EDGE = 1.5

export function fitWheel(row: HTMLElement) {
  const last = row.lastElementChild as HTMLElement | null
  if (!last) return

  const peek = Math.min(row.clientWidth * 0.25, 80)

  const base = parseFloat(getComputedStyle(row).fontSize)
  const gap = parseFloat(getComputedStyle(row).columnGap) || 0
  const items = [...row.children] as HTMLElement[]

  const resting = (item: HTMLElement) =>
    item.getBoundingClientRect().width * (base / parseFloat(getComputedStyle(item).fontSize))

  const content = items.reduce((sum, item) => sum + resting(item) + gap, -gap)

  const crowded = content > row.clientWidth * 0.7
  const start = parseFloat(getComputedStyle(row).paddingInlineStart) || 0
  const room = row.clientWidth - peek - resting(last) + start

  const after = `${crowded ? Math.round(Math.max(0, room)) : 0}px`
  if (row.style.paddingInlineEnd !== after) row.style.paddingInlineEnd = after
}

export function placeWheel(row: HTMLElement) {
  const current = row.querySelector<HTMLElement>('.current')
  if (!current) return

  const peek = Math.min(row.clientWidth * 0.25, 80)
  const left = current.getBoundingClientRect().left - row.getBoundingClientRect().left + row.scrollLeft
  row.scrollLeft = left - peek
}

export function markEdges(row: HTMLElement) {
  const hidden = row.scrollWidth - row.clientWidth

  const shown = (by: number) => String(Math.min(1, Math.max(0, by - EDGE) / 40))

  row.style.setProperty('--fade-start', shown(row.scrollLeft))
  row.style.setProperty('--fade-end', shown(hidden - row.scrollLeft))
}
