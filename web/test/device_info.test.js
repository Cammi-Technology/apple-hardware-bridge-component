import { test } from "node:test"
import assert from "node:assert/strict"
import { deviceInfoAttributes } from "../controllers/device_info.js"

test("a new app's snapshot sets the model, name and idiom", () => {
  const snapshot = { posture: "closed", device: { model: "iPad17,2", name: "iPad Pro 11-inch (M5)", idiom: "pad" } }
  assert.deepEqual(deviceInfoAttributes(snapshot), {
    deviceModel: "iPad17,2",
    deviceName: "iPad Pro 11-inch (M5)",
    deviceIdiom: "pad"
  })
})

test("an older app sends no device, so nothing is set", () => {
  assert.deepEqual(deviceInfoAttributes({ posture: "closed" }), {
    deviceModel: null,
    deviceName: null,
    deviceIdiom: null
  })
})

test("no snapshot at all sets nothing", () => {
  assert.deepEqual(deviceInfoAttributes(undefined), {
    deviceModel: null,
    deviceName: null,
    deviceIdiom: null
  })
})

test("an unknown model shows the family and the model identifier", () => {
  const snapshot = { device: { model: "iPad16,3", name: "Unknown iPad", idiom: "pad" } }
  assert.equal(deviceInfoAttributes(snapshot).deviceName, "iPad (iPad16,3)")
  const phone = { device: { model: "iPhone99,1", name: "Unknown iPhone", idiom: "phone" } }
  assert.equal(deviceInfoAttributes(phone).deviceName, "iPhone (iPhone99,1)")
  const other = { device: { model: "Watch9,9", name: "Unknown device", idiom: "unspecified" } }
  assert.equal(deviceInfoAttributes(other).deviceName, "Device (Watch9,9)")
})

test("a known name is shown as it is", () => {
  const snapshot = { device: { model: "iPad16,3", name: "iPad Pro 11-inch (M4)", idiom: "pad" } }
  assert.equal(deviceInfoAttributes(snapshot).deviceName, "iPad Pro 11-inch (M4)")
})
