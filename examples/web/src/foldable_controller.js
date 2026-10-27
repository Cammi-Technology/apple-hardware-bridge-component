import { Controller } from "@hotwired/stimulus"
import { applyFolding } from "./foldable.js"

// On the body. Mark folding details data-foldable-target="only", the
// feature cards "feature", and the feature count "count".
export default class extends Controller {
  static targets = ["only", "feature", "count"]

  connect() {
    this.render()
  }

  render() {
    const count = applyFolding({ dataset: document.body.dataset, only: this.onlyTargets, features: this.featureTargets })
    if (this.hasCountTarget) this.countTarget.textContent = String(count)
  }
}
