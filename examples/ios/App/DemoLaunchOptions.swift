import HotwireNative
import UIKit

/// Debug builds only: start in a given orientation, for screenshots taken
/// from the command line, where `simctl` has no way to rotate.
///
/// ```bash
/// xcrun simctl launch booted tech.cammi.duo -DemoOrientation landscape
/// ```
enum DemoLaunchOptions {
    static func apply(to scene: UIWindowScene) {
        #if DEBUG
        let mask: UIInterfaceOrientationMask
        switch UserDefaults.standard.string(forKey: "DemoOrientation") {
        case "landscape": mask = .landscapeRight
        case "portrait": mask = .portrait
        default: return
        }
        DispatchQueue.main.async {
            scene.requestGeometryUpdate(.iOS(interfaceOrientations: mask)) { error in
                print("DemoOrientation: \(error.localizedDescription)")
            }
        }
        #endif
    }

    /// Debug builds only: open a page on top of the first one, so a
    /// screenshot shows the back button.
    ///
    /// ```bash
    /// xcrun simctl launch booted tech.cammi.duo -DemoPath safe-areas.html
    /// ```
    static func open(in navigator: Navigator) {
        #if DEBUG
        guard let path = UserDefaults.standard.string(forKey: "DemoPath") else { return }
        DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
            navigator.route(AppShell.page(path))
        }
        #endif
    }
}
