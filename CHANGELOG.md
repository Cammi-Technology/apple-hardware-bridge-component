# Changelog

## 0.2.0, 27 Oct 2026

* A device with no hinge, such as an iPad, no longer gets
  `data-device-posture="closed"`. With `foldable: false` the controller
  sets no posture at all, so posture variants only apply on a foldable.
* Add `duo-spread` and `duo-left-page`: on the inner screen held
  sideways, open or in book mode, the page is a two-page spread, with
  the fold in the gap. Opening the hinge moves nothing. The gap sits on the fold,
  from `--device-fold-x`, with 0.75rem each side and at least 4.5rem;
  6rem when the app sends no fold position. `.duo-grid` uses the same
  gap.
* Add the `duo-inner-portrait` variant: the inner screen held upright.
* Add `duo-right-page`: the cover screen's content fills the right page
  of the spread and stays in place when the phone opens. On the cover
  it comes first, with everything from the left page underneath.
* Add the motion language: `--duo-move-delay`, `--duo-move-duration`
  and `--duo-move-ease`, off with reduced motion. `.duo-grid` uses it.
* `safe-padding` adds a 16px gap past the safe area, so content no
  longer touches the navigation bar, the tabs or the iPad sidebar. Set
  `--safe-padding-gap` to change it.
* The device table has every iPhone and iPad identifier in Xcode's
  simulator profiles, Wi-Fi and cellular versions included. A model
  it does not know reads as "iPad (iPad99,1)", not "Unknown iPad".
* The page hears when the iPad sidebar opens or closes, so its margin
  follows.
* Send the device's model identifier, marketing name and idiom as
  `device` in the snapshot, and as `data-device-model`,
  `data-device-name` and `data-device-idiom`. Add the `device-iphone`
  and `device-ipad` variants.
* Check the layouts on the iPhone 17 Pro Max, iPhone Air, iPad Pro
  11-inch (M5) and iPad mini (A17 Pro) simulators.
* Demo: landmarks, one `h1` kept for screen readers with
  `native:sr-only`, two columns on wide screens, reduced motion and a
  dark background in the browser.
* Renamed from hotwire-native-iphone-duo to Apple Hardware Bridge
  Component. The Swift module is now `AppleHardwareBridgeComponent` and
  the npm name `@cammi-technology/apple-hardware-bridge-component`. The
  bridge component is still called `device`.
* Add the safe area and the regions that cover the screen, such as the
  Dynamic Island, to the snapshot.
* Add the `native` variant and the `safe-padding` utility. The older
  `duo-native` and `duo-safe-padding` names still work.
* Leave book mode when the hinge opens fully.

* Extract `DeviceComponent` (Swift) and `bridge--device` (Stimulus)
  from the Cammi iOS and Rails apps.
* Add Tailwind v4 variants and a plain CSS `.duo-grid`.
