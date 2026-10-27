@testable import AppleHardwareBridgeComponent
import UIKit
import XCTest

final class DeviceInfoTests: XCTestCase {
    private typealias DeviceInfo = DeviceComponent.DeviceInfo

    func test_name_forTheSupportedDevices() {
        let expected: [(model: String, idiom: UIUserInterfaceIdiom, name: String)] = [
            ("iPhone19,4", .phone, "iPhone Duo"),
            ("iPhone18,2", .phone, "iPhone 17 Pro Max"),
            ("iPhone18,4", .phone, "iPhone Air"),
            ("iPad17,2", .pad, "iPad Pro 11-inch (M5)"),
            ("iPad16,2", .pad, "iPad mini (A17 Pro)")
        ]
        for device in expected {
            let info = DeviceInfo(model: device.model, idiom: device.idiom)
            XCTAssertEqual(info.name, device.name, device.model)
            XCTAssertEqual(info.model, device.model)
        }
    }

    func test_name_forBothVersionsOfEachIPad() {
        XCTAssertEqual(DeviceInfo.name(forModel: "iPad16,3", idiom: .pad), "iPad Pro 11-inch (M4)")
        XCTAssertEqual(DeviceInfo.name(forModel: "iPad16,4", idiom: .pad), "iPad Pro 11-inch (M4)")
        XCTAssertEqual(DeviceInfo.name(forModel: "iPad16,5", idiom: .pad), "iPad Pro 13-inch (M4)")
        XCTAssertEqual(DeviceInfo.name(forModel: "iPad17,1", idiom: .pad), "iPad Pro 11-inch (M5)")
        XCTAssertEqual(DeviceInfo.name(forModel: "iPad15,8", idiom: .pad), "iPad (A16)")
    }

    func test_table_everyIdentifierHasAFamilyAndAName() {
        XCTAssertGreaterThan(DeviceInfo.marketingNames.count, 100)
        for (model, name) in DeviceInfo.marketingNames {
            XCTAssertTrue(model.hasPrefix("iPhone") || model.hasPrefix("iPad"), model)
            XCTAssertTrue(model.contains(","), model)
            XCTAssertFalse(name.isEmpty, model)
            XCTAssertTrue(name.hasPrefix(model.hasPrefix("iPad") ? "iPad" : "iPhone"), "\(model): \(name)")
        }
    }

    func test_name_fallsBackToTheFamilyAndTheIdentifierForAnUnknownModel() {
        XCTAssertEqual(DeviceInfo.name(forModel: "iPhone99,9", idiom: .phone), "iPhone (iPhone99,9)")
        XCTAssertEqual(DeviceInfo.name(forModel: "iPad99,9", idiom: .pad), "iPad (iPad99,9)")
        XCTAssertEqual(DeviceInfo.name(forModel: "MacBookPro99,9", idiom: .pad), "Mac (MacBookPro99,9)")
    }

    func test_name_fallsBackToTheIdiomWhenTheModelSaysNothing() {
        XCTAssertEqual(DeviceInfo.name(forModel: "arm64", idiom: .phone), "iPhone (arm64)")
        XCTAssertEqual(DeviceInfo.name(forModel: "", idiom: .pad), "iPad")
        XCTAssertEqual(DeviceInfo.name(forModel: "x86_64", idiom: .unspecified), "Device (x86_64)")
    }

    func test_idiom() {
        XCTAssertEqual(DeviceInfo.idiom(.phone), "phone")
        XCTAssertEqual(DeviceInfo.idiom(.pad), "pad")
        XCTAssertEqual(DeviceInfo.idiom(.mac), "mac")
        XCTAssertEqual(DeviceInfo.idiom(.unspecified), "unspecified")
    }

    func test_currentModel_isTheSimulatedOrRealModel() {
        let model = DeviceInfo.currentModel
        XCTAssertFalse(model.isEmpty)
        #if targetEnvironment(simulator)
        if let simulated = ProcessInfo.processInfo.environment["SIMULATOR_MODEL_IDENTIFIER"] {
            XCTAssertEqual(model, simulated)
        }
        #endif
    }

    /// The page reads these keys. Renaming one breaks the page.
    func test_encodesModelNameAndIdiom() throws {
        let data = try JSONEncoder().encode(DeviceInfo(model: "iPhone18,4", idiom: .phone))
        let json = try XCTUnwrap(JSONSerialization.jsonObject(with: data) as? [String: String])
        XCTAssertEqual(json, ["model": "iPhone18,4", "name": "iPhone Air", "idiom": "phone"])
    }
}
