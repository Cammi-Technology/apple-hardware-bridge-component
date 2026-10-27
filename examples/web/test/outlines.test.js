import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { outlineBoxes } from "../src/outlines.js"

test("one box per covered region, plus the fold and its gap", () => {
  const boxes = outlineBoxes({ on: true, occlusions: "2", fold: true, gap: true, safe: true })
  assert.deepEqual(boxes.map((box) => box.label), ["Safe area", "Covered 1", "Covered 2", "Fold", "Fold gap"])
  assert.deepEqual(boxes.filter((box) => box.kind === "covered").map((box) => box.index), [1, 2])
})

test("the boxes follow what the device sends now", () => {
  assert.deepEqual(outlineBoxes({ on: true, occlusions: "1" }).map((box) => box.label), ["Covered"])
  assert.deepEqual(outlineBoxes({ on: true, occlusions: "0", fold: false, gap: false, safe: true }).map((box) => box.kind), ["safe"])
})

test("switched off, nothing is drawn", () => {
  assert.deepEqual(outlineBoxes({ on: false, occlusions: "3", fold: true, gap: true, safe: true }), [])
})

test("on by default on Safe areas, off on the other pages, and a real switch", () => {
  const page = (name) => readFileSync(new URL(`../public/${name}`, import.meta.url), "utf8")
  assert.match(page("safe-areas.html"), /data-controller="outlines" data-outlines-on-value="true"/)
  for (const name of ["dynamic-island.html", "posture.html"]) assert.match(page(name), /data-outlines-on-value="false"/)
  assert.match(page("safe-areas.html"), /<button type="button" role="switch" aria-checked="true"/)
})
