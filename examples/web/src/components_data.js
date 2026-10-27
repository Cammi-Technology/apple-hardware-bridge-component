// The Apple components behind each feature of the demo, in one place.
// The feature cards and the detail pages render these. Every name is in
// the iOS 27.1 SDK; docs/ios-terms.md has the sources.
export const featureComponents = {
  device: {
    uikit: ["UITraitCollection.userInterfaceIdiom"],
    swiftui: [],
    demo: ["DeviceInfo.swift", "data-device-name"]
  },
  "safe-areas": {
    uikit: ["safeAreaInsets", "safeAreaLayoutGuide"],
    swiftui: [".safeAreaPadding", ".ignoresSafeArea"],
    demo: ["safe-padding", "--device-safe-*"]
  },
  posture: {
    uikit: ["UIHingeInteraction", "UIHinge.Status", "reservedRegions(kind: .division)"],
    swiftui: [],
    demo: ["data-device-posture", "--device-fold-*"]
  },
  "dynamic-island": {
    uikit: ["reservedRegions(kind: .occlusion)"],
    swiftui: ["ReservedRegion"],
    demo: ["--device-occlusion-*"]
  }
}

// The hardware names that matter on the device the page runs on.
export function deviceComponents({ idiom, display }) {
  if (display === "outer" || display === "inner") {
    return ["UIHingeInteraction", "reservedRegions(kind: .division)", "reservedRegions(kind: .occlusion)", "safeAreaInsets"]
  }
  if (idiom === "pad") return ["UITraitCollection.userInterfaceIdiom", "safeAreaInsets", "horizontalSizeClass"]
  if (idiom === "phone") return ["UITraitCollection.userInterfaceIdiom", "safeAreaInsets", "reservedRegions(kind: .occlusion)"]
  return []
}
