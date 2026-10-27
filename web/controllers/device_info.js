// Which device the page runs on, as the body's data attributes:
//
//   data-device-model="iPhone18,2"          the hardware model identifier
//   data-device-name="iPhone 17 Pro Max"    its marketing name
//   data-device-idiom="phone|pad|mac|..."   the interface idiom
//
// Older apps send no `device`. Then every value is null, and the
// controller removes the attributes.
export function deviceInfoAttributes(device) {
  const info = device?.device
  return {
    deviceModel: info?.model ?? null,
    deviceName: displayName(info),
    deviceIdiom: info?.idiom ?? null
  }
}

// A model missing from the app's table used to read "Unknown iPad".
// Show the family and the model identifier instead, "iPad (iPad16,3)",
// so the name is always some use. Newer apps send it this way already.
function displayName(info) {
  const name = info?.name
  if (!name) return null
  if (!name.startsWith("Unknown") || !info.model) return name
  const family = name.replace(/^Unknown\s*/, "")
  return `${family === "device" || !family ? "Device" : family} (${info.model})`
}
