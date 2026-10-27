import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync, readdirSync, existsSync } from "node:fs"

const dir = new URL("../public/", import.meta.url)
const read = (page) => readFileSync(new URL(page, dir), "utf8")
const pages = readdirSync(dir).filter((f) => f.endsWith(".html"))

test("features.html is the main page, the same as the site root", () => {
  const withoutNote = read("features.html").replace(/  <!-- The same page as the site root[\s\S]*?<link rel="canonical" href="\.\/">\n/, "")
  assert.equal(withoutNote, read("index.html"))
})

test("every URL the installed apps load still exists", () => {
  for (const page of ["index.html", "features.html", "about.html", "device.html", "safe-areas.html", "posture.html"]) {
    assert.ok(existsSync(new URL(page, dir)), page)
  }
})

test("no link points at a page that is not there", () => {
  for (const page of pages) {
    for (const [, href] of read(page).matchAll(/href="([^"#:]+\.html)"/g)) {
      assert.ok(existsSync(new URL(href, dir)), `${page} links to ${href}`)
    }
  }
})

test("every feature card links to its page and shows an arrow", () => {
  const html = read("index.html")
  const cards = html.match(/<article[\s\S]*?<\/article>/g)
  assert.equal(cards.length, 4)
  for (const card of cards) {
    assert.match(card, /<a href="[a-z-]+\.html" class="after:absolute after:inset-0/, "the whole card is one link")
    assert.match(card, /<svg aria-hidden="true"[^>]*class="[^"]*rtl:rotate-180/, "a disclosure arrow that flips right to left")
    assert.equal((card.match(/<a /g) ?? []).length, 1, "no links inside the card's link")
  }
})

test("the About footer links to Cammi at cammi.app", () => {
  const footer = read("about.html").match(/<footer[\s\S]*?<\/footer>/)[0]
  assert.match(footer, /href="https:\/\/cammi\.app"/)
  assert.doesNotMatch(footer, /cammi\.tech/)
  assert.match(footer, /href="https:\/\/motivationquiz\.fun"/)
})

test("each page has one hero for the right page, which comes first on the cover", () => {
  for (const page of pages) {
    const heroes = read(page).replace(/<pre[\s\S]*?<\/pre>/g, "").match(/class="[^"]*\bduo-right-page\b/g) ?? []
    assert.equal(heroes.length, 1, `${page} has ${heroes.length} right-page heroes`)
  }
  for (const page of ["index.html", "features.html", "posture.html"]) {
    assert.match(read(page), /class="duo-right-page duo-hero/, `${page}'s hero fills the cover`)
  }
})
