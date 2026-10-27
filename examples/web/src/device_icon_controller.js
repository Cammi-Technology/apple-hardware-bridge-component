import { Controller } from "@hotwired/stimulus"
import { devicePose, delayed, motionPlan } from "./device_pose.js"

// The little iPhone Duo on the Posture page. It follows the body's
// posture and orientation: a moment after the device changes, it folds
// and turns to match, with a small bounce. With reduced motion it
// jumps straight there. The caption says the same in words, and
// screen readers hear it once per change.
export default class extends Controller {
  static targets = ["icon", "caption"]

  connect() {
    this.reduced = window.matchMedia("(prefers-reduced-motion: reduce)")
    this.update = this.update.bind(this)
    this.#schedule()
    this.#apply(false)
    window.addEventListener("bridge--device:change", this.update)
  }

  disconnect() {
    window.removeEventListener("bridge--device:change", this.update)
    this.later?.cancel()
  }

  update() {
    if (this.reduced.matches !== this.wasReduced) this.#schedule()
    this.later()
  }

  #schedule() {
    this.later?.cancel()
    this.wasReduced = this.reduced.matches
    const delay = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--duo-move-delay")) || 250
    const plan = motionPlan(this.reduced.matches, delay)
    this.later = plan.delay ? delayed(() => this.#apply(plan.animate), plan.delay) : () => this.#apply(false)
    this.later.cancel ??= () => {}
  }

  #apply(animate) {
    const body = document.body.dataset
    const pose = devicePose({ posture: body.devicePosture, orientation: body.deviceOrientation })
    const icon = this.iconTarget
    const changed = icon.dataset.shape !== pose.shape || icon.style.getPropertyValue("--pose-rotate") !== `${pose.rotate}deg`
    icon.classList.toggle("is-still", !animate)
    icon.dataset.shape = pose.shape
    icon.style.setProperty("--pose-rotate", `${pose.rotate}deg`)
    icon.setAttribute("aria-label", pose.label)
    if (this.captionTarget.textContent !== pose.caption) this.captionTarget.textContent = pose.caption
    if (animate && changed) this.#bounce()
  }

  // The shadow squashes as the phone lands.
  #bounce() {
    const shadow = this.iconTarget.querySelector(".device-icon__shadow")
    shadow?.animate(
      [{ transform: "scaleX(1)" }, { transform: "scaleX(0.82)", offset: 0.45 }, { transform: "scaleX(1.06)", offset: 0.8 }, { transform: "scaleX(1)" }],
      { duration: 650, easing: "ease-out" }
    )
  }
}
