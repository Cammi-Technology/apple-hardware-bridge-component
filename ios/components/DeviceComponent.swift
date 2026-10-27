import HotwireNative
import UIKit

/// Tells the web layer how the phone is being held: the hinge, the fold,
/// the screen, the orientation, the size classes, the safe area and what
/// covers the screen (the Dynamic Island), with a posture that sums them up. Replies to "connect" with a snapshot, then again whenever
/// any of it changes, so the page can lay itself out for an iPhone Duo.
///
/// Web usage (the `bridge--device` controller does this on the body):
/// ```js
/// this.send("connect", {}, (message) => apply(message.data))
/// ```
///
/// On a phone without a hinge the hinge reads "none", the fold is absent
/// and the posture is "closed" or "open" by the screen alone.
public final class DeviceComponent: BridgeComponent {
    override public nonisolated class var name: String { "device" }

    private var observers: [NSObjectProtocol] = []
    private var layoutObserver: LayoutObserverView?
    private var traitRegistration: (any UITraitChangeRegistration)?
    private var hinge: HingeState?
    private var lastSent: Snapshot?
    private var connected = false

    /// The view controller showing the web page. Private, so it never
    /// clashes with a `viewController` helper the host app defines.
    private var hostViewController: UIViewController? {
        delegate?.destination as? UIViewController
    }

    override public func onReceive(message: Message) {
        guard let event = Event(rawValue: message.event) else { return }

        switch event {
        case .connect:
            connected = true
            // Every connect gets a reply, even if nothing has changed since
            // the last one. A pull to refresh reloads the page but keeps this
            // component, and the new page has none of the old values.
            lastSent = nil
            startObserving()
            send()
        case .disconnect:
            connected = false
            lastSent = nil
            stopObserving()
        }
    }

    override public func onViewDidAppear() {
        guard connected else { return }
        startObserving()
        send()
    }

    override public func onViewWillDisappear() {
        stopObserving()
    }

    // MARK: Observing

    private func startObserving() {
        guard observers.isEmpty, let view = hostViewController?.view else { return }

        let center = NotificationCenter.default
        for name in [UIDevice.orientationDidChangeNotification, UIScene.didActivateNotification, UIApplication.didBecomeActiveNotification] {
            observers.append(center.addObserver(forName: name, object: nil, queue: .main) { [weak self] _ in
                MainActor.assumeIsolated { self?.send() }
            })
        }

        traitRegistration = view.registerForTraitChanges(
            [UITraitHorizontalSizeClass.self, UITraitVerticalSizeClass.self]
        ) { [weak self] (_: UIView, _) in
            self?.send()
        }

        attachHingeInteraction(to: view)
        attachLayoutObserver(to: view)
    }

    /// The safe area and the Dynamic Island can change with no notification,
    /// for example when a Live Activity grows, or the iPad sidebar opens
    /// or closes over the page. An empty view that fills the page hears
    /// about every layout and safe area change, and sends again.
    private func attachLayoutObserver(to view: UIView) {
        guard layoutObserver == nil else { return }
        let observer = LayoutObserverView { [weak self] in self?.send() }
        // Not hidden: UIKit may skip safe area updates for a hidden view.
        // On an iPad the page kept the sidebar's 280 point margin after
        // the sidebar closed. It draws nothing and takes no touches.
        observer.backgroundColor = nil
        observer.isUserInteractionEnabled = false
        observer.accessibilityElementsHidden = true
        observer.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(observer)
        NSLayoutConstraint.activate([
            observer.topAnchor.constraint(equalTo: view.topAnchor),
            observer.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            observer.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            observer.trailingAnchor.constraint(equalTo: view.trailingAnchor)
        ])
        layoutObserver = observer
    }

    private func stopObserving() {
        observers.forEach { NotificationCenter.default.removeObserver($0) }
        observers.removeAll()
        if let traitRegistration, let view = hostViewController?.view {
            view.unregisterForTraitChanges(traitRegistration)
        }
        traitRegistration = nil
        detachHingeInteraction()
        layoutObserver?.removeFromSuperview()
        layoutObserver = nil
    }

    // MARK: Sending

    private func send() {
        guard connected, let view = hostViewController?.view else { return }

        let snapshot = Snapshot(view: view, hinge: hinge)
        guard snapshot != lastSent else { return }
        lastSent = snapshot

        reply(to: Event.connect.rawValue, with: snapshot)
    }
}

// MARK: - iOS 27.1: the hinge and the fold

#if compiler(>=6.4)
private extension DeviceComponent {
    func attachHingeInteraction(to view: UIView) {
        guard #available(iOS 27.1, *) else { return }
        guard !view.interactions.contains(where: { $0 is UIHingeInteraction }) else { return }

        let interaction = UIHingeInteraction { [weak self] _, update in
            guard let self else { return }
            if let hinge = update.hinge {
                self.hinge = HingeState(status: hinge.status, angle: hinge.angle)
            } else {
                self.hinge = nil
            }
            self.send()
            // The fold region and the layout settle just after the hinge
            // moves. Send again once they have, with the fold's new frame.
            Task { @MainActor [weak self] in self?.send() }
        }
        view.addInteraction(interaction)
    }

    func detachHingeInteraction() {
        guard #available(iOS 27.1, *), let view = hostViewController?.view else { return }
        view.interactions.filter { $0 is UIHingeInteraction }.forEach(view.removeInteraction)
    }
}

@available(iOS 27.1, *)
private extension DeviceComponent.HingeState {
    init(status: UIHinge.Status, angle: CGFloat) {
        self.status = switch status {
        case .closed: "closed"
        case .partiallyOpen: "partiallyOpen"
        case .fullyOpen: "fullyOpen"
        default: "unknown"
        }
        self.angle = Double(angle) * 180 / .pi
    }
}

private extension DeviceComponent.Fold {
    /// The fold, from the view's reserved "division" region (iOS 27.1).
    init?(view: UIView) {
        guard #available(iOS 27.1, *),
              let region = view.reservedRegions(kind: .division, options: .includeInactive).first
        else { return nil }
        active = region.isActive
        x = region.frame.minX
        y = region.frame.minY
        width = region.frame.width
        height = region.frame.height
    }
}
private extension DeviceComponent.Region {
    /// What covers the screen, such as the Dynamic Island, from the
    /// view's "occlusion" reserved regions (iOS 27.1).
    static func occlusions(in view: UIView) -> [Self] {
        guard #available(iOS 27.1, *) else { return [] }
        return view.reservedRegions(kind: .occlusion, options: .includeInactive).map {
            Self(active: $0.isActive, x: $0.frame.minX, y: $0.frame.minY, width: $0.frame.width, height: $0.frame.height)
        }
    }
}
#else
private extension DeviceComponent {
    func attachHingeInteraction(to view: UIView) {}
    func detachHingeInteraction() {}
}

private extension DeviceComponent.Fold {
    init?(view: UIView) { nil }
}

private extension DeviceComponent.Region {
    static func occlusions(in view: UIView) -> [Self] { [] }
}
#endif

// MARK: - What's sent

extension DeviceComponent {
    enum Event: String {
        case connect
        case disconnect
    }

    struct HingeState: Encodable, Equatable {
        var status: String
        /// Degrees: 0 closed, 180 flat
        var angle: Double
    }

    struct Fold: Encodable, Equatable {
        var active: Bool
        var x: CGFloat
        var y: CGFloat
        var width: CGFloat
        var height: CGFloat

        /// Runs top to bottom (a book) rather than side to side.
        var isVertical: Bool { height > width }
    }

    struct Screen: Encodable, Equatable {
        /// "inner", "outer" or "single" (an ordinary iPhone)
        var display: String
        var width: CGFloat
        var height: CGFloat
        var scale: CGFloat
        var nativeWidth: CGFloat
        var nativeHeight: CGFloat
    }

    /// The view's safe area insets, in points.
    struct Insets: Encodable, Equatable {
        var top: CGFloat
        var left: CGFloat
        var bottom: CGFloat
        var right: CGFloat
    }

    /// A part of the screen that something else covers, in the view's
    /// coordinates.
    struct Region: Encodable, Equatable {
        var active: Bool
        var x: CGFloat
        var y: CGFloat
        var width: CGFloat
        var height: CGFloat
    }

    struct SizeClass: Encodable, Equatable {
        var horizontal: String
        var vertical: String
    }

    struct Snapshot: Encodable, Equatable {
        /// "closed", "open", "book", "laptop" or "tent"
        var posture: String
        var foldable: Bool
        var hinge: HingeState
        var fold: Fold?
        var screen: Screen
        var orientation: String
        var sizeClass: SizeClass
        var safeArea: Insets
        var occlusions: [Region]
        /// Which device this is. See DeviceInfo.swift.
        var device: DeviceInfo

        init(view: UIView, hinge: HingeState?) {
            let traits = view.traitCollection
            let scene = view.window?.windowScene
            let bounds = view.window?.bounds ?? view.bounds
            let sizeClass = SizeClass(
                horizontal: traits.horizontalSizeClass == .regular ? "regular" : "compact",
                vertical: traits.verticalSizeClass == .regular ? "regular" : "compact"
            )
            let fold = Fold(view: view)
            let regularBothWays = sizeClass.horizontal == "regular" && sizeClass.vertical == "regular"
            let phone = traits.userInterfaceIdiom == .phone
            let foldable = fold != nil || hinge != nil || (phone && regularBothWays)
            let inner = foldable && regularBothWays
            let display = foldable ? (inner ? "inner" : "outer") : "single"
            let hingeState = hinge ?? HingeState(status: foldable ? "unknown" : "none", angle: foldable ? 0 : 180)
            let folded = Snapshot.isFolded(hinge: hinge, fold: fold)
            let landscape = bounds.width > bounds.height

            self.foldable = foldable
            self.hinge = hingeState
            self.fold = fold
            self.screen = Screen(
                display: display,
                width: bounds.width,
                height: bounds.height,
                scale: traits.displayScale,
                nativeWidth: scene?.screen.nativeBounds.width ?? bounds.width * traits.displayScale,
                nativeHeight: scene?.screen.nativeBounds.height ?? bounds.height * traits.displayScale
            )
            self.orientation = switch scene?.interfaceOrientation {
            case .portrait: "portrait"
            case .portraitUpsideDown: "portraitUpsideDown"
            case .landscapeLeft: "landscapeLeft"
            case .landscapeRight: "landscapeRight"
            default: landscape ? "landscapeLeft" : "portrait"
            }
            self.sizeClass = sizeClass
            let insets = view.safeAreaInsets
            self.safeArea = Insets(top: insets.top, left: insets.left, bottom: insets.bottom, right: insets.right)
            self.occlusions = Region.occlusions(in: view)
            self.device = DeviceInfo.current(idiom: traits.userInterfaceIdiom)
            self.posture = Snapshot.posture(
                inner: inner,
                foldable: foldable,
                folded: folded,
                landscape: landscape,
                foldIsVertical: fold?.isVertical
            )
        }

        /// Half open, like a book or a laptop. The hinge decides when there
        /// is one: the fold region can still read as active for a moment
        /// after the hinge opens fully, and nothing tells us when it clears,
        /// so trusting it here left the page stuck in book mode. The fold is
        /// only the fallback when there is no hinge to ask.
        static func isFolded(hinge: HingeState?, fold: Fold?) -> Bool {
            if let hinge, hinge.status != "unknown" {
                return hinge.status == "partiallyOpen"
            }
            return fold?.active ?? false
        }

        static func posture(inner: Bool, foldable: Bool, folded: Bool, landscape: Bool, foldIsVertical: Bool?) -> String {
            if !inner {
                return (foldable && folded && landscape) ? "tent" : "closed"
            } else if folded {
                return (foldIsVertical ?? landscape) ? "book" : "laptop"
            } else {
                return "open"
            }
        }
    }
}

// MARK: - Layout observer

/// Calls back whenever its own layout or safe area changes. It fills the
/// page's view, so that is whenever the page's do.
private final class LayoutObserverView: UIView {
    private let onChange: () -> Void

    init(onChange: @escaping () -> Void) {
        self.onChange = onChange
        super.init(frame: .zero)
    }

    @available(*, unavailable)
    required init?(coder: NSCoder) { fatalError("init(coder:) is not used") }

    override func layoutSubviews() {
        super.layoutSubviews()
        onChange()
    }

    override func safeAreaInsetsDidChange() {
        super.safeAreaInsetsDidChange()
        onChange()
    }

    override func updateConstraints() {
        super.updateConstraints()
        onChange()
    }
}
