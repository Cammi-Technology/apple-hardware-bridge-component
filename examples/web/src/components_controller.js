import { Controller } from "@hotwired/stimulus"
import { featureComponents, deviceComponents } from "./components_data.js"

const chip = "inline-block max-w-full rounded-md bg-stone-100 px-1.5 py-0.5 font-mono [overflow-wrap:anywhere] text-[0.8em] text-stone-800 ring-1 ring-stone-300 dark:bg-stone-900 dark:text-stone-200 dark:ring-stone-600"

// Renders the Apple component names for a feature: as small chips on a
// card (layout "chips"), or as a table on a detail page ("table"). With
// feature "device" left empty, it lists the names for this device.
export default class extends Controller {
  static values = { feature: String, layout: { type: String, default: "chips" } }

  connect() {
    this.render()
  }

  render() {
    if (!this.featureValue) return this.#renderDevice()
    const entry = featureComponents[this.featureValue]
    if (!entry) return
    this.layoutValue === "table" ? this.#renderTable(entry) : this.#renderChips(entry)
  }

  #renderChips({ uikit, swiftui }) {
    this.element.replaceChildren(
      ...uikit.map((name) => this.#item(name)),
      ...swiftui.map((name) => this.#item(name, "SwiftUI"))
    )
  }

  #renderDevice() {
    const data = document.body.dataset
    const names = deviceComponents({ idiom: data.deviceIdiom, display: data.deviceDisplay })
    this.element.replaceChildren(...(names.length ? names.map((name) => this.#item(name)) : [this.#text("Open this page in the app to see them.")]))
  }

  #renderTable({ uikit, swiftui, demo }) {
    const rows = [["UIKit", uikit], ["SwiftUI", swiftui], ["This demo", demo]]
    this.element.replaceChildren(...rows.map(([label, names]) => {
      const row = document.createElement("div")
      row.className = "grid grid-cols-[6rem_minmax(0,1fr)] gap-3 py-2"
      const term = document.createElement("dt")
      term.className = "text-sm font-semibold"
      term.textContent = label
      const value = document.createElement("dd")
      value.className = "flex min-w-0 flex-wrap gap-1.5"
      value.append(...(names.length ? names.map((name) => this.#code(name)) : [this.#text("-")]))
      row.append(term, value)
      return row
    }))
  }

  #item(name, prefix) {
    const li = document.createElement("li")
    li.className = "min-w-0 max-w-full"
    if (prefix) {
      const label = document.createElement("span")
      label.className = "mr-1 text-xs text-stone-600 dark:text-stone-300"
      label.textContent = prefix
      li.append(label)
    }
    li.append(this.#code(name))
    return li
  }

  // Long names may wrap, but only after a dot or before a bracket, so
  // UITraitCollection.userInterfaceIdiom breaks as two readable words.
  #code(name) {
    const code = document.createElement("code")
    code.className = chip
    name.split(/(?<=[A-Za-z0-9)]\.)(?=[A-Za-z])|(?=\()/).forEach((part, index) => {
      if (index) code.append(document.createElement("wbr"))
      code.append(part)
    })
    return code
  }

  #text(value) {
    const span = document.createElement("span")
    span.className = "text-sm text-stone-600 dark:text-stone-300"
    span.textContent = value
    return span
  }
}
