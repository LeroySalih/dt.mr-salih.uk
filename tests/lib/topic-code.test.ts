import { describe, it, expect } from "vitest"
import { parseTopicCode } from "@/lib/topic-code"

describe("parseTopicCode", () => {
  it("extracts a two-level code", () => {
    expect(parseTopicCode("1.4 Smart Materials")).toEqual({
      code: "1.4",
      title: "Smart Materials",
    })
  })

  it("extracts a three-level code", () => {
    expect(parseTopicCode("1.1.1 Technology Impact")).toEqual({
      code: "1.1.1",
      title: "Technology Impact",
    })
  })

  it("handles missing space between code and title", () => {
    expect(parseTopicCode("1.1.1Technology Impact")).toEqual({
      code: "1.1.1",
      title: "Technology Impact",
    })
  })

  it("handles a bare code with no title", () => {
    expect(parseTopicCode("1.4")).toEqual({
      code: "1.4",
      title: "",
    })
  })

  it("handles extra whitespace", () => {
    expect(parseTopicCode("  5.3   Selection of Components  ")).toEqual({
      code: "5.3",
      title: "Selection of Components",
    })
  })

  it("handles a Systems code", () => {
    expect(parseTopicCode("5.4.2 Mitigating the Effects of Forces")).toEqual({
      code: "5.4.2",
      title: "Mitigating the Effects of Forces",
    })
  })

  it("returns empty code for no-prefix title", () => {
    expect(parseTopicCode("Overview")).toEqual({
      code: "",
      title: "Overview",
    })
  })

  it("returns empty code for multi-word no-prefix title", () => {
    expect(parseTopicCode("Sustainability & Social Footprint")).toEqual({
      code: "",
      title: "Sustainability & Social Footprint",
    })
  })

  it("returns null for empty strings", () => {
    expect(parseTopicCode("")).toBeNull()
    expect(parseTopicCode("   ")).toBeNull()
    expect(parseTopicCode(null)).toBeNull()
    expect(parseTopicCode(undefined)).toBeNull()
  })
})
