import HotwireNative
import UIKit

/// Where the demo site lives. It comes from the DemoSiteURL key in
/// Info.plist, which is set per build by DEMO_SITE_URL in project.yml:
/// localhost for Debug (`npm start` in examples/web), and the public URL
/// for Release and TestFlight.
let rootURL: URL = {
    guard let text = Bundle.main.object(forInfoDictionaryKey: "DemoSiteURL") as? String,
          let url = URL(string: text), url.scheme != nil, url.host != nil
    else { fatalError("DemoSiteURL in Info.plist is missing or not a URL.") }
    return url
}()

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    /// One navigation stack, starting on the features page. Only used
    /// when `AppShell.tabsOnEveryDevice` is off, on iPhones other than
    /// the Duo.
    private lazy var navigator = Navigator(configuration:
        .init(name: "main", startLocation: AppShell.features.url)
    )

    /// Tabs: see AppShell.
    private lazy var tabBarController = DemoTabBarController(lazyLoadTabs: true)

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }

        window = UIWindow(windowScene: windowScene)
        if AppShell.usesTabs(idiom: windowScene.traitCollection.userInterfaceIdiom) {
            window?.rootViewController = tabBarController
            window?.makeKeyAndVisible()
            tabBarController.load([AppShell.features, AppShell.about])
            DemoLaunchOptions.open(in: tabBarController.activeNavigator)
        } else {
            window?.rootViewController = navigator.rootViewController
            window?.makeKeyAndVisible()
            navigator.start()
            DemoLaunchOptions.open(in: navigator)
        }
        DemoLaunchOptions.apply(to: windowScene)
    }
}
