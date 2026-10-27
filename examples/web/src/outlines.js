// Which outlines to draw over the page: every area the layout keeps
// clear of. The boxes are placed by the same CSS variables the layout
// uses, so they follow the device live.
//
//   on:          the switch
//   occlusions:  how many regions cover the screen (data-device-occlusions)
//   fold:        the app sent a fold (data-device-fold active or inactive)
//   gap:         the page has a fold gap (--duo-book-gap is set)
//   safe:        the app sent a safe area
export function outlineBoxes({ on, occlusions = 0, fold = false, gap = false, safe = false }) {
  if (!on) return []
  const boxes = []
  if (safe) boxes.push({ kind: "safe", label: "Safe area" })
  const count = Math.min(Number(occlusions) || 0, 4)
  for (let i = 1; i <= count; i++) boxes.push({ kind: "covered", index: i, label: count > 1 ? `Covered ${i}` : "Covered" })
  if (fold) boxes.push({ kind: "fold", label: "Fold" })
  if (gap) boxes.push({ kind: "gap", label: "Fold gap" })
  return boxes
}
