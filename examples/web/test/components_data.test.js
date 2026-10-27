import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { featureComponents, deviceComponents } from "../src/components_data.js"

test("every card and detail page names a feature that has components", () => {
  const dir = new URL("../public/", import.meta.url)
  const used = readdirSync(dir).filter((f) => f.endsWith(".html"))
    .flatMap((f) => [...readFileSync(new URL(f, dir), "utf8").matchAll(/data-components-feature-value="([^"]+)"/g)].map((m) => m[1]))
  assert.ok(used.length >= 4)
  for (const id of used) assert.ok(featureComponents[id], `no components for ${id}`)
})

test("each feature lists at least one UIKit name", () => {
  for (const [id, entry] of Object.entries(featureComponents)) assert.ok(entry.uikit.length, id)
})

test("device components follow the device", () => {
  assert.ok(deviceComponents({ display: "outer" }).includes("UIHingeInteraction"))
  assert.ok(deviceComponents({ idiom: "pad" }).includes("safeAreaInsets"))
  assert.ok(deviceComponents({ idiom: "phone" }).includes("reservedRegions(kind: .occlusion)"))
  assert.deepEqual(deviceComponents({}), [])
})

test("only hardware features have cards", () => {
  assert.deepEqual(Object.keys(featureComponents).sort(), ["device", "dynamic-island", "posture", "safe-areas"])
})

test("the device list names no navigation chrome", () => {
  const chrome = /TabBar|tabSidebar|Navigation|SplitView|UIMenu|BarButton/
  for (const device of [{ display: "inner" }, { display: "outer" }, { idiom: "pad" }, { idiom: "phone" }]) {
    for (const name of deviceComponents(device)) assert.doesNotMatch(name, chrome, name)
  }
})
