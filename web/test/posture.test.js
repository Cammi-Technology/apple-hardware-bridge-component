import { test } from "node:test"
import assert from "node:assert/strict"
import { postureAttribute } from "../controllers/posture.js"

test("an iPad sets no posture", () => {
  assert.equal(postureAttribute({ posture: "closed", foldable: false, screen: { display: "single" } }), null)
})

test("an ordinary iPhone sets no posture, whatever it sends", () => {
  assert.equal(postureAttribute({ posture: "closed", foldable: false }), null)
  assert.equal(postureAttribute({ posture: "flat", foldable: false }), null)
})

test("the iPhone Duo keeps its postures", () => {
  for (const posture of ["closed", "open", "book", "laptop", "tent"]) {
    assert.equal(postureAttribute({ posture, foldable: true }), posture)
  }
})

test("a snapshot without foldable keeps the posture it sent", () => {
  assert.equal(postureAttribute({ posture: "open" }), "open")
})

test("no snapshot sets nothing", () => {
  assert.equal(postureAttribute(undefined), null)
  assert.equal(postureAttribute({}), null)
})
