import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { menuItems } from "../src/menu_items.js"
import { paneState } from "../src/pane_state.js"

const cards = [
  { href: "device.html" },
  { href: "safe-areas.html" },
  { href: "posture.html", foldableOnly: true },
  { href: "dynamic-island.html" }
]
const narrow = (current) => paneState({ names: ["list", "glance"], wide: false, current }).switches
const wide = paneState({ names: ["list", "glance"], wide: true, current: null }).switches

test("narrow: the other pane first, then every card", () => {
  assert.deepEqual(menuItems({ switches: narrow("glance"), cards, folding: true }), [
    { kind: "pane", name: "list" },
    { kind: "card", href: "device.html" },
    { kind: "card", href: "safe-areas.html" },
    { kind: "card", href: "posture.html" },
    { kind: "card", href: "dynamic-island.html" }
  ])
  assert.deepEqual(menuItems({ switches: narrow("list"), cards, folding: true })[0], { kind: "pane", name: "glance" })
})

test("wide: only the cards", () => {
  const items = menuItems({ switches: wide, cards, folding: true })
  assert.ok(items.every((item) => item.kind === "card"))
  assert.equal(items.length, 4)
})

test("on an iPhone or an iPad there is no posture item", () => {
  const hrefs = menuItems({ switches: wide, cards, folding: false }).map((item) => item.href)
  assert.deepEqual(hrefs, ["device.html", "safe-areas.html", "dynamic-island.html"])
})

test("the menu's links are the cards' links, in the same order", () => {
  const html = readFileSync(new URL("../public/index.html", import.meta.url), "utf8")
  const fromCards = [...html.matchAll(/<article[\s\S]*?<a href="([a-z-]+\.html)"/g)].map((m) => m[1])
  const nav = html.match(/<nav hidden aria-label="Features">([\s\S]*?)<\/nav>/)[1]
  const fromMenu = [...nav.matchAll(/<a href="([a-z-]+\.html)" data-panes-target="card"/g)].map((m) => m[1])
  assert.deepEqual(fromMenu, fromCards)
  assert.match(nav, /href="posture.html"[^>]*data-foldable-only/)
})
