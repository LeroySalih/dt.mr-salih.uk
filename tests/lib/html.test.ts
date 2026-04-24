import { describe, it, expect } from "vitest"
import { sanitiseHtml } from "@/lib/html"

describe("sanitiseHtml", () => {
  it("preserves safe tags and attributes", () => {
    expect(sanitiseHtml('<p class="x">Hi</p>')).toContain("<p")
  })
  it("strips script tags", () => {
    expect(sanitiseHtml("<p>Hi</p><script>alert(1)</script>")).not.toContain("<script")
  })
  it("strips onerror attributes", () => {
    const out = sanitiseHtml('<img src="x" onerror="alert(1)">')
    expect(out).not.toContain("onerror")
  })
})
