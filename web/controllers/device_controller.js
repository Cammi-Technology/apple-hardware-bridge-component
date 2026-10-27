import { BridgeComponent } from "@hotwired/hotwire-native-bridge"
import { occlusionInsets } from "./occlusion_insets.js"
import { deviceInfoAttributes } from "./device_info.js"
import { postureAttribute } from "./posture.js"

// Mirrors the device's hinge, screen and orientation onto the element
// it's mounted on (the body, via ApplicationLayout), so CSS and other
// controllers can respond to how an iPhone Duo is being held.
//
// The native side (DeviceComponent) replies to "connect" with a snapshot
// and again every time something changes. Each snapshot lands as:
//
//   data-device-posture="closed|open|book|laptop|tent"   the whole picture,
//                       on a foldable only: see posture.js
//   data-device-hinge="none|closed|partially-open|fully-open|unknown"
//   data-device-hinge-angle="128"                        degrees
//   data-device-hinge-axis="vertical|horizontal|none"    the fold's direction
//   data-device-fold="active|inactive|none"
//   data-device-display="outer|inner|single"
//   data-device-orientation="portrait|portrait-upside-down|landscape-left|landscape-right|unknown"
//   data-device-size-h="compact|regular"                 size classes
//   data-device-size-v="compact|regular"
//   data-device-foldable="true|false"
//   data-device-model="iPhone18,2"                       see device_info.js
//   data-device-name="iPhone 17 Pro Max"
//   data-device-idiom="phone|pad|mac|tv|carPlay|vision|unspecified"
//
// and as CSS custom properties, in points: --device-width, --device-height,
// --device-fold-x, --device-fold-y, --device-fold-width, --device-fold-height,
// the safe area as --device-safe-top, -right, -bottom and -left, and what
// covers the screen (the Dynamic Island and Live Activities): how far in it
// reaches from each edge as --device-occlusion-top, -right, -bottom and
// -left, and each active region as --device-occlusion-1-x, -1-y, -1-width,
// -1-height and so on, up to 4. data-device-occlusions counts them.
//
// The body is a Tailwind named group, `group/device`, so a child can say
//   class="group-data-[device-posture=book]/device:grid-cols-2"
// A "device:change" event with the snapshot as its detail fires on each
// update for anything that needs more than CSS.
//
// On the web (no native app) nothing is set.
export default class extends BridgeComponent {
  static component = "device"

  // No `enabled` check before sending. The page's script can start before
  // the app has set up the bridge, and then `enabled` is still false. The
  // bridge holds messages until the app is ready, and drops them for a
  // component the app does not have, so sending straight away is safe.
  connect() {
    super.connect()
    this.send("connect", {}, (message) => this.#apply(message.data))
  }

  disconnect() {
    if (this.enabled) this.send("disconnect", {})
    super.disconnect()
  }

  #apply(device) {
    if (!device) return
    const el = this.element
    const set = (name, value) => {
      if (value === undefined || value === null) {
        delete el.dataset[name]
      } else {
        el.dataset[name] = String(value)
      }
    }

    set("devicePosture", postureAttribute(device))
    set("deviceHinge", kebab(device.hinge?.status))
    set("deviceHingeAngle", device.hinge?.angle == null ? null : Math.round(device.hinge.angle))
    set("deviceHingeAxis", device.hinge?.axis)
    set("deviceFold", device.fold ? (device.fold.active ? "active" : "inactive") : "none")
    set("deviceDisplay", device.screen?.display)
    set("deviceOrientation", kebab(device.orientation))
    set("deviceSizeH", device.sizeClass?.horizontal)
    set("deviceSizeV", device.sizeClass?.vertical)
    set("deviceFoldable", device.foldable)
    for (const [name, value] of Object.entries(deviceInfoAttributes(device))) set(name, value)

    const style = el.style
    style.setProperty("--device-width", `${device.screen?.width ?? 0}px`)
    style.setProperty("--device-height", `${device.screen?.height ?? 0}px`)
    if (device.fold) {
      style.setProperty("--device-fold-x", `${device.fold.x}px`)
      style.setProperty("--device-fold-y", `${device.fold.y}px`)
      style.setProperty("--device-fold-width", `${device.fold.width}px`)
      style.setProperty("--device-fold-height", `${device.fold.height}px`)
    } else {
      ;["x", "y", "width", "height"].forEach((k) => style.removeProperty(`--device-fold-${k}`))
    }

    const safe = device.safeArea
    ;["top", "right", "bottom", "left"].forEach((side) => {
      if (safe) {
        style.setProperty(`--device-safe-${side}`, `${safe[side] ?? 0}px`)
      } else {
        style.removeProperty(`--device-safe-${side}`)
      }
    })

    this.#applyOcclusions(device)

    this.dispatch("change", { detail: device })
  }

  // What covers the screen, such as the Dynamic Island and its Live
  // Activities. There can be several. Each update sets every variable or
  // removes it, so nothing is left over when a region goes away.
  #applyOcclusions(device) {
    const style = this.element.style
    const width = device.screen?.width ?? 0
    const height = device.screen?.height ?? 0
    const active = (device.occlusions ?? []).filter((region) => region.active)

    this.element.dataset.deviceOcclusions = String(active.length)
    for (let i = 1; i <= MAX_OCCLUSIONS; i++) {
      const region = active[i - 1]
      ;["x", "y", "width", "height"].forEach((k) => {
        const name = `--device-occlusion-${i}-${k}`
        region ? style.setProperty(name, `${region[k]}px`) : style.removeProperty(name)
      })
    }

    const insets = occlusionInsets(active, width, height)
    for (const side of ["top", "right", "bottom", "left"]) {
      style.setProperty(`--device-occlusion-${side}`, `${insets[side]}px`)
    }
  }
}

const MAX_OCCLUSIONS = 4

// "partiallyOpen" → "partially-open"
function kebab(value) {
  if (value == null) return null
  return String(value).replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()
}
