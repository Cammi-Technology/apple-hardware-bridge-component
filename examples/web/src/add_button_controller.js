import { BridgeComponent } from "@hotwired/hotwire-native-bridge"

// Asks the app for its round add button. While the native button shows,
// the body gets data-add-button, so the page can leave room for it.
//
// The items are this element's `item` targets. Each gives an id
// (data-bridge-id), a title (data-bridge-title or its text) and an SF
// Symbol (data-bridge-ios-image). With items, the app shows them as a
// native menu, and the chosen item is clicked here. With none, a tap
// clicks this element.
export default class extends BridgeComponent {
  static component = "add-button"
  static targets = ["item"]

  // Send even when `enabled` is still false: the page can start before
  // the app has set up the bridge, which then holds the message.
  connect() {
    super.connect()
    if (this.enabled) document.body.dataset.addButton = "native"
    const title = this.bridgeElement.bridgeAttribute("title") ?? this.bridgeElement.title
    const items = this.itemTargets.map((element, index) => ({
      id: element.dataset.bridgeId ?? String(index),
      title: element.dataset.bridgeTitle ?? element.textContent.trim(),
      image: element.dataset.bridgeIosImage ?? null
    }))
    this.send("connect", { title, items }, (message) => this.#chosen(message.data?.id))
  }

  disconnect() {
    if (this.enabled) this.send("disconnect", {})
    delete document.body.dataset.addButton
    super.disconnect()
  }

  #chosen(id) {
    const item = id == null ? null : this.itemTargets.find((element, index) => (element.dataset.bridgeId ?? String(index)) === id)
    ;(item ?? this.itemTargets[0] ?? this.element).click()
  }
}
