// Posture, hinge and fold details only mean something on a foldable,
// the iPhone Duo. In the app on any other iPhone or on an iPad the body
// has data-device-foldable="false", and they are hidden with the hidden
// attribute, so screen readers skip them too. In a browser nothing is
// known, so everything shows, as a guide to what the Duo sends.

export function showsFolding(dataset) {
  return dataset?.deviceFoldable !== "false"
}

// Hides or shows each element in `only` (folding details), and counts
// the features still showing. Works on anything with a `hidden` field.
export function applyFolding({ dataset, only = [], features = [] }) {
  const show = showsFolding(dataset)
  for (const el of only) el.hidden = !show
  return features.filter((el) => !el.hidden).length
}
