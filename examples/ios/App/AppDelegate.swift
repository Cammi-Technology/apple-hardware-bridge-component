import HotwireNative
import AppleHardwareBridgeComponent
import BridgeComponents
import UIKit
import WebKit

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // The device component, the demo's add button, and the menu, share
        // and toast controls from the BridgeComponents package.
        let components: [BridgeComponent.Type] = [
            DeviceComponent.self, AddButtonComponent.self,
            MenuComponent.self, ShareComponent.self, ToastComponent.self
        ]
        Hotwire.registerBridgeComponents(components)
        Hotwire.config.debugLoggingEnabled = true

        // A see-through web view, so the app's own background shows behind
        // the page and follows dark mode. The page drops its background in
        // the app with native:bg-transparent.
        Hotwire.config.makeCustomWebView = { configuration in
            let webView = WKWebView(frame: .zero, configuration: configuration)
            #if DEBUG
            webView.isInspectable = true
            #endif
            webView.isOpaque = false
            webView.backgroundColor = .clear
            webView.scrollView.backgroundColor = .clear
            return webView
        }
        return true
    }
}
