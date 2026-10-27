// How far in from each edge the covered regions reach. All the regions
// together make one box. A tall box is a column down the left or right
// side; a wide one is a band across the top or bottom.
export function occlusionInsets(regions, width, height) {
  const insets = { top: 0, right: 0, bottom: 0, left: 0 }
  if (!regions.length) return insets

  const minX = Math.min(...regions.map((r) => r.x))
  const minY = Math.min(...regions.map((r) => r.y))
  const maxX = Math.max(...regions.map((r) => r.x + r.width))
  const maxY = Math.max(...regions.map((r) => r.y + r.height))

  if (maxY - minY >= maxX - minX) {
    if ((minX + maxX) / 2 >= width / 2) insets.right = Math.max(0, width - minX)
    else insets.left = Math.max(0, maxX)
  } else if ((minY + maxY) / 2 < height / 2) {
    insets.top = Math.max(0, maxY)
  } else {
    insets.bottom = Math.max(0, height - minY)
  }
  return insets
}
