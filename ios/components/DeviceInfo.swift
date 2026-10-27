import UIKit

extension DeviceComponent {
    /// Which device the page runs on: the hardware model identifier, its
    /// marketing name and the interface idiom.
    ///
    /// This is never the name the owner gave the device ("Rachel's
    /// iPhone"). That name is personal, and since iOS 16
    /// `UIDevice.current.name` only returns it to apps with a special
    /// entitlement. The model identifier says which kind of device it
    /// is, not whose.
    struct DeviceInfo: Encodable, Equatable {
        /// The hardware model identifier, such as "iPhone18,2".
        var model: String
        /// The marketing name, such as "iPhone 17 Pro Max", or the family
        /// and identifier, "iPhone (iPhone99,1)", for a model not in the
        /// table.
        var name: String
        /// "phone", "pad", "mac", "tv", "carPlay", "vision" or "unspecified".
        var idiom: String

        init(model: String, idiom: UIUserInterfaceIdiom) {
            self.model = model
            self.name = Self.name(forModel: model, idiom: idiom)
            self.idiom = Self.idiom(idiom)
        }

        /// The device the app is running on.
        static func current(idiom: UIUserInterfaceIdiom) -> Self {
            Self(model: currentModel, idiom: idiom)
        }

        /// The simulator reports the Mac's CPU ("arm64") as its machine,
        /// so read the model it simulates from its environment instead.
        static let currentModel: String = {
            #if targetEnvironment(simulator)
            if let model = ProcessInfo.processInfo.environment["SIMULATOR_MODEL_IDENTIFIER"], !model.isEmpty {
                return model
            }
            #endif
            var info = utsname()
            uname(&info)
            return withUnsafeBytes(of: &info.machine) { bytes in
                String(decoding: bytes.prefix { $0 != 0 }, as: UTF8.self)
            }
        }()

        /// The marketing name. A model missing from the table reads as
        /// its family and the identifier, "iPad (iPad99,1)", so the page
        /// can always say something useful.
        static func name(forModel model: String, idiom: UIUserInterfaceIdiom) -> String {
            if let name = marketingNames[model] { return name }
            let known = ["iPhone", "iPad", "iPod", "Mac"].first(where: model.hasPrefix) ?? family(of: idiom)
            return model.isEmpty ? known : "\(known) (\(model))"
        }

        private static func family(of idiom: UIUserInterfaceIdiom) -> String {
            switch idiom {
            case .phone: "iPhone"
            case .pad: "iPad"
            case .mac: "Mac"
            default: "Device"
            }
        }

        static func idiom(_ idiom: UIUserInterfaceIdiom) -> String {
            switch idiom {
            case .phone: "phone"
            case .pad: "pad"
            case .mac: "mac"
            case .tv: "tv"
            case .carPlay: "carPlay"
            case .vision: "vision"
            default: "unspecified"
            }
        }

        /// Model identifiers and marketing names, from Xcode 27.1's
        /// simulator device profiles: every identifier each profile
        /// represents (`representedModelIdentifiers`), so the Wi-Fi and
        /// cellular versions of an iPad are both here. A model missing
        /// from the table reads as its family and identifier, such as
        /// "iPad (iPad99,1)".
        static let marketingNames: [String: String] = [
            // iPhone
            "iPhone8,1": "iPhone 6s",
            "iPhone8,2": "iPhone 6s Plus",
            "iPhone8,4": "iPhone SE (1st generation)",
            "iPhone9,1": "iPhone 7",
            "iPhone9,2": "iPhone 7 Plus",
            "iPhone9,3": "iPhone 7",
            "iPhone9,4": "iPhone 7 Plus",
            "iPhone10,1": "iPhone 8",
            "iPhone10,2": "iPhone 8 Plus",
            "iPhone10,3": "iPhone X",
            "iPhone10,4": "iPhone 8",
            "iPhone10,5": "iPhone 8 Plus",
            "iPhone10,6": "iPhone X",
            "iPhone11,2": "iPhone Xs",
            "iPhone11,4": "iPhone Xs Max",
            "iPhone11,6": "iPhone Xs Max",
            "iPhone11,8": "iPhone Xʀ",
            "iPhone12,1": "iPhone 11",
            "iPhone12,3": "iPhone 11 Pro",
            "iPhone12,5": "iPhone 11 Pro Max",
            "iPhone12,8": "iPhone SE (2nd generation)",
            "iPhone13,1": "iPhone 12 mini",
            "iPhone13,2": "iPhone 12",
            "iPhone13,3": "iPhone 12 Pro",
            "iPhone13,4": "iPhone 12 Pro Max",
            "iPhone14,2": "iPhone 13 Pro",
            "iPhone14,3": "iPhone 13 Pro Max",
            "iPhone14,4": "iPhone 13 mini",
            "iPhone14,5": "iPhone 13",
            "iPhone14,6": "iPhone SE (3rd generation)",
            "iPhone14,7": "iPhone 14",
            "iPhone14,8": "iPhone 14 Plus",
            "iPhone15,2": "iPhone 14 Pro",
            "iPhone15,3": "iPhone 14 Pro Max",
            "iPhone15,4": "iPhone 15",
            "iPhone15,5": "iPhone 15 Plus",
            "iPhone16,1": "iPhone 15 Pro",
            "iPhone16,2": "iPhone 15 Pro Max",
            "iPhone17,1": "iPhone 16 Pro",
            "iPhone17,2": "iPhone 16 Pro Max",
            "iPhone17,3": "iPhone 16",
            "iPhone17,4": "iPhone 16 Plus",
            "iPhone17,5": "iPhone 16e",
            "iPhone18,1": "iPhone 17 Pro",
            "iPhone18,2": "iPhone 17 Pro Max",
            "iPhone18,3": "iPhone 17",
            "iPhone18,4": "iPhone Air",
            "iPhone18,5": "iPhone 17e",
            "iPhone19,2": "iPhone 18 Pro",
            "iPhone19,3": "iPhone 18 Pro Max",
            "iPhone19,4": "iPhone Duo",
            "iPhone19,7": "iPhone 18 Pro Max",
            // iPad
            "iPad5,1": "iPad mini 4",
            "iPad5,2": "iPad mini 4",
            "iPad5,3": "iPad Air 2",
            "iPad5,4": "iPad Air 2",
            "iPad6,3": "iPad Pro (9.7-inch)",
            "iPad6,4": "iPad Pro (9.7-inch)",
            "iPad6,7": "iPad Pro (12.9-inch) (1st generation)",
            "iPad6,8": "iPad Pro (12.9-inch) (1st generation)",
            "iPad6,11": "iPad (5th generation)",
            "iPad6,12": "iPad (5th generation)",
            "iPad7,1": "iPad Pro (12.9-inch) (2nd generation)",
            "iPad7,2": "iPad Pro (12.9-inch) (2nd generation)",
            "iPad7,3": "iPad Pro (10.5-inch)",
            "iPad7,4": "iPad Pro (10.5-inch)",
            "iPad7,5": "iPad (6th generation)",
            "iPad7,6": "iPad (6th generation)",
            "iPad7,11": "iPad (7th generation)",
            "iPad7,12": "iPad (7th generation)",
            "iPad8,1": "iPad Pro (11-inch) (1st generation)",
            "iPad8,2": "iPad Pro (11-inch) (1st generation)",
            "iPad8,3": "iPad Pro (11-inch) (1st generation)",
            "iPad8,4": "iPad Pro (11-inch) (1st generation)",
            "iPad8,5": "iPad Pro (12.9-inch) (3rd generation)",
            "iPad8,6": "iPad Pro (12.9-inch) (3rd generation)",
            "iPad8,7": "iPad Pro (12.9-inch) (3rd generation)",
            "iPad8,8": "iPad Pro (12.9-inch) (3rd generation)",
            "iPad8,9": "iPad Pro (11-inch) (2nd generation)",
            "iPad8,10": "iPad Pro (11-inch) (2nd generation)",
            "iPad8,11": "iPad Pro (12.9-inch) (4th generation)",
            "iPad8,12": "iPad Pro (12.9-inch) (4th generation)",
            "iPad11,1": "iPad mini (5th generation)",
            "iPad11,2": "iPad mini (5th generation)",
            "iPad11,3": "iPad Air (3rd generation)",
            "iPad11,4": "iPad Air (3rd generation)",
            "iPad11,6": "iPad (8th generation)",
            "iPad11,7": "iPad (8th generation)",
            "iPad12,1": "iPad (9th generation)",
            "iPad12,2": "iPad (9th generation)",
            "iPad13,1": "iPad Air (4th generation)",
            "iPad13,2": "iPad Air (4th generation)",
            "iPad13,4": "iPad Pro (11-inch) (3rd generation)",
            "iPad13,5": "iPad Pro (11-inch) (3rd generation)",
            "iPad13,6": "iPad Pro (11-inch) (3rd generation)",
            "iPad13,7": "iPad Pro (11-inch) (3rd generation)",
            "iPad13,8": "iPad Pro (12.9-inch) (5th generation)",
            "iPad13,9": "iPad Pro (12.9-inch) (5th generation)",
            "iPad13,10": "iPad Pro (12.9-inch) (5th generation)",
            "iPad13,11": "iPad Pro (12.9-inch) (5th generation)",
            "iPad13,16": "iPad Air (5th generation)",
            "iPad13,17": "iPad Air (5th generation)",
            "iPad13,18": "iPad (10th generation)",
            "iPad13,19": "iPad (10th generation)",
            "iPad14,1": "iPad mini (6th generation)",
            "iPad14,2": "iPad mini (6th generation)",
            "iPad14,3": "iPad Pro (11-inch) (4th generation)",
            "iPad14,4": "iPad Pro (11-inch) (4th generation)",
            "iPad14,5": "iPad Pro (12.9-inch) (6th generation)",
            "iPad14,6": "iPad Pro (12.9-inch) (6th generation)",
            "iPad14,8": "iPad Air 11-inch (M2)",
            "iPad14,9": "iPad Air 11-inch (M2)",
            "iPad14,10": "iPad Air 13-inch (M2)",
            "iPad14,11": "iPad Air 13-inch (M2)",
            "iPad15,3": "iPad Air 11-inch (M3)",
            "iPad15,4": "iPad Air 11-inch (M3)",
            "iPad15,5": "iPad Air 13-inch (M3)",
            "iPad15,6": "iPad Air 13-inch (M3)",
            "iPad15,7": "iPad (A16)",
            "iPad15,8": "iPad (A16)",
            "iPad16,1": "iPad mini (A17 Pro)",
            "iPad16,2": "iPad mini (A17 Pro)",
            "iPad16,3": "iPad Pro 11-inch (M4)",
            "iPad16,4": "iPad Pro 11-inch (M4)",
            "iPad16,5": "iPad Pro 13-inch (M4)",
            "iPad16,6": "iPad Pro 13-inch (M4)",
            "iPad16,8": "iPad Air 11-inch (M4)",
            "iPad16,9": "iPad Air 11-inch (M4)",
            "iPad16,10": "iPad Air 13-inch (M4)",
            "iPad16,11": "iPad Air 13-inch (M4)",
            "iPad17,1": "iPad Pro 11-inch (M5)",
            "iPad17,2": "iPad Pro 11-inch (M5)",
            "iPad17,3": "iPad Pro 13-inch (M5)",
            "iPad17,4": "iPad Pro 13-inch (M5)"
        ]
    }
}
