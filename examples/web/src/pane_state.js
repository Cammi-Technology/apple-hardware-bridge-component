// Which panes show, given whether both fit and which one was chosen.
//
//   names:   the panes in the page, in order, e.g. ["list", "glance"]
//   wide:    true when both fit side by side
//   current: the chosen pane, or null for the default (the last one:
//            the glance, which is also what the Duo's cover screen shows)
export function paneState({ names, wide, current }) {
  const chosen = names.includes(current) ? current : names[names.length - 1]
  return {
    current: chosen,
    visible: wide ? [...names] : [chosen],
    // Switching only makes sense when one pane shows at a time.
    switches: wide ? [] : names.map((name) => ({ name, pressed: name === chosen }))
  }
}
