import { test } from "node:test"
import assert from "node:assert/strict"
import { planMoves, LayoutMotion } from "../src/animate_layout.js"

const view = { top: 0, bottom: 800 }
const box = (x, y) => ({ x, y, width: 100, height: 100 })

test("a block that moves slides from its old place", () => {
  const moves = planMoves({ first: new Map([["card", box(0, 0)]]), last: new Map([["card", box(300, 40)]]), parentOf: new Map(), view })
  assert.deepEqual(moves, [{ key: "card", dx: -300, dy: -40 }])
})

test("a card inside a moving pane moves only by its own change", () => {
  const first = new Map([["pane", box(0, 0)], ["card", box(10, 10)]])
  const last = new Map([["pane", box(500, 0)], ["card", box(510, 10)]])
  const moves = planMoves({ first, last, parentOf: new Map([["card", "pane"]]), view })
  assert.deepEqual(moves, [{ key: "pane", dx: -500, dy: 0 }])
})

test("something new fades in, and off-screen blocks do not move", () => {
  const first = new Map([["far", box(0, 2000)]])
  const last = new Map([["far", box(300, 2100)], ["new", box(0, 100)]])
  assert.deepEqual(planMoves({ first, last, parentOf: new Map(), view }), [{ key: "new", appear: true }])
})

const fakePage = () => {
  const layouts = []
  const played = []
  let cancelled = 0
  const motion = new LayoutMotion({
    measure: () => layouts.shift(),
    play: (moves) => { played.push(moves); return { cancel: () => cancelled++, finished: new Promise(() => {}) } },
    still: () => false
  })
  const at = (x) => ({ rects: new Map([["card", box(x, 0)]]), parentOf: new Map(), view })
  return { motion, layouts, played, at, cancelled: () => cancelled }
}

test("the first layout of a page never moves", () => {
  const page = fakePage()
  page.layouts.push(page.at(0))
  page.motion.change()
  assert.equal(page.played.length, 0)
})

test("a burst of changes moves once, from where it started", () => {
  const page = fakePage()
  page.layouts.push(page.at(0), page.at(200), page.at(400))
  page.motion.settle()
  page.motion.change()
  page.motion.change()
  assert.equal(page.cancelled() >= 1, true, "the first move is stopped, not stacked")
  assert.deepEqual(page.played.at(-1), [{ key: "card", dx: -400, dy: 0 }], "the last move starts from the first place")
})

test("reduced motion, or scrolling, never moves anything", () => {
  const played = []
  const layouts = [{ rects: new Map([["card", box(0, 0)]]), parentOf: new Map(), view }, { rects: new Map([["card", box(300, 0)]]), parentOf: new Map(), view }]
  const motion = new LayoutMotion({ measure: () => layouts.shift(), play: (moves) => { played.push(moves); return { cancel() {}, finished: Promise.resolve() } }, still: () => true })
  motion.settle()
  motion.change()
  assert.equal(played.length, 0)
})

test("opening from the cover: the right page stays put, the left page fades in", () => {
  const coverView = { top: 0, bottom: 800, width: 466 }
  const openView = { top: 0, bottom: 800, width: 1000 }
  // On the cover: the card fills the screen, 16px from each side.
  const first = new Map([["cover card", { x: 16, y: 100, width: 434, height: 200 }], ["intro", { x: 16, y: 20, width: 434, height: 60 }]])
  // Open: the card is on the right page, 16px from the right edge; the
  // intro is on the left page.
  const last = new Map([["cover card", { x: 536, y: 100, width: 448, height: 200 }], ["intro", { x: 16, y: 20, width: 448, height: 60 }]])
  const moves = planMoves({ first, last, parentOf: new Map(), view: openView, firstView: coverView })
  assert.deepEqual(moves, [{ key: "cover card", dx: 14, dy: 0 }, { key: "intro", appear: true }])
})

test("closing to the cover: the right page stays put", () => {
  const first = new Map([["cover card", { x: 536, y: 100, width: 448, height: 200 }]])
  const last = new Map([["cover card", { x: 16, y: 100, width: 434, height: 200 }]])
  const moves = planMoves({ first, last, parentOf: new Map(), view: { top: 0, bottom: 800, width: 466 }, firstView: { top: 0, bottom: 800, width: 1000 } })
  assert.deepEqual(moves, [{ key: "cover card", dx: -14, dy: 0 }])
})

test("opening from the cover: a block across both pages is the frame and stays", () => {
  const first = new Map([["main", { x: 16, y: 100, width: 434, height: 900 }], ["cover card", { x: 16, y: 100, width: 434, height: 200 }]])
  const last = new Map([["main", { x: 16, y: 100, width: 968, height: 500 }], ["cover card", { x: 550, y: 100, width: 434, height: 200 }]])
  const moves = planMoves({ first, last, parentOf: new Map([["cover card", "main"]]), view: { top: 0, bottom: 800, width: 1000 }, firstView: { top: 0, bottom: 800, width: 466 } })
  assert.deepEqual(moves, [], "the frame stays, and the cover card is already in place")
})
