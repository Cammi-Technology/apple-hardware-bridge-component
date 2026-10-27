// Moves things to their new place, instead of jumping, when the layout
// changes: the phone opens into book mode, turns, or a window resizes.
// One helper for every page.
//
// It uses FLIP: measure where everything was (First) and where it is
// now (Last), then slide each element from the old place to the new
// one (Invert, Play) with transform only. That works for any layout
// change: grids, the fold gap, panes appearing, cards reflowing. Things
// that appear fade in.
//
// The timing is the page's motion language, the same as the device
// icon: --duo-move-delay, then --duo-move-duration with --duo-move-ease.
// During the pause everything holds its old place, so a burst of
// changes (the hinge moving, then the fold settling) ends in one move.
//
// Never on the first layout of a page, never while scrolling, never for
// anything off screen, and never with reduced motion.

// What moves: the page's blocks. Nested blocks move relative to the
// block they sit in, so nothing moves twice.
export const MOVING = "header, main, aside, section, article, footer, nav, [data-pane]"

const isOnScreen = (rect, view) => rect.y + rect.height > view.top && rect.y < view.bottom

// first, last: Map of element (or any key) -> { x, y, width, height },
// in page coordinates. parentOf: Map of key -> the nearest moving block
// it sits in. view: { top, bottom, width } of the screen now, and
// firstView the same before the change.
//
// When the screen itself changes, the phone opening from the cover to
// the inner screen or closing again, the cover screen is the right page
// of the open spread. So whatever is on the right page keeps its place
// from the right edge: it barely moves. Whatever is on the left page
// fades in instead of sliding across.
export function planMoves({ first, last, parentOf, view, firstView = view }) {
  const newScreen = Math.abs((firstView.width ?? 0) - (view.width ?? 0)) > 1
  const wideWidth = Math.max(firstView.width ?? 0, view.width ?? 0)
  const status = new Map()
  for (const [key, to] of last) {
    const from = first.get(key)
    if (!from) { status.set(key, { appear: true }); continue }
    if (!newScreen) { status.set(key, { dx: from.x - to.x, dy: from.y - to.y }); continue }
    const wide = (view.width ?? 0) >= (firstView.width ?? 0) ? to : from
    // A block that spans both pages is the frame: it stays, and what is
    // inside it is placed on its own.
    if (wide.width > wideWidth * 0.6) { status.set(key, { dx: 0, dy: 0, frame: true }); continue }
    if (wide.x + wide.width / 2 < wideWidth / 2) { status.set(key, { appear: true }); continue }
    const fromRightGap = firstView.width - (from.x + from.width)
    const oldX = view.width - fromRightGap - from.width
    status.set(key, { dx: oldX - to.x, dy: from.y - to.y })
  }

  const nearest = (key) => {
    let parent = parentOf.get(key)
    while (parent && !status.has(parent)) parent = parentOf.get(parent)
    return parent
  }

  const moves = []
  for (const [key, to] of last) {
    const own = status.get(key)
    const parent = nearest(key)
    const base = parent ? status.get(parent) : null
    // Inside something that fades in: it fades in with it.
    if (base?.appear) continue
    if (own.appear) {
      if (isOnScreen(to, view)) moves.push({ key, appear: true })
      continue
    }
    if (own.frame) continue
    const dx = own.dx - (base?.dx ?? 0)
    const dy = own.dy - (base?.dy ?? 0)
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) continue
    const from = first.get(key)
    if (!isOnScreen(from, view) && !isOnScreen(to, view)) continue
    moves.push({ key, dx: Math.round(dx), dy: Math.round(dy) })
  }
  return moves
}

// The behaviour, with the DOM passed in so it can be tested:
//
//   measure()             -> { rects, parentOf, view }
//   play(moves)           -> { cancel(), finished: Promise }
//   still()               -> true to skip moving (reduced motion, scrolling)
export class LayoutMotion {
  constructor({ measure, play, still = () => false }) {
    this.measure = measure
    this.play = play
    this.still = still
    this.last = null
    this.burstFirst = null
    this.running = null
  }

  // Remember the layout as it is now, without moving anything: on a
  // page's first layout, and after each move ends.
  settle() {
    this.cancel()
    this.burstFirst = null
    this.last = this.measure()
  }

  // The layout has just changed.
  change() {
    if (!this.last || this.still()) return this.settle()
    this.burstFirst ??= this.last
    this.cancel()
    const now = this.measure()
    const moves = planMoves({ first: this.burstFirst.rects, last: now.rects, parentOf: now.parentOf, view: now.view, firstView: this.burstFirst.view })
    this.last = now
    if (!moves.length) return this.settle()
    const run = this.play(moves)
    this.running = run
    run.finished.finally(() => {
      if (this.running !== run) return
      this.running = null
      this.burstFirst = null
    })
  }

  cancel() {
    this.running?.cancel()
    this.running = null
  }
}

// The real page.

function motionValues() {
  const style = getComputedStyle(document.documentElement)
  const ms = (name, fallback) => {
    const value = style.getPropertyValue(name).trim()
    return value ? parseFloat(value) * (value.endsWith("ms") ? 1 : 1000) : fallback
  }
  return {
    delay: ms("--duo-move-delay", 250),
    duration: ms("--duo-move-duration", 550),
    easing: style.getPropertyValue("--duo-move-ease").trim() || "cubic-bezier(0.34, 1.4, 0.64, 1)"
  }
}

export function measurePage(root = document.body) {
  const elements = [...root.querySelectorAll(MOVING)].filter((el) => el.getClientRects().length && !el.closest("[hidden]"))
  const set = new Set(elements)
  const rects = new Map()
  const parentOf = new Map()
  for (const el of elements) {
    const r = el.getBoundingClientRect()
    rects.set(el, { x: r.left + scrollX, y: r.top + scrollY, width: r.width, height: r.height })
    let parent = el.parentElement
    while (parent && !set.has(parent)) parent = parent.parentElement
    if (parent) parentOf.set(el, parent)
  }
  return { rects, parentOf, view: { top: scrollY, bottom: scrollY + innerHeight, width: innerWidth } }
}

export function playMoves(moves) {
  const { delay, duration, easing } = motionValues()
  const timing = { delay, duration, easing, fill: "backwards" }
  const animations = moves.map(({ key, dx, dy, appear }) => appear
    ? key.animate([{ opacity: 0 }, { opacity: 1 }], { ...timing, easing: "ease-out" })
    : key.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], timing))
  const cancel = () => animations.forEach((animation) => animation.cancel())
  // A safety net: nothing stays half way, whatever happens.
  const net = setTimeout(cancel, delay + duration + 500)
  const finished = Promise.allSettled(animations.map((animation) => animation.finished)).then(() => clearTimeout(net))
  return { cancel: () => { clearTimeout(net); cancel() }, finished }
}
