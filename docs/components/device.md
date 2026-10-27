# Device component

Tells the page how the phone is held: the hinge, the fold, the screen
and the orientation.

On a phone or an iPad with no hinge nothing breaks. The hinge reads
`none`, `data-device-foldable` is `false`, and there is no posture. On
the web (no native app) nothing is set.

## Mount it

Once, on the `body`:

```html
<body data-controller="bridge--device" class="group/device">
```

## Posture

`data-device-posture` sums up the whole picture.

| Posture | Meaning |
| --- | --- |
| `closed` | Cover screen, or an ordinary phone |
| `open` | Inner screen, flat |
| `book` | Inner screen, half open, fold runs top to bottom |
| `laptop` | Inner screen, half open, fold runs side to side |
| `tent` | Cover screen, half open, landscape |
Only a foldable has a posture. The native component sends `closed`
for an ordinary iPhone or an iPad too, the same as the cover screen.
The controller leaves `data-device-posture` off whenever the snapshot
says `foldable: false`, so no posture variant can apply on an iPad,
whichever app version it runs in. Hide posture details there too:
`data-device-foldable="false"` says the device cannot fold.

## Attributes on the body

| Attribute | Values |
| --- | --- |
| `data-device-posture` | `closed`, `open`, `book`, `laptop`, `tent`. Foldables only |
| `data-device-hinge` | `none`, `closed`, `partially-open`, `fully-open`, `unknown` |
| `data-device-hinge-angle` | Degrees, 0 closed, 180 flat |
| `data-device-hinge-axis` | `vertical`, `horizontal`, `none` |
| `data-device-fold` | `active`, `inactive`, `none` |
| `data-device-display` | `outer`, `inner`, `single` |
| `data-device-orientation` | `portrait`, `portrait-upside-down`, `landscape-left`, `landscape-right`, `unknown` |
| `data-device-size-h`, `data-device-size-v` | `compact`, `regular` |
| `data-device-foldable` | `true`, `false` |
| `data-device-occlusions` | How many regions cover the screen now, such as the Dynamic Island and Live Activities |
| `data-device-model` | The model identifier, such as `iPhone18,2` |
| `data-device-name` | The marketing name, such as `iPhone 17 Pro Max`. A model the app does not know reads as its family and identifier, such as `iPad (iPad99,1)` |
| `data-device-idiom` | `phone`, `pad`, `mac`, `tv`, `carPlay`, `vision`, `unspecified` |

## CSS custom properties, in points

| Property | What |
| --- | --- |
| `--device-width`, `--device-height` | The screen |
| `--device-fold-x`, `-y`, `-width`, `-height` | The fold |
| `--device-safe-top`, `-right`, `-bottom`, `-left` | The native safe area |
| `--device-occlusion-top`, `-right`, `-bottom`, `-left` | How far the covered regions reach in from each edge |
| `--device-occlusion-1-x`, `-1-y`, `-1-width`, `-1-height` | Each covered region, numbered 1 to 4 |

The native safe area matters because CSS `env(safe-area-inset-*)` can
read 0 inside the app's web view. On the iPhone Duo simulator's cover
screen it read 0 on every side with the demo page served locally over
http, while the native safe area kept 84 points clear on the right, for
the status bar and the Dynamic Island. With the page served from GitHub
Pages over https, `env()` matched the native values. Using the larger
of the two works either way.

The covered regions come from iOS 27.1's occlusion reserved regions.
There can be more than one: the Dynamic Island grows and splits for Live
Activities. Every update sets each property or removes it, so nothing
stays behind when a region goes away.

## Event

`bridge--device:change` fires on the body each time something changes. The
snapshot is in `event.detail`.

## Styling

### Tailwind v4

```css
@import "tailwindcss";
@import "@cammi-technology/apple-hardware-bridge-component/css/duo-tailwind.css";
```

Adds the variants `duo-inner`, `duo-outer`, `duo-book`, `duo-laptop`,
`duo-open`, `duo-landscape` and `duo-inner-portrait` (the inner screen
held upright), `device-iphone` and `device-ipad`, plus:

* `native`: inside the app. Hide a heading the navigation bar
  already shows with `native:hidden`, and let the app's background
  show with `native:bg-transparent`.
* `duo-spread`: on the inner screen held sideways, open flat or in
  book mode, two columns with the fold in the gap between them. Flat
  and book look the same, so opening or closing the hinge moves
  nothing. The gap is `--duo-book-gap`: the fold's width plus
  0.75rem each side, and at least 4.5rem. It sits on the fold itself,
  from `--device-fold-x`, so it stays on the crease when one margin is
  wider than the other. An app that sends no fold position gets the
  middle of the screen, and a wider 6rem gap to be safe.
* `duo-right-page`: what the cover screen shows first. In the spread it
  fills the right page, from the top. On the cover it comes first, and
  everything from the left page comes underneath. Opening the phone
  leaves it in place, and the left page appears beside it. Put
  `duo-spread` straight on the body's grid, and the header sits on the
  left page, level with it.
* `duo-left-page`: in the same spread, keeps something that spans the page,
  such as a header or a footer, to the left page.
* `safe-padding`: padding that keeps clear of the safe area, the native
  bars, the iPad sidebar and the covered regions, plus a 16px gap so
  content never touches a bar. Change the gap with
  `--safe-padding-gap`. It needs `viewport-fit=cover`.

### Plain CSS

`css/duo.css` adds a `.duo-grid` class: one column on a phone, two on
the inner screen, with the hinge in the gutter in book mode. It also
adds `.duo-spread`, `.duo-left-page`, `.safe-padding` and
`.native-hidden`.

The older names `duo-native`, `duo-safe-padding` and `.duo-native-hidden`
still work.

## Text sizes

A web view does not follow the phone's text size setting by itself. To
follow it, set the root font from Dynamic Type, and size text in `rem`:

```css
html {
  font: -apple-system-body;
  line-height: 1.5;
}
```

The demo does this. On the iPhone Duo and iPhone 16 simulators, from
the default size up to the largest accessibility size, its text grows
and wraps, the heading stays hidden behind the native title, and
`safe-padding` still keeps clear of the right-hand column. The
padding floor is a fixed 16px, so large text does not widen the
margins.

## A see-through web view

To let the app's background show behind the page, make the web view
clear when you set up Hotwire Native:

```swift
Hotwire.config.makeCustomWebView = { configuration in
    let webView = WKWebView(frame: .zero, configuration: configuration)
    webView.isOpaque = false
    webView.backgroundColor = .clear
    webView.scrollView.backgroundColor = .clear
    return webView
}
```

## iOS notes

The hinge uses `UIHingeInteraction`, the fold uses the view's
"division" reserved region and the covered regions use its "occlusion"
reserved regions. All three are iOS 27.1 APIs. The hinge decides
whether the phone is half open; the fold region is only the fallback.
Reserved regions have no change callback, so a hidden view on the page
sends a new snapshot after every layout and safe area change. They sit behind
`#if compiler(>=6.4)` and runtime availability checks.

## Which device

Each snapshot has a `device` object:

```json
{ "model": "iPhone18,2", "name": "iPhone 17 Pro Max", "idiom": "phone" }
```

| Field | Where it comes from |
| --- | --- |
| `model` | `uname()`, or `SIMULATOR_MODEL_IDENTIFIER` in the simulator |
| `name` | A table in `DeviceInfo.swift`, from Xcode's simulator device profiles |
| `idiom` | The trait collection's `userInterfaceIdiom` |

A model missing from the table reads `Unknown iPhone`, `Unknown iPad`
and so on. A device sold in several versions, such as Wi-Fi and
cellular, can have more than one identifier. The simulator profiles
give one each, so a sibling reads as unknown until it is added.

### Privacy

The component never sends the name the owner gave the device, such as
"Rachel's iPhone". That name is personal. Since iOS 16
`UIDevice.current.name` returns only "iPhone" or "iPad" unless the
app has a special entitlement from Apple.

The model and marketing name say which kind of device it is, not
whose. They still add detail a server could use to tell visitors
apart, so only send them to your own pages.

Old apps send no `device`. Then the three attributes are not set, and
pages still work.

## Phones and iPads without a hinge

On the iPhone 17 Pro Max, the iPhone Air and the iPads:

* `data-device-display` is `single` and `data-device-foldable` is
  `false`.
* There is no `data-device-posture`. The app still sends `closed`, and
  the controller leaves it off.
* The `duo-*` variants do not match, so a Duo layout falls back to
  its default.
* Size classes follow the window: `regular` both ways on an iPad in
  full screen. In Split View or a small Stage Manager window the width
  can be `compact`.
* Use widths (`md:` and so on) for layout, and `device-iphone` or
  `device-ipad` only for what really differs by device.

Occlusion reserved regions are iOS 27.1 APIs. The iPhone 17 Pro Max,
iPhone Air and iPad simulators only run iOS 27.0, so they report no
regions, and `safe-padding` uses the safe area alone. On those
iPhones the safe area already keeps clear of the Dynamic Island.
What iOS 27.1 reports on them is not known yet.
