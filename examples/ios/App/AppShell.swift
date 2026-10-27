import HotwireNative
import UIKit

/// The demo's native chrome, like Reminders.
///
/// Tabs on every device, each with its own navigation stack. The tab bar
/// controller places them itself: at the bottom on iPhone, in a column
/// on the iPhone Duo, at the top or in a sidebar on iPad. The Duo keeps
/// its tabs on every screen, the cover screen included.
///
/// Set `tabsOnEveryDevice` to false for the old layout: tabs on iPad and
/// the Duo only, and one navigation stack on other iPhones.
enum AppShell {
    static let tabsOnEveryDevice = true

    static let features = HotwireTab(
        id: "features", title: "Features", image: UIImage(systemName: "square.grid.2x2"),
        url: page("features.html")
    )
    /// The Features page is the main screen, and it shows the layout
    /// itself, so there is no Layout tab. features.html and the site
    /// root are the same page.
    static let about = HotwireTab(
        id: "about", title: "About", image: UIImage(systemName: "info.circle"),
        url: page("about.html")
    )

    /// Tabs everywhere, or with `tabsOnEveryDevice` off, tabs on iPad
    /// and on the iPhone Duo and none on other iPhones.
    ///
    /// The idiom tells an iPad. The Duo has the phone idiom, so it is told
    /// by its model identifier. Its screen size class is no help here: it
    /// changes when the phone opens, and the Pro Max models are regular
    /// width in landscape too.
    static func usesTabs(idiom: UIUserInterfaceIdiom) -> Bool {
        #if DEBUG
        if UserDefaults.standard.bool(forKey: "DemoForceTabs") { return true }
        #endif
        return tabsOnEveryDevice || idiom == .pad || DemoDevice.isDuo
    }

    static func page(_ path: String) -> URL {
        rootURL.appendingPathComponent(path)
    }
}

/// The tab bar for iPad and the Duo.
final class DemoTabBarController: HotwireTabBarController {
    override func viewDidLoad() {
        super.viewDidLoad()
        if #available(iOS 18.0, *) {
            mode = .tabSidebar
        }
    }
}

/// Which device the demo runs on, from its model identifier. The
/// simulator reports the model it simulates in its environment.
enum DemoDevice {
    static let model: String = {
        #if targetEnvironment(simulator)
        if let model = ProcessInfo.processInfo.environment["SIMULATOR_MODEL_IDENTIFIER"] {
            return model
        }
        #endif
        var info = utsname()
        uname(&info)
        return withUnsafeBytes(of: &info.machine) { bytes in
            String(decoding: bytes.prefix { $0 != 0 }, as: UTF8.self)
        }
    }()

    /// iPhone19,4, as Xcode's iPhone Duo simulator profile lists it.
    static var isDuo: Bool { model == "iPhone19,4" }
}
