// swift-tools-version: 5.9

// Apple Hardware Bridge Component: a Hotwire Native bridge component that
// tells web pages about the Apple hardware they run on, starting with the
// iPhone Duo's screens, hinge and posture.

import PackageDescription

let package = Package(
    name: "AppleHardwareBridgeComponent",
    defaultLocalization: "en",
    platforms: [
        .iOS("17.0")
    ],
    products: [
        .library(name: "AppleHardwareBridgeComponent", targets: ["AppleHardwareBridgeComponent"])
    ],
    dependencies: [
        .package(
            url: "https://github.com/hotwired/hotwire-native-ios.git",
            "1.2.0"..<"1.4.0"
        )
    ],
    targets: [
        .target(
            name: "AppleHardwareBridgeComponent",
            dependencies: [
                .product(name: "HotwireNative", package: "hotwire-native-ios")
            ],
            path: "ios"
        ),
        .testTarget(
            name: "AppleHardwareBridgeComponentTests",
            dependencies: ["AppleHardwareBridgeComponent"],
            path: "Tests/AppleHardwareBridgeComponentTests"
        )
    ]
)
