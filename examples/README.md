# Examples

A demo site and a demo iOS app, to see the iPhone Duo layouts working.

## The layout idea

One grid. Tailwind reads the `data-device-*` attributes on the body.

| Screen | Grid |
| --- | --- |
| Cover | One column. Only the cover content shows. |
| Open sideways, and book | A page either side of the fold, with the fold in the gap. Headers and footers stay on the left page. Opening the hinge moves nothing. |
| Laptop | One column. |

```html
<main class="grid grid-cols-1 md:grid-cols-2
             duo-inner:grid-cols-2 duo-outer:grid-cols-1 duo-spread">
  <section aria-labelledby="main-title" class="duo-outer:hidden">
    <h2 id="main-title">Main page</h2>
  </section>
  <aside aria-labelledby="cover-title">
    <h2 id="cover-title">Cover content</h2>
  </aside>
</main>
```

On a wide screen, such as an iPad or a phone in landscape, `md:` gives
two columns too. `duo-outer:grid-cols-1` keeps the cover screen to one.

## Pages and native controls

The site is a tour of the hardware features. The main page, the site
root (`index.html`, also served as `features.html`), lists them and
shows the layout itself: two panes, a cover screen and the fold. Each
feature opens a detail page with its live values and a snippet. Every
card has a disclosure arrow to show it opens. The Posture page draws the phone as
it is held right now, and turns it to match a moment after it moves.

The pages cover the hardware features only. Around them the app uses
standard iOS navigation chrome:

| Native part | Where it shows |
| --- | --- |
| Navigation bar title and back button | Everywhere. Pages push onto a stack. |
| Tabs: Features and About | Every device. At the bottom on iPhone, in the side column on every iPhone Duo screen, at the top or in a sidebar on iPad. Set `AppShell.tabsOnEveryDevice` to false for tabs on iPad and the Duo only. |
| Add button: a prominent **+** toolbar item with a native menu | Pages with `bridge--add-button`. On the iPhone Duo the system puts it at the bottom of the vertical bar, above the tab bar. |
| Menu, share and toast | From the `bridge-components` Swift and npm packages. |

The add button is a small bridge component in the demo app,
`AddButtonComponent`, with the `bridge--add-button` controller. It sits
inside the safe area, so it stays clear of the home indicator and the
Duo's status bar column.

Debug builds take launch arguments for screenshots:

```bash
xcrun simctl launch booted tech.cammi.duo -DemoPath device.html   # push a page
xcrun simctl launch booted tech.cammi.duo -DemoForceTabs YES      # tabs, when tabsOnEveryDevice is off
```

## Run it

1. Serve the site:

   ```bash
   cd examples/web
   npm install
   npm start
   ```

2. Build and run the app on the iPhone Duo simulator:

   ```bash
   cd examples/ios
   xcodegen generate
   xcodebuild -project DuoDemo.xcodeproj -scheme DuoDemo \
     -destination 'platform=iOS Simulator,name=iPhone Duo' \
     -derivedDataPath build build
   xcrun simctl install booted build/Build/Products/Debug-iphonesimulator/DuoDemo.app
   xcrun simctl launch booted tech.cammi.duo
   ```

   For another device, pick its simulator, such as
   `name=iPhone 17 Pro Max` or `name=iPad Pro 11-inch (M5)`. Debug
   builds take `-DemoOrientation landscape` as a launch argument on an
   iPhone. An iPad rotates with the device only.

3. Take a screenshot of the current posture:

   ```bash
   xcrun simctl io booted screenshot cover.png
   ```

Change posture with the buttons at the bottom of the DeviceHub window.

## Where the app finds the site

The app reads `DemoSiteURL` from its Info.plist. That comes from the
`DEMO_SITE_URL` build setting in `examples/ios/project.yml`.

| Build | URL |
| --- | --- |
| Debug | `http://localhost:4321` |
| Release (TestFlight) | `https://cammi-technology.github.io/apple-hardware-bridge-component/`, on GitHub Pages |

Release builds drop the `NSAllowsLocalNetworking` exception, so a
TestFlight build only loads https. Pass `DEMO_SITE_URL=https://...` to
override the Release URL for one build.

The site itself has no host name in it. Every link is relative, so it
works under any host name.

## The public demo site (GitHub Pages)

TestFlight builds load `https://cammi-technology.github.io/apple-hardware-bridge-component/`.

It is served from the `gh-pages` branch, which holds only the built
files from `examples/web/public`. To update it, run `npm run build` in
`examples/web` and commit the contents of `public` to `gh-pages`.
Every link in the site is relative, so it works under the
`/apple-hardware-bridge-component/` path.

The site is public. Keep it free of anything private.
