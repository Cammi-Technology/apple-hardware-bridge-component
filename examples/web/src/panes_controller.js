import { Controller } from "@hotwired/stimulus"
import { paneState } from "./pane_state.js"
import { menuItems } from "./menu_items.js"
import { showsFolding } from "./foldable.js"

// Two panes that show side by side where they fit, and one at a time
// where they don't, like a planner on the iPhone Duo. The `switch`
// buttons pick the pane. The native "…" menu offers the other pane,
// then the hardware cards (`card` links): see menu_items.js.
//
// "Fits" means the Duo's inner display, or a window at least 48rem wide.
// The choice is kept in sessionStorage for this page, and switching adds
// no history entry: the back button still leaves the page.
export default class extends Controller {
  static targets = ["pane", "switch", "switcher", "menu", "card"]

  connect() {
    this.query = window.matchMedia("(min-width: 48rem)")
    this.render = this.render.bind(this)
    this.query.addEventListener("change", this.render)
    window.addEventListener("bridge--device:change", this.render)
    this.render()
  }

  disconnect() {
    this.query.removeEventListener("change", this.render)
    window.removeEventListener("bridge--device:change", this.render)
  }

  show(event) {
    const pane = event.params.pane
    try { sessionStorage.setItem(this.#storageKey, pane) } catch {}
    this.render()
    this.paneTargets.find((element) => element.dataset.pane === pane)?.focus({ preventScroll: true })
    window.scrollTo({ top: 0 })
  }

  render() {
    // Both panes show on the Duo, open or closed: on the cover screen
    // they stack, At a glance first. One at a time only on a narrow
    // screen that is not the Duo.
    const display = document.body.dataset.deviceDisplay
    const wide = display === "inner" || display === "outer" || this.query.matches
    const state = paneState({ names: this.#names, wide, current: this.#stored })

    this.element.dataset.paneCurrent = state.current
    this.paneTargets.forEach((pane) => {
      const on = state.visible.includes(pane.dataset.pane)
      pane.hidden = !on
      pane.inert = !on
      pane.tabIndex = -1
    })

    if (this.hasSwitcherTarget) this.switcherTarget.hidden = wide
    const items = menuItems({
      switches: state.switches,
      cards: this.cardTargets.map((link) => ({ href: link.getAttribute("href"), foldableOnly: link.hasAttribute("data-foldable-only") })),
      folding: showsFolding(document.body.dataset)
    })
    this.switchTargets.forEach((button) => {
      const entry = state.switches.find((item) => item.name === button.dataset.panesPaneParam)
      button.setAttribute("aria-pressed", String(entry?.pressed ?? false))
      offer(button, items.some((item) => item.kind === "pane" && item.name === button.dataset.panesPaneParam))
    })
    this.cardTargets.forEach((link) => {
      offer(link, items.some((item) => item.kind === "card" && item.href === link.getAttribute("href")))
    })
    this.#refreshMenu()
  }

  get #names() {
    return this.paneTargets.map((pane) => pane.dataset.pane)
  }

  get #stored() {
    try { return sessionStorage.getItem(this.#storageKey) } catch { return null }
  }

  get #storageKey() {
    return `panes:${window.location.pathname}`
  }

  // The native "…" menu reads its items when it connects. With no items
  // (both panes showing) the menu is not wanted at all, so the
  // bridge--menu controller comes off and the native button goes.
  // When the items change, it reconnects so the native menu updates.
  #refreshMenu() {
    if (!this.hasMenuTarget) return
    const menu = this.menuTarget
    const items = [...menu.querySelectorAll('[data-bridge--menu-target~="item"]')]
    const others = (menu.dataset.controller ?? "").split(/\s+/).filter((name) => name && name !== "bridge--menu")
    const active = (menu.dataset.controller ?? "").split(/\s+/).includes("bridge--menu")

    if (!items.length) {
      if (active) menu.dataset.controller = others.join(" ")
      this.menuSignature = ""
      return
    }

    const signature = items.map((item) => `${item.textContent.trim()}:${item.dataset.bridgeIosImage ?? ""}`).join("|")
    if (active && signature === this.menuSignature) return
    this.menuSignature = signature
    menu.dataset.controller = others.join(" ")
    requestAnimationFrame(() => {
      menu.dataset.controller = [...others, "bridge--menu"].join(" ")
    })
  }
}

// An element is an item of the native menu while it has this target.
function offer(element, on) {
  if (on) element.setAttribute("data-bridge--menu-target", "item")
  else element.removeAttribute("data-bridge--menu-target")
}
