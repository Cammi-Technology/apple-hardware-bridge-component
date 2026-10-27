import { test } from "node:test"
import assert from "node:assert/strict"
import { devicePose, delayed, motionPlan } from "../src/device_pose.js"

const postures = ["closed", "open", "book", "laptop", "tent"]
const orientations = ["portrait", "portrait-upside-down", "landscape-left", "landscape-right", "unknown"]

test("every posture and orientation has a pose, a name and a caption", () => {
  for (const posture of postures) {
    for (const orientation of orientations) {
      const pose = devicePose({ posture, orientation })
      assert.equal(pose.shape, posture)
      assert.equal(typeof pose.rotate, "number")
      assert.match(pose.label, /^iPhone Duo, /)
      assert.ok(pose.caption.length > 3)
    }
  }
})

test("the cover screen turns with the phone", () => {
  assert.equal(devicePose({ posture: "closed", orientation: "portrait" }).rotate, 0)
  assert.equal(devicePose({ posture: "closed", orientation: "landscape-left" }).rotate, 90)
  assert.equal(devicePose({ posture: "closed", orientation: "landscape-right" }).rotate, -90)
  assert.equal(devicePose({ posture: "closed", orientation: "portrait-upside-down" }).rotate, 180)
})

test("book keeps the fold upright, laptop lays it across", () => {
  assert.equal(devicePose({ posture: "book", orientation: "landscape-left" }).rotate, 0)
  assert.equal(devicePose({ posture: "laptop", orientation: "portrait" }).rotate, 90)
})

test("the words read naturally", () => {
  assert.deepEqual(devicePose({ posture: "book", orientation: "landscape-left" }), {
    shape: "book", rotate: 0, label: "iPhone Duo, book mode, landscape", caption: "Book mode, landscape"
  })
})

test("a browser with no device still gets a drawing and words", () => {
  const pose = devicePose({})
  assert.equal(pose.shape, "closed")
  assert.match(pose.caption, /No device/)
})

test("a burst of changes turns the icon once, after the pause", () => {
  const pending = new Map()
  let next = 1
  const timers = {
    setTimeout: (fn, ms) => { const id = next++; pending.set(id, { fn, ms }); return id },
    clearTimeout: (id) => pending.delete(id)
  }
  const calls = []
  const later = delayed((value) => calls.push(value), 320, timers)
  later("hinge moving")
  later("hinge moving more")
  later("fold settled")
  assert.equal(pending.size, 1)
  const [{ fn, ms }] = pending.values()
  assert.equal(ms, 320)
  fn()
  assert.deepEqual(calls, ["fold settled"])
})

test("reduced motion: no pause and no animation", () => {
  assert.deepEqual(motionPlan(true), { delay: 0, animate: false })
  const normal = motionPlan(false)
  assert.ok(normal.delay >= 250 && normal.delay <= 400)
  assert.equal(motionPlan(false, 300).delay, 300)
  assert.equal(normal.animate, true)
})
