import { test } from "node:test"
import assert from "node:assert/strict"
import { paneState } from "../src/pane_state.js"

const names = ["list", "glance"]

test("narrow shows one pane: the glance by default", () => {
  const state = paneState({ names, wide: false, current: null })
  assert.deepEqual(state.visible, ["glance"])
  assert.deepEqual(state.switches, [{ name: "list", pressed: false }, { name: "glance", pressed: true }])
})

test("narrow switches to the chosen pane", () => {
  const state = paneState({ names, wide: false, current: "list" })
  assert.deepEqual(state.visible, ["list"])
  assert.equal(state.switches.find((s) => s.pressed).name, "list")
})

test("wide shows both and offers no switch", () => {
  const state = paneState({ names, wide: true, current: "list" })
  assert.deepEqual(state.visible, ["list", "glance"])
  assert.deepEqual(state.switches, [])
})

test("an unknown stored pane falls back to the default", () => {
  assert.equal(paneState({ names, wide: false, current: "gone" }).current, "glance")
})
