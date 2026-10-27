import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const css = (name) => readFileSync(new URL(`../css/${name}`, import.meta.url), "utf8")
const variable = (text, name) => text.match(new RegExp(`^\\s+${name}:\\s*([^;]+);`, "m"))?.[1]

test("both stylesheets put the book gap in the same place", () => {
  const tailwind = css("duo-tailwind.css")
  const plain = css("duo.css")
  for (const name of ["--duo-book-gap", "--duo-fold-centre", "--duo-left-page", "--duo-pad-left", "--duo-pad-right"]) {
    assert.ok(variable(tailwind, name), `${name} in duo-tailwind.css`)
    assert.equal(variable(plain, name), variable(tailwind, name), name)
  }
})

test("the book gap is the fold plus 0.75rem each side, and at least 4.5rem", () => {
  assert.equal(variable(css("duo.css"), "--duo-book-gap"), "max(calc(var(--device-fold-width, 0px) + 1.5rem), var(--duo-book-gap-floor, 4.5rem))")
})

test("without a fold frame the gap is wider, 6rem, in both stylesheets", () => {
  for (const name of ["duo.css", "duo-tailwind.css"]) assert.equal(variable(css(name), "--duo-book-gap-floor"), "6rem", name)
})

test("the gap is centred on the fold, not on the page", () => {
  assert.match(variable(css("duo.css"), "--duo-fold-centre"), /--device-fold-x/)
})

test("on the cover the page is one column, the right page first", () => {
  const plain = css("duo.css")
  assert.match(plain, /body\[data-device-display="outer"\]:has\(> \.duo-spread\) \{\s*display: flex;\s*flex-direction: column;/)
  assert.match(plain, /body\[data-device-display="outer"\] \.duo-right-page \{\s*order: -1;/)
  const tailwind = css("duo-tailwind.css")
  assert.match(tailwind, /body\[data-device-display="outer"\] & \{\s*order: -1;/)
})

test("in the spread everything but the hero is on the left page", () => {
  for (const name of ["duo.css", "duo-tailwind.css"]) {
    assert.match(css(name), /> :not\(\.duo-right-page\) \{\s*grid-column: 1;/, name)
  }
})
