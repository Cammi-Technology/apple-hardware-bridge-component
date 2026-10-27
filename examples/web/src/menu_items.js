// The native "…" menu on the main page.
//
// On a narrow screen, where one pane shows at a time, the first item
// switches to the other pane. Then comes one item per hardware card,
// in the cards' order, and each opens that card's page. Posture only
// shows where the device can fold.
//
//   switches: from paneState: [{ name, pressed }], empty when wide
//   cards:    [{ href, foldableOnly }] in the cards' order
//   folding:  false on an iPhone or an iPad in the app
export function menuItems({ switches, cards, folding }) {
  const other = switches.find((entry) => !entry.pressed)
  return [
    ...(other ? [{ kind: "pane", name: other.name }] : []),
    ...cards.filter((card) => folding || !card.foldableOnly).map((card) => ({ kind: "card", href: card.href }))
  ]
}
