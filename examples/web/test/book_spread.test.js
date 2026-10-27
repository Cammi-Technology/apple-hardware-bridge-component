import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"

const dir = new URL("../public/", import.meta.url)
const pages = readdirSync(dir).filter((f) => f.endsWith(".html"))

test("every page is a two-page spread in book mode", () => {
  assert.ok(pages.length >= 6)
  for (const page of pages) {
    const html = readFileSync(new URL(page, dir), "utf8")
    assert.match(html, /class="[^"]*\bduo-spread\b/, `${page} has no duo-spread`)
    assert.match(html, /<header class="[^"]*\bduo-left-page\b/, `${page}'s header crosses the fold`)
    assert.doesNotMatch(html, /duo-book:gap-x-/, `${page} has its own book gap`)
    for (const footer of html.match(/<footer class="[^"]*"/g) ?? []) {
      assert.match(footer, /\bduo-left-page\b/, `${page}'s footer crosses the fold`)
    }
  }
})
