@testable import AppleHardwareBridgeComponent
import XCTest

final class PostureTests: XCTestCase {
    private typealias Snapshot = DeviceComponent.Snapshot
    private typealias Hinge = DeviceComponent.HingeState

    private let activeFold = DeviceComponent.Fold(active: true, x: 0, y: 0, width: 20, height: 600)
    private let inactiveFold = DeviceComponent.Fold(active: false, x: 0, y: 0, width: 20, height: 600)

    func test_isFolded_trustsTheHingeOverAStaleFold() {
        // Fully open, but the fold region has not cleared yet.
        XCTAssertFalse(Snapshot.isFolded(hinge: Hinge(status: "fullyOpen", angle: 180), fold: activeFold))
        XCTAssertTrue(Snapshot.isFolded(hinge: Hinge(status: "partiallyOpen", angle: 110), fold: inactiveFold))
    }

    func test_isFolded_fallsBackToTheFoldWithoutAHinge() {
        XCTAssertTrue(Snapshot.isFolded(hinge: nil, fold: activeFold))
        XCTAssertTrue(Snapshot.isFolded(hinge: Hinge(status: "unknown", angle: 0), fold: activeFold))
        XCTAssertFalse(Snapshot.isFolded(hinge: nil, fold: inactiveFold))
        XCTAssertFalse(Snapshot.isFolded(hinge: nil, fold: nil))
    }

    /// Closed, open, book, open, closed: the order that left the page in book.
    func test_posture_followsTheHingeThroughBookAndBack() {
        let steps: [(hinge: Hinge, inner: Bool, expected: String)] = [
            (Hinge(status: "closed", angle: 0), false, "closed"),
            (Hinge(status: "fullyOpen", angle: 180), true, "open"),
            (Hinge(status: "partiallyOpen", angle: 110), true, "book"),
            (Hinge(status: "fullyOpen", angle: 180), true, "open"),
            (Hinge(status: "closed", angle: 0), false, "closed")
        ]

        for step in steps {
            // The fold region stays active the whole time, as the worst case.
            let folded = Snapshot.isFolded(hinge: step.hinge, fold: activeFold)
            let posture = Snapshot.posture(
                inner: step.inner,
                foldable: true,
                folded: folded,
                landscape: true,
                foldIsVertical: activeFold.isVertical
            )
            XCTAssertEqual(posture, step.expected, "hinge \(step.hinge.status)")
        }
    }

    func test_posture_laptopWhenTheFoldRunsSideToSide() {
        XCTAssertEqual(Snapshot.posture(inner: true, foldable: true, folded: true, landscape: false, foldIsVertical: false), "laptop")
    }

    func test_posture_singleScreenPhoneIsClosed() {
        XCTAssertEqual(Snapshot.posture(inner: false, foldable: false, folded: false, landscape: false, foldIsVertical: nil), "closed")
    }
}
