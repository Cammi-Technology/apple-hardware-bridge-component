import { test } from "node:test"
import assert from "node:assert/strict"
import { applyFolding, showsFolding } from "../src/foldable.js"

const page = () => {
  const posture = { hidden: false }
  const features = [{ hidden: false }, { hidden: false }, posture]
  return { posture, features, only: [posture] }
}

test("on an iPad or an ordinary iPhone the posture is hidden and not counted", () => {
  const { posture, features, only } = page()
  const count = applyFolding({ dataset: { deviceFoldable: "false" }, only, features })
  assert.equal(posture.hidden, true)
  assert.equal(count, 2)
})

test("on the iPhone Duo the posture shows and counts", () => {
  const { posture, features, only } = page()
  posture.hidden = true
  const count = applyFolding({ dataset: { deviceFoldable: "true", devicePosture: "book" }, only, features })
  assert.equal(posture.hidden, false)
  assert.equal(count, 3)
})

test("in a browser everything shows", () => {
  assert.equal(showsFolding({}), true)
  assert.equal(showsFolding(undefined), true)
})
