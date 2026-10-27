// Checks every demo page for sideways overflow, at phone, iPad and
// iPhone Duo widths, in each posture, with the iPad's tabs at the top
// or its sidebar open, and with text at 200%.
//
//   npm run check:overflow
//
// With --shift (npm run check:shift) it opens each page on the inner
// screen held sideways, folds it from flat to book mode, and fails if
// anything moves up or down, or grows, by more than 2px.
//
// With --fold (npm run check:fold) it checks the iPhone Duo's inner
// screen instead, open and in book mode. In book mode no text and no
// card, border or button may touch the crease, or come within 0.75rem.
//
// It serves public/ on a local port, and loads one page in headless
// Chrome that opens each case in a sized iframe and measures it. Set
// CHROME to use another Chrome. Exits 1 if anything overflows.
import { createServer } from "node:http"
import { readFile } from "node:fs/promises"
import { execFile } from "node:child_process"
import { extname, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = fileURLToPath(new URL("../public/", import.meta.url))
const chrome = process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
const pages = ["index.html", "features.html", "device.html", "safe-areas.html", "dynamic-island.html", "posture.html", "about.html"]
const twoPanes = ["index.html", "features.html"]
const foldMode = process.argv.includes("--fold")
const shiftMode = process.argv.includes("--shift")
// Opening and closing the hinge on the inner screen held sideways: from
// open flat to book mode, nothing should move up or down.
// Opening from the cover screen to the inner screen: what the cover
// shows first is the right page of the spread, so it should keep its
// place from the right edge and its top. It fills the right page, so
// its width can grow.
const coverCases = [1000, 1210].map((openWidth) =>
  ({ width: 466, display: "outer", posture: "closed", orientation: "portrait", native: true, openWidth, fold: 40, foldX: openWidth / 2 - 20 }))
const shiftCases = [...coverCases, ...[1000, 1210].flatMap((width) => [40, 120].flatMap((fold) => [{}, { right: 84 }].map((safe) =>
  ({ width, display: "inner", posture: "open", orientation: "landscape-left", fold, foldX: width / 2 - fold / 2, native: true, safe, shiftTo: "book" }))))]
// The inner screen in book and open mode. The crease is 40px as the
// Duo reports it, or a wider 120px zone. The side column with the tabs
// sits right, left or nowhere, and the crease can be off centre, so the
// pages must put the gap on the crease itself. "noFrame" is an app that
// sends no fold position: the page guesses the middle.
const foldCases = [1000, 1210].flatMap((width) => [40, 120].flatMap((fold) => ["book", "open"].flatMap((posture) => [
  { width, display: "inner", posture, fold, foldX: width / 2 - fold / 2, native: true },
  { width, display: "inner", posture, fold, foldX: width / 2 - fold / 2, native: true, safe: { right: 84, top: 24 } },
  { width, display: "inner", posture, fold, foldX: width / 2 - fold / 2, native: true, safe: { left: 84, top: 24 } },
  { width, display: "inner", posture, fold, foldX: width / 2 - fold / 2 + 60, native: true, safe: { right: 84 } }
]))).concat([
  { width: 1000, display: "inner", posture: "book", fold: 40, foldX: 480, native: true, text: 2 },
  { width: 1000, display: "inner", posture: "book", fold: 40, foldX: 480, native: true, noFrame: true }
])
const overflowCases = [
  ...[320, 390, 440, 744, 834, 1000].map((width) => ({ width })),
  { width: 466, display: "outer", posture: "closed" },
  { width: 800, display: "inner", posture: "open" },
  { width: 1000, display: "inner", posture: "open" },
  { width: 1000, display: "inner", posture: "book", fold: 40 },
  { width: 1210, display: "inner", posture: "book", fold: 40 },
  { width: 390, text: 2 },
  { width: 1000, display: "inner", posture: "book", fold: 40, text: 2 },
  // iPads, as the app sees them: not foldable, so no posture, and a
  // navigation bar at the top.
  // With the tabs at the top the page has the whole width. With the
  // sidebar open, it floats over the page's leading 280 points.
  ...[744, 820, 834, 1024, 1112, 1194, 1210, 1366].flatMap((width) => [
    { width, ipad: "tabs", safe: { top: 86 } },
    { width, ipad: "sidebar", safe: { top: 86, left: 280 } }
  ]),
  { width: 1194, ipad: "tabs", safe: { top: 86 }, text: 2 },
  // The iPhone Duo held upright: the inner screen in portrait, open or
  // half shut like a laptop, and the cover screen. The yellow glance
  // must fill the width, on top of the list.
  ...["open", "laptop"].flatMap((posture) => [700, 800].map((width) =>
    ({ width, display: "inner", posture, orientation: "portrait", glanceFull: true }))),
  { width: 466, display: "outer", posture: "closed", orientation: "portrait", glanceFull: true }
]
const cases = shiftMode ? shiftCases : foldMode ? foldCases : overflowCases
// The Features page shows one pane at a time when narrow: check both.
const runs = pages.flatMap((page) => cases.flatMap((c) =>
  twoPanes.includes(page) ? ["glance", "list"].map((pane) => ({ page, ...c, pane })) : [{ page, ...c }]))

const harness = `<!doctype html><meta charset="utf-8"><body><pre id="result"></pre><script>
const runs = ${JSON.stringify(runs)}
const results = []
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
// What touches the fold band: the crease plus 0.75rem each side. Text counts
// by its own line boxes, so a short line in a wide paragraph is fine.
// Boxes count when they paint something: a background, a border, a
// ring or shadow, or a control. Plain layout boxes do not.
function foldOffenders(doc, win, run) {
  const lo = run.foldX - 12, hi = run.foldX + run.fold + 12
  const hits = new Set()
  const label = (el) => el.tagName.toLowerCase() + (typeof el.className === "string" && el.className.trim() ? "." + el.className.trim().split(/\s+/).slice(0, 3).join(".") : "")
  // Hidden, or clipped away for screen readers only (sr-only).
  const clipped = (el) => { for (let e = el; e && e !== doc.body; e = e.parentElement) if (win.getComputedStyle(e).clipPath === "inset(50%)") return true; return false }
  const skip = (el) => el.closest("[hidden], [data-fold-ignore], [data-outline-overlay]") || win.getComputedStyle(el).visibility === "hidden" || clipped(el)
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT)
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const el = node.parentElement
    if (!node.textContent.trim() || !el || skip(el)) continue
    const range = doc.createRange()
    range.selectNodeContents(node)
    // Text scrolled out of view in a scroll box, such as a code
    // example, cannot be seen, so only count what is inside the box.
    let box = null
    for (let e = el; e && e !== doc.body; e = e.parentElement) {
      if (win.getComputedStyle(e).overflowX !== "visible") { box = e.getBoundingClientRect(); break }
    }
    const seen = (r) => box ? { left: Math.max(r.left, box.left), right: Math.min(r.right, box.right) } : r
    if ([...range.getClientRects()].map(seen).some((r) => r.right - r.left > 1 && r.right > lo && r.left < hi)) hits.add(label(el))
  }
  for (const el of doc.body.querySelectorAll("*")) {
    if (skip(el)) continue
    const style = win.getComputedStyle(el)
    const painted = style.backgroundColor !== "rgba(0, 0, 0, 0)" || style.boxShadow !== "none" ||
      ["Top", "Right", "Bottom", "Left"].some((side) => parseFloat(style["border" + side + "Width"]) > 0) ||
      ["BUTTON", "INPUT", "IMG", "svg"].includes(el.tagName)
    if (!painted) continue
    const r = el.getBoundingClientRect()
    if (r.width > 1 && r.height > 1 && r.right > lo && r.left < hi) hits.add(label(el))
  }
  return [...hits].slice(0, 5)
}
// On the Duo held upright the glance spans the grid's full width, and
// comes before the list.
function glanceProblem(doc, win) {
  const glance = doc.getElementById("pane-glance")
  if (!glance || glance.hidden) return ""
  let grid = glance.parentElement
  while (grid && win.getComputedStyle(grid).display === "contents") grid = grid.parentElement
  const style = win.getComputedStyle(grid)
  const inner = grid.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)
  const width = glance.getBoundingClientRect().width
  if (Math.abs(width - inner) > 1) return "glance " + Math.round(width) + "px wide in a " + Math.round(inner) + "px grid"
  const list = doc.getElementById("pane-list")
  if (list && !list.hidden && list.getBoundingClientRect().top < glance.getBoundingClientRect().top) return "glance is below the list"
  return ""
}
async function check(run) {
  if (run.pane) sessionStorage.setItem("panes:/" + run.page, run.pane)
  const frame = document.createElement("iframe")
  frame.style.cssText = "border:0;width:" + run.width + "px;height:900px"
  document.body.append(frame)
  await new Promise((resolve) => { frame.onload = resolve; frame.src = "/" + run.page })
  await wait(300)
  const doc = frame.contentDocument
  // Measure the end state, not the middle of the gap's animation.
  doc.head.insertAdjacentHTML("beforeend", "<style>*, *::before, *::after { transition: none !important; }</style>")
  if (run.display) Object.assign(doc.body.dataset, { deviceDisplay: run.display, deviceFoldable: "true" })
  if (run.posture) doc.body.dataset.devicePosture = run.posture
  if (run.orientation) doc.body.dataset.deviceOrientation = run.orientation
  if (run.fold && !run.noFrame && !run.openWidth) doc.body.style.setProperty("--device-fold-width", run.fold + "px")
  if (run.foldX != null && !run.noFrame && !run.openWidth) {
    doc.body.style.setProperty("--device-fold-x", run.foldX + "px")
    doc.body.dataset.deviceFold = "active"
  }
  if (run.native) doc.documentElement.dataset.bridgePlatform = "ios"
  if (run.ipad) Object.assign(doc.body.dataset, { deviceIdiom: "pad", deviceDisplay: "single", deviceFoldable: "false", deviceSizeH: "regular" })
  for (const [side, points] of Object.entries(run.safe ?? {})) doc.body.style.setProperty("--device-safe-" + side, points + "px")
  if (run.text) doc.documentElement.style.fontSize = (16 * run.text) + "px"
  doc.body.dispatchEvent(new Event("bridge--device:change", { bubbles: true }))
  await wait(300)
  // Measure the end state: wait for any move to finish.
  for (let i = 0; i < 40 && doc.getAnimations().length; i++) await wait(100)
  let shifted = []
  if (run.openWidth && run.pane !== "list") {
    const target = () => doc.querySelector("#pane-glance:not([hidden]), .duo-right-page")
    const box = (el, w) => { const r = el.getBoundingClientRect(); return { rightGap: w - r.right, top: r.top, width: r.width } }
    const el = target()
    if (el) {
      const before = box(el, frame.contentWindow.innerWidth)
      frame.style.width = run.openWidth + "px"
      Object.assign(doc.body.dataset, { deviceDisplay: "inner", devicePosture: "open", deviceOrientation: "landscape-left", deviceFold: "active" })
      doc.body.style.setProperty("--device-fold-width", run.fold + "px")
      doc.body.style.setProperty("--device-fold-x", run.foldX + "px")
      doc.body.dispatchEvent(new Event("bridge--device:change", { bubbles: true }))
      await wait(300)
      for (let i = 0; i < 40 && doc.getAnimations().length; i++) await wait(100)
      const after = box(target(), frame.contentWindow.innerWidth)
      const d = { rightGap: after.rightGap - before.rightGap, top: after.top - before.top, width: after.width - before.width }
      if (Math.abs(d.rightGap) > 4 || Math.abs(d.top) > 8) {
        shifted.push("cover content moved: right edge " + Math.round(d.rightGap) + "px, top " + Math.round(d.top) + "px, width " + Math.round(d.width) + "px")
      }
      results.coverDeltas = results.coverDeltas ?? []
      results.coverDeltas.push(run.page + " " + run.openWidth + ": right edge " + Math.round(d.rightGap) + ", top " + Math.round(d.top) + ", width " + Math.round(d.width))
    }
  }
  if (run.shiftTo) {
    const blocks = () => [...doc.body.querySelectorAll("header p, header, main, aside, section, article, footer, nav")]
      .filter((el) => el.getClientRects().length && !el.closest("[hidden], [data-fold-ignore]"))
    const before = new Map(blocks().map((el) => [el, el.getBoundingClientRect()]))
    doc.body.dataset.devicePosture = run.shiftTo
    doc.body.dispatchEvent(new Event("bridge--device:change", { bubbles: true }))
    await wait(300)
    for (let i = 0; i < 40 && doc.getAnimations().length; i++) await wait(100)
    for (const el of blocks()) {
      const was = before.get(el)
      if (!was) continue
      const now = el.getBoundingClientRect()
      const moved = Math.abs(now.top - was.top), grew = Math.abs(now.height - was.height)
      if (moved > 2 || grew > 2) shifted.push(el.tagName.toLowerCase() + (moved > 2 ? " moved " + Math.round(now.top - was.top) + "px" : " grew " + Math.round(now.height - was.height) + "px"))
    }
    shifted = shifted.slice(0, 5)
  }
  const width = frame.contentWindow.innerWidth
  const offenders = [...doc.body.querySelectorAll("*")]
    .filter((el) => el.getClientRects().length && el.getBoundingClientRect().right > width + 0.5)
    .filter((el) => !el.closest("[hidden], pre, [data-outline-overlay]"))
    .slice(0, 4)
    .map((el) => el.tagName.toLowerCase() + (el.className && typeof el.className === "string" ? "." + el.className.trim().split(/\\s+/).slice(0, 3).join(".") : ""))
  const scrollWidth = doc.documentElement.scrollWidth
  const glance = run.glanceFull && run.pane !== "list" ? glanceProblem(doc, frame.contentWindow) : ""
  const onFold = run.posture === "book" && run.foldX != null ? foldOffenders(doc, frame.contentWindow, run) : []
  results.push({ ...run, scrollWidth, width, offenders, onFold, glance, shifted, ok: scrollWidth <= width && offenders.length === 0 && onFold.length === 0 && !glance && shifted.length === 0 })
  frame.remove()
}
;(async () => {
  for (const run of runs) await check(run)
  document.getElementById("result").textContent = "@@" + "RESULT" + JSON.stringify(results.concat(results.coverDeltas ? [{ coverDeltas: results.coverDeltas, ok: true }] : [])) + "RESULT" + "@@"
})()
</script>`

const types = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript" }
const server = createServer(async (request, response) => {
  const path = new URL(request.url, "http://localhost").pathname
  if (path === "/__harness.html") return response.end(harness)
  try {
    const body = await readFile(join(root, path === "/" ? "index.html" : path))
    response.writeHead(200, { "content-type": types[extname(path)] ?? "application/octet-stream" })
    response.end(body)
  } catch {
    response.writeHead(404).end()
  }
})

server.listen(0, "127.0.0.1", () => {
  const { port } = server.address()
  execFile(chrome, ["--headless=new", "--disable-gpu", "--virtual-time-budget=600000", "--dump-dom",
    `http://127.0.0.1:${port}/__harness.html`], { maxBuffer: 1 << 24, timeout: 900000 }, (error, stdout) => {
    server.close()
    const match = stdout?.match(/@@RESULT(.*?)RESULT@@/s)
    if (error && !match) { console.error("Chrome failed:", error.message); process.exit(2) }
    if (!match) { console.error("No result from the page."); process.exit(2) }
    const results = JSON.parse(match[1].replaceAll("&quot;", '"').replaceAll("&amp;", "&").replaceAll("&lt;", "<").replaceAll("&gt;", ">"))
    for (const r of results.filter((r) => r.coverDeltas)) for (const line of r.coverDeltas) console.log("cover to open, " + line)
    const failed = results.filter((r) => !r.ok)
    for (const r of failed) {
      const label = [r.page, r.width + "px", r.ipad ? `iPad ${r.ipad}` : "", r.display, r.posture, r.pane, r.text ? `text ${r.text * 100}%` : ""].filter(Boolean).join(" ")
      const where = [r.fold ? `crease ${r.fold}px at ${r.foldX}` : "", r.safe?.right ? "column right" : "", r.safe?.left ? "column left" : "", r.noFrame ? "no fold frame" : ""].filter(Boolean).join(", ")
      if (r.onFold.length) console.log(`ON THE FOLD ${label} (${where}): ${r.onFold.join(", ")}`)
      if (r.glance) console.log(`GLANCE ${label}: ${r.glance}`)
      if (r.shifted.length && r.openWidth) console.log(`SHIFT ${label} opened to ${r.openWidth}px: ${r.shifted.join(", ")}`)
      else if (r.shifted.length) console.log(`SHIFT ${label} to ${r.shiftTo} (crease ${r.fold}px${r.safe?.right ? ", column right" : ""}): ${r.shifted.join(", ")}`)
      if (r.scrollWidth > r.width || r.offenders.length) console.log(`OVERFLOW ${label}: page ${r.scrollWidth}px wide in ${r.width}px. ${r.offenders.join(", ")}`)
    }
    console.log(`${results.length - failed.length} of ${results.length} cases fit.`)
    process.exit(failed.length ? 1 : 0)
  })
})
