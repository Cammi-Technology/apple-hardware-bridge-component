// The posture as the body's data-device-posture, or null to leave it off.
//
// Only a foldable, the iPhone Duo, has a posture. The native component
// sends "closed" for an ordinary iPhone or an iPad too, the same as the
// Duo's cover screen, so a snapshot with foldable: false sets no posture
// at all. Then no posture variant (duo-book, duo-open and so on) and no
// cover layout can ever apply on an iPad.
export function postureAttribute(device) {
  if (!device || device.foldable === false) return null
  return device.posture ?? null
}
