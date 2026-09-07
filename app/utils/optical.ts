const BIG = 'main :is(.big, .post h1)'
const BODY = 'main :is(.post p, .fade-out p, p)'
const NOTICEABLE = .5

let pen: CanvasRenderingContext2D | undefined

function bearing(el: Element | null) {
  const text = el?.textContent?.trim()
  if (!el || !text) return 0

  pen ??= document.createElement('canvas').getContext('2d') ?? undefined
  if (!pen) return 0

  const style = getComputedStyle(el)
  pen.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`

  return -pen.measureText(text).actualBoundingBoxLeft
}

export function alignOptically() {
  const heads = document.querySelectorAll<HTMLElement>(BIG)
  if (!heads.length) return

  const column = bearing(document.querySelector(BODY))

  for (const head of heads) {
    const shift = bearing(head) - column
    head.style.marginInlineStart = shift > NOTICEABLE ? `${-shift}px` : ''
  }
}
