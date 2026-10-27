# Apple Hardware Bridge Component

A [Hotwire Native](https://native.hotwired.dev) bridge component for
Apple hardware, starting with the iPhone Duo.

A bridge component tells your web pages how the phone is held. Your
CSS can then lay the page out for the cover screen, the open screen
and book mode.

## How it works

1. `DeviceComponent` (Swift) reads the hinge, the fold and the screen,
   and sends a snapshot to the page whenever they change.
2. The `bridge--device` Stimulus controller writes that snapshot onto
   the `body` as `data-device-*` attributes and `--device-*` CSS
   properties.
3. Tailwind variants such as `duo-inner` and `duo-book` read those
   attributes, so you lay out one grid with class names.

| How the phone is held | The demo grid |
| --- | --- |
| Closed, on the cover screen | One column: the cover content only |
| Open and flat | Two columns: main page left, cover content right |
| Book mode | A page either side of the fold, with the fold in the gap: `duo-spread` |

## What you get

| Part | Where |
| --- | --- |
| Swift bridge component `DeviceComponent` | `ios/components/` |
| Stimulus controller `bridge--device` | `web/controllers/` |
| Tailwind v4 variants and plain CSS helpers | `web/css/` |
| Docs | `docs/components/device.md` |
| Demo site (Tailwind, static) and demo iOS app | `examples/` |

## Requirements

* [Hotwire Native iOS](https://github.com/hotwired/hotwire-native-ios) 1.2 or later
* [Hotwire Native Bridge](https://native.hotwired.dev/reference/bridge-installation)
* Xcode 27.1 for the hinge and fold. Older Xcodes still build, and
  report a phone without a hinge.

## Install

Nothing is on npm or the Swift Package Index yet. Install from this
repo.

### iOS

Add the Swift package
`https://github.com/Cammi-Technology/apple-hardware-bridge-component`, then
register the component:

```swift
import HotwireNative
import AppleHardwareBridgeComponent

Hotwire.registerBridgeComponents([
    DeviceComponent.self
])
```

### Web

```bash
npm install github:Cammi-Technology/apple-hardware-bridge-component
```

```javascript
import { Application } from "@hotwired/stimulus"
import { controllers } from "@cammi-technology/apple-hardware-bridge-component"

const application = Application.start()
application.load(controllers)
```

Mount it once, on the body:

```html
<body data-controller="bridge--device" class="group/device">
```

For the Tailwind variants, import them after Tailwind:

```css
@import "tailwindcss";
@import "@cammi-technology/apple-hardware-bridge-component/css/duo-tailwind.css";
```

## Use it

```html
<body data-controller="bridge--device"
      class="group/device safe-padding native:bg-transparent">
  <header>
    <h1 class="native:sr-only">Shown in the navigation bar instead</h1>
  </header>

  <main class="grid grid-cols-1 md:grid-cols-2
               duo-inner:grid-cols-2 duo-outer:grid-cols-1">
    <section aria-labelledby="main-title" class="duo-outer:hidden">
      <h2 id="main-title">Main page</h2>
    </section>
    <aside aria-labelledby="cover-title">
      <h2 id="cover-title">Cover content</h2>
    </aside>
  </main>
</body>
```

`safe-padding` keeps content clear of the status bar and the
Dynamic Island. `native:sr-only` hides a heading the app already
shows, but keeps it for screen readers. `native:bg-transparent`
lets the app's background show.

### Semantic markup for the grid

* Put the grid on `main`, so every screen has one main landmark.
* Make the main column a `section` with a heading, not a second
  `main`. On the cover screen it is hidden, and `main` stays.
* Make the cover column an `aside` with a heading, named with
  `aria-labelledby`, so screen readers list it as a landmark.
* Keep one `h1`. In the app, hide it with `native:sr-only`, not
  `native:hidden`. `hidden` is `display: none`, which removes it from
  the accessibility tree.
* Use `native:hidden` for controls the app already shows, such as a
  web back button.

Every attribute and variant is listed in
[docs/components/device.md](docs/components/device.md). Apple's names for
the parts of the screen, such as the vertical bar, are in
[docs/ios-terms.md](docs/ios-terms.md).

## Devices

Tested in the simulator on the iPhone Duo, iPhone 17 Pro Max, iPhone
Air, iPad Pro 11-inch (M5) and iPad mini (A17 Pro). The snapshot names
the device: its model identifier, its marketing name and whether it is
a phone or an iPad. It never sends the name the owner gave it. See
[docs/components/device.md](docs/components/device.md#which-device).

## The Dynamic Island and safe areas

On the iPhone Duo the status bar and the Dynamic Island sit in a column
down one side, and Live Activities make the island grow. Native bars
move out of the way by themselves. A web page has to do it.

CSS `env(safe-area-inset-*)` is not enough on its own: in the app's web
view it can read 0. So the component also sends the native safe area,
and every region iOS 27.1 reports as covering the screen, as CSS
properties. `safe-padding` uses the largest of all three, plus a 16px
gap, so content never touches a bar or the iPad sidebar.

Apple does not document web views on the iPhone Duo. This approach is
checked on the iPhone Duo simulator, and checks on the real phone are
ongoing.

## Try the demo

The demo site and app are in [examples/](examples/README.md). The site
is also live at
[cammi-technology.github.io/apple-hardware-bridge-component](https://cammi-technology.github.io/apple-hardware-bridge-component/).
In a normal browser it shows the plain layout. Inside the app it
follows the phone.

## Licence

MIT. See [LICENSE](LICENSE).

Makers of [Cammi – Build a kinder voice](https://cammi.app) and [The Motivation Quiz](https://motivationquiz.fun).
