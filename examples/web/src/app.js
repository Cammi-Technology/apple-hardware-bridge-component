import "@hotwired/turbo"
import { Application, Controller } from "@hotwired/stimulus"
import { controllers } from "@cammi-technology/apple-hardware-bridge-component"
import { controllers as bridgeComponents } from "@joemasilotti/bridge-components"
import AddButtonController from "./add_button_controller.js"
import PanesController from "./panes_controller.js"
import ComponentsController from "./components_controller.js"
import FoldableController from "./foldable_controller.js"
import DeviceIconController from "./device_icon_controller.js"
import OutlinesController from "./outlines_controller.js"
import { showsFolding } from "./foldable.js"
import { LayoutMotion, measurePage, playMoves } from "./animate_layout.js"

// What WebKit itself reports as the safe area, through CSS env(), side
// by side: top, right, bottom, left.
function safeAreaFromCSS() {
  const probe = document.createElement("div")
  probe.style.cssText = "position:fixed;visibility:hidden;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)"
  document.body.append(probe)
  const { paddingTop, paddingRight, paddingBottom, paddingLeft } = getComputedStyle(probe)
  probe.remove()
  return [paddingTop, paddingRight, paddingBottom, paddingLeft]
}

const round = (value) => (value ? `${Math.round(parseFloat(value))}px` : "0px")

// Logs a check: the time and what the device says now. The page's
// button and the native add button both call add().
class ChecksController extends Controller {
  static targets = ["list", "empty", "toast"]

  add() {
    const data = document.body.dataset
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    const item = document.createElement("li")
    item.className = "rounded-xl bg-white dark:bg-stone-800 px-4 py-2 ring-1 ring-stone-300 dark:ring-stone-700"
    const parts = [data.deviceName ?? "this browser", showsFolding(data) ? data.devicePosture ?? "no posture" : null, data.deviceOrientation ?? "no orientation"]
    item.textContent = `${time}: ${parts.filter(Boolean).join(", ")}`
    this.#log(item)
  }

  addSafeArea() {
    const style = document.body.style
    const side = (name) => style.getPropertyValue(`--device-safe-${name}`) || "0px"
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    const item = document.createElement("li")
    item.className = "rounded-xl bg-white dark:bg-stone-800 px-4 py-2 ring-1 ring-stone-300 dark:ring-stone-700"
    item.textContent = `${time}: safe area top ${side("top")}, right ${side("right")}, bottom ${side("bottom")}, left ${side("left")}`
    this.#log(item)
  }

  #log(item) {
    if (this.hasEmptyTarget) this.emptyTarget.remove()
    this.listTarget.append(item)
    if (this.hasToastTarget) this.toastTarget.click()
  }
}

// Fills a feature page's live values from the body's data-device-*
// attributes and --device-* properties. Each value says what it reads:
//
//   data-attr="deviceName"           a data-device-* attribute
//   data-var="--device-fold-x"       one property
//   data-sides="--device-safe"       four properties: top, right, bottom, left
//   data-sides="env"                 what CSS env() gives, the same four ways
//   data-sides="padding"             the page's own padding
//   data-region="1"                  a covered region: where, and its size
//   data-size="--device"             --device-width × --device-height
class LiveController extends Controller {
  static targets = ["value"]

  connect() {
    this.render()
  }

  render() {
    this.valueTargets.forEach((el) => {
      el.textContent = this.#read(el.dataset) || "not sent"
    })
  }

  #read({ attr, sides, region, size, var: name }) {
    const body = document.body
    const prop = (key) => body.style.getPropertyValue(key).trim()
    if (attr) return body.dataset[attr]
    if (name) return prop(name)
    if (sides === "env") return safeAreaFromCSS().map(round).join(", ")
    if (sides === "padding") {
      const style = getComputedStyle(body)
      return [style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft].map(round).join(", ")
    }
    if (sides) {
      const values = ["top", "right", "bottom", "left"].map((side) => prop(`${sides}-${side}`))
      return values.some(Boolean) ? values.map(round).join(", ") : ""
    }
    if (region) {
      const [x, y, w, h] = ["x", "y", "width", "height"].map((k) => prop(`--device-occlusion-${region}-${k}`))
      return x ? `at ${round(x)}, ${round(y)}, ${round(w)} × ${round(h)}` : "none"
    }
    if (size) {
      const [w, h] = [prop(`${size}-width`), prop(`${size}-height`)]
      return w && w !== "0px" ? `${round(w)} × ${round(h)}` : ""
    }
    return ""
  }
}

const application = Application.start()
application.load(controllers)
application.load(bridgeComponents)
application.register("bridge--add-button", AddButtonController)
application.register("checks", ChecksController)
application.register("live", LiveController)
application.register("panes", PanesController)
application.register("components", ComponentsController)
application.register("foldable", FoldableController)
application.register("device-icon", DeviceIconController)
application.register("outlines", OutlinesController)

// Every page: when the layout changes, things move to their new place
// instead of jumping (animate_layout.js). Not on a page's first layout:
// the first snapshot after each visit only sets the starting point.
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
let lastScroll = 0
window.addEventListener("scroll", () => { lastScroll = performance.now() }, { passive: true })
const layoutMotion = new LayoutMotion({
  measure: () => measurePage(document.body),
  play: playMoves,
  still: () => reducedMotion.matches || performance.now() - lastScroll < 150
})
let firstLayoutSeen = false
const startPage = () => {
  firstLayoutSeen = false
  layoutMotion.settle()
}
document.addEventListener("turbo:load", startPage)
window.addEventListener("bridge--device:change", () => {
  // After every other listener has updated the page.
  queueMicrotask(() => {
    if (firstLayoutSeen) layoutMotion.change()
    else { firstLayoutSeen = true; layoutMotion.settle() }
  })
})
