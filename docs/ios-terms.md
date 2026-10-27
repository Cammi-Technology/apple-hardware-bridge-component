# iOS terms

Apple's names for the parts of the screen this project talks about, and
the names you type in code, so everyone uses the same words.

Every Swift and SwiftUI name below was checked in the iOS 27.1 SDK: the
UIKit headers, and the SwiftUI and SwiftUI Core `.swiftinterface` files.
A dash means there is no such name.

Sources for what the parts do:

- **T1:** [Prepare your app for iPhone Duo](https://developer.apple.com/videos/play/tech-talks/111461/)
- **T2:** [Design for iPhone Duo](https://developer.apple.com/videos/play/tech-talks/111466/)
- **T3:** [Raise the Bar with iPhone Duo](https://developer.apple.com/videos/play/tech-talks/111462/)

## Tabs

| Part | Swift (UIKit) | SwiftUI | In the demo |
| --- | --- | --- | --- |
| tab bar controller | `UITabBarController` | `TabView` | `HotwireTabBarController` (Hotwire Native), subclassed as `DemoTabBarController` in `AppShell.swift` |
| tab bar | `UITabBar` (`tabBarController.tabBar`) | - | Drawn by the tab bar controller |
| a tab | `UITab` | `Tab` | Built from `HotwireTab` in `AppShell.swift` |
| a group of tabs | `UITabGroup` | `TabSection` | Not used |
| iPad tabs or sidebar | `UITabBarController.Mode`: `.automatic`, `.tabBar`, `.tabSidebar`, set with `mode` | `.tabViewStyle(.sidebarAdaptable)` | `mode = .tabSidebar` in `AppShell.swift` |
| sidebar settings | `UITabBarControllerSidebar` (`tabBarController.sidebar`), `preferredPlacement` | `.defaultTabBarPlacement(...)` | Not set |
| hide the tab bar | `isTabBarHidden`, `setTabBarHidden(_:animated:)` | - | Not used |
| prominent tab | `prominentTabIdentifier` (iOS 27) | - | Not used |
| bottom accessory | `bottomAccessory` (`UITabAccessory`) | `.tabViewBottomAccessory` | Not used |

The demo shows tabs on every device. The tab bar is iPhone and iPad;
the sidebar mode is for iPad and other wide screens. On the iPhone Duo the same `UITabBarController` lays its
tabs out vertically when appropriate (T1).

On iPad, `.tabSidebar` gives both: a button switches between the tabs
at the top and the sidebar. The tabs at the top float over the page,
under the navigation bar. The sidebar floats over the page's leading
edge, so the page's safe area grows on that side by the sidebar's
width (280 points on an 11-inch iPad), and shrinks back when it
closes. `safe-padding` follows it, plus a 16px gap.

## The iPhone Duo's side column

| Part | Swift (UIKit) | SwiftUI | In the demo |
| --- | --- | --- | --- |
| vertical bar | `UIVerticalBarBehavior` (`.automatic`, `.disabled`) | - | Left to the system |
| turn it off for a screen | `preferredVerticalBarBehavior` on `UIViewController` | `.toolbarVerticalBehavior(...)` | Not used |
| which side it is on | `UITraitCollection.verticalBarEdge` (`UIVerticalBarEdge`) | - | Not used |
| a bar item's axis | `UIBarButtonItem.axisBehavior` (`.horizontalOnly`, `.verticalPreferred`) | `.axisBehavior(...)` | Not set |
| what gives way first | `verticalBarCompressionBehavior` on `UINavigationItem` | `.toolbarVerticalCompressionBehavior(...)` | Not set |

Apple calls the side column the **vertical bar**. It holds the status bar,
the Dynamic Island, the tab bar, toolbar items and navigation controls
(T2, T3). "Gutter" is not Apple's word for it.

## Bars and buttons

| Part | Swift (UIKit) | SwiftUI | In the demo |
| --- | --- | --- | --- |
| navigation stack | `UINavigationController` | `NavigationStack` | `HotwireNavigationController` (Hotwire Native) |
| navigation bar | `UINavigationBar` | `.navigationTitle`, `.toolbar` | Shows each page's `<title>` |
| back button | `UINavigationItem.backBarButtonItem` | - (automatic) | Automatic |
| large title | `UINavigationItem.largeTitleDisplayMode` | `.toolbarTitleDisplayMode(...)` | Not used |
| bar button item | `UIBarButtonItem` | `ToolbarItem`, `ToolbarItemGroup` | The "…" menu and the + |
| prominent item | `UIBarButtonItem.Style.prominent` (iOS 26) | - | The + in `AddButtonComponent.swift` |
| prominent top action | `UINavigationItem.pinnedTrailingGroup` | `.topBarPinnedTrailing` placement | Not used |
| overflow menu | `UINavigationItem.additionalOverflowItems` | `ToolbarOverflowMenu` | Made by the system |
| toolbar | `UIToolbar`, `UIViewController.toolbarItems`, `UINavigationController.isToolbarHidden` | `.toolbar { ToolbarItem(...) }` | Holds the +, `AddButtonComponent.swift` |
| search | `UISearchController`, `UISearchBar`, `UISearchTab` | `.searchable(...)` | Not used |

"Floating action button" is Google's Material Design name for a round
action button. It is not in UIKit: Reminders' green + is a prominent
toolbar item.

## Screen areas

| Part | Swift (UIKit) | SwiftUI | In the demo |
| --- | --- | --- | --- |
| safe area | `safeAreaInsets`, `safeAreaLayoutGuide` | `.ignoresSafeArea(...)`, `.safeAreaPadding(...)` | Sent to the page as `--device-safe-*` |
| layout margins | `layoutMargins`, `directionalLayoutMargins` | `.contentMargins(...)` | Not used |
| reserved region | `UIView.reservedRegions(kind:options:)` (iOS 27.1) | `ReservedRegion` | `DeviceComponent.swift` |
| Dynamic Island and other covered areas | `reservedRegions(kind: .occlusion)` | `ReservedRegion` | Sent as `--device-occlusion-*` |
| the fold | `reservedRegions(kind: .division)` | `ReservedRegion` | Sent as `--device-fold-*` |
| hinge | `UIHinge`, `UIHingeInteraction`, `UIHinge.Status` (`.closed`, `.partiallyOpen`, `.fullyOpen`) | - | `DeviceComponent.swift` |
| split view columns | `UISplitViewController.Column`: `.primary`, `.supplementary`, `.secondary` | `NavigationSplitView` | Not used |
| home indicator | `prefersHomeIndicatorAutoHidden` | - | Not used |
| size class | `UITraitCollection.horizontalSizeClass`, `verticalSizeClass` | `@Environment(\.horizontalSizeClass)` | Sent as `data-device-size-*` |

"Outer display" and "inner display" are the talks' words for the cover
screen and the big screen (T1). "Book", "laptop" and "tent" are this
project's posture names. Apple's API gives the hinge status and angle,
and the talks say "pose".

| Posture | Device | Where it comes from |
| --- | --- | --- |
| `closed` | iPhone Duo, cover screen | Ours. The hinge status is Apple's `.closed` |
| `open` | iPhone Duo, inner screen, flat | Ours. Hinge `.fullyOpen` |
| `book`, `laptop` | iPhone Duo, half open | Ours. Hinge `.partiallyOpen`, and which way the fold runs |
| `tent` | iPhone Duo, cover screen, half open, landscape | Ours |
| none | No hinge: an ordinary iPhone or an iPad | The page sets no posture. There is no `UIHinge` to ask |

## Two-pane layout

Like a planner on the iPhone Duo: two panes side by side where they
fit, one at a time on a phone, switched from the "…" menu.

| Part | Swift (UIKit) | SwiftUI | In the demo |
| --- | --- | --- | --- |
| two panes | `UISplitViewController`, columns `.primary` and `.secondary` | `NavigationSplitView` | The `panes` Stimulus controller, `data-pane` |
| the "…" button and its menu | `UIBarButtonItem` with a `UIMenu` | `Menu` in a `ToolbarItem` | The `bridge--menu` component |
| a switch between two views | `UISegmentedControl` | `Picker` with the segmented style | The web switch, hidden in the app |
| a list of rows | `UICollectionView` with a list layout | `List` | The feature cards |
| the arrow that says a row opens something | `UITableViewCell.AccessoryType.disclosureIndicator`, `UICellAccessory.disclosureIndicator()` | Shown by `NavigationLink` in a `List` | The arrow on each feature card |
| the fold between the panes | `reservedRegions(kind: .division)` | `ReservedRegion` | `duo-spread`, `--duo-book-gap` |

Apple's design guides call the "…" control a
[pull-down button](https://developer.apple.com/design/human-interface-guidelines/pull-down-buttons),
and the two-pane layout a
[split view](https://developer.apple.com/design/human-interface-guidelines/split-views).

## Menus, sheets and alerts

| Part | Swift (UIKit) | SwiftUI | In the demo |
| --- | --- | --- | --- |
| menu | `UIMenu`, `UIAction` | `Menu` | The + menu, `AddButtonComponent.swift` |
| menu on tap | `UIButton.showsMenuAsPrimaryAction`, or `UIBarButtonItem(image:menu:)` | `Menu` | The + |
| context menu | `UIContextMenuInteraction` | `.contextMenu` | Not used |
| sheet | `UISheetPresentationController` | `.sheet(...)` | Not used |
| popover | `UIPopoverPresentationController` | `.popover(...)` | Not used |
| alert | `UIAlertController` | `.alert(...)`, `.confirmationDialog(...)` | Not used |
| pull to refresh | `UIRefreshControl` | `.refreshable` | On every page, from Hotwire Native |
