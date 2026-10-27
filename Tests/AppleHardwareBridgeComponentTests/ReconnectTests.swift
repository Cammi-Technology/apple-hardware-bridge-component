@testable import AppleHardwareBridgeComponent
import HotwireNative
import UIKit
import WebKit
import XCTest

/// A pull to refresh reloads the page but keeps the component. The new
/// page connects again, and it must get the snapshot again.
@MainActor
final class ReconnectTests: XCTestCase {
    func test_everyConnectGetsAReply() async throws {
        let delegate = FakeBridgeDelegate()
        let component = DeviceComponent(destination: delegate.viewController, delegate: delegate)

        component.didReceive(message: connectMessage(id: "1"))
        try await delegate.waitForReplies(1)

        // The same page again, after a reload: nothing has changed.
        component.didReceive(message: connectMessage(id: "1"))
        try await delegate.waitForReplies(2)

        XCTAssertEqual(delegate.replies.count, 2)
        XCTAssertEqual(delegate.replies.map(\.component), ["device", "device"])
    }

    private func connectMessage(id: String) -> Message {
        Message(id: id, component: "device", event: "connect",
                metadata: .init(url: "https://example.com/"), jsonData: "{}")
    }
}

@MainActor
private final class FakeBridgeDelegate: BridgingDelegate {
    let viewController = FakeDestination()
    private(set) var replies: [Message] = []

    var location: String { "https://example.com/" }
    var destination: BridgeDestination? { viewController }
    var webView: WKWebView? { nil }

    func webViewDidBecomeActive(_ webView: WKWebView) {}
    func webViewDidBecomeDeactivated() {}
    func reply(with message: Message) async throws -> Bool {
        replies.append(message)
        return true
    }

    func onViewDidLoad() {}
    func onViewWillAppear() {}
    func onViewDidAppear() {}
    func onViewWillDisappear() {}
    func onViewDidDisappear() {}

    func component<C: BridgeComponent>() -> C? { nil }

    func bridgeDidInitialize() {}
    func bridgeDidReceiveMessage(_ message: Message) -> Bool { false }

    func waitForReplies(_ count: Int) async throws {
        for _ in 0..<100 where replies.count < count {
            try await Task.sleep(nanoseconds: 10_000_000)
        }
    }
}

private final class FakeDestination: UIViewController, BridgeDestination {}
