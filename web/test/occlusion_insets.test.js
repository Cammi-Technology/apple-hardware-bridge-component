import { test } from "node:test"
import assert from "node:assert/strict"
import { occlusionInsets } from "../controllers/occlusion_insets.js"

const width = 1000
const height = 700

test("no regions, no insets", () => {
  assert.deepEqual(occlusionInsets([], width, height), { top: 0, right: 0, bottom: 0, left: 0 })
})

test("two widgets stacked down the right edge make one right inset", () => {
  const regions = [
    { x: 930, y: 20, width: 56, height: 56 },
    { x: 930, y: 86, width: 56, height: 56 }
  ]
  assert.deepEqual(occlusionInsets(regions, width, height), { top: 0, right: 70, bottom: 0, left: 0 })
})

test("an island across the top makes a top inset", () => {
  const regions = [{ x: 400, y: 10, width: 200, height: 36 }]
  assert.deepEqual(occlusionInsets(regions, width, height), { top: 46, right: 0, bottom: 0, left: 0 })
})

test("a column on the left makes a left inset", () => {
  const regions = [{ x: 10, y: 20, width: 50, height: 120 }]
  assert.deepEqual(occlusionInsets(regions, width, height), { top: 0, right: 0, bottom: 0, left: 60 })
})
