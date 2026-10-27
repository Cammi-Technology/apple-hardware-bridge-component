import { Controller } from "@hotwired/stimulus"
import { outlineBoxes } from "./outlines.js"

// Red dashed outlines over every area the layout keeps clear of: the
// safe area, each region that covers the screen, the fold and the
// page's fold gap. A switch turns them on and off, remembered for this
// visit. They take no taps and screen readers skip them: the page's
// live values say the same in words.
//
//   <div data-controller="outlines" data-outlines-on-value="true">
//     <button role="switch" data-outlines-target="switch" data-action="outlines#toggle">Show outlines</button>
//   </div>
export default class extends Controller {
  static targets = ["switch"]
  static values = { on: Boolean }

  connect() {
    this.overlay = document.createElement("div")
    this.overlay.dataset.outlineOverlay = ""
    this.overlay.setAttribute("aria-hidden", "true")
    this.overlay.className = "outline-overlay"
    document.body.append(this.overlay)
    this.render = this.render.bind(this)
    window.addEventListener("bridge--device:change", this.render)
    this.render()
  }

  disconnect() {
    window.removeEventListener("bridge--device:change", this.render)
    this.overlay?.remove()
  }

  toggle() {
    try { sessionStorage.setItem(this.#key, String(!this.#on)) } catch {}
    this.render()
  }

  get #key() {
    return `outlines:${location.pathname}`
  }

  get #on() {
    let stored = null
    try { stored = sessionStorage.getItem(this.#key) } catch {}
    return stored === null ? this.onValue : stored === "true"
  }

  render() {
    const on = this.#on
    if (this.hasSwitchTarget) this.switchTarget.setAttribute("aria-checked", String(on))
    const body = document.body
    const boxes = outlineBoxes({
      on,
      occlusions: body.dataset.deviceOcclusions,
      fold: ["active", "inactive"].includes(body.dataset.deviceFold),
      gap: getComputedStyle(body).getPropertyValue("--duo-book-gap").trim() !== "",
      safe: body.style.getPropertyValue("--device-safe-top") !== ""
    })
    this.overlay.replaceChildren(...boxes.map((box) => {
      const el = document.createElement("div")
      el.className = `outline-box outline-box--${box.kind}`
      if (box.index) el.style.cssText = ["x", "y", "width", "height"].map((k) => `--box-${k}: var(--device-occlusion-${box.index}-${k}, 0px)`).join(";")
      const label = document.createElement("span")
      label.className = "outline-box__label"
      label.textContent = box.label
      el.append(label)
      return el
    }))
  }
}
