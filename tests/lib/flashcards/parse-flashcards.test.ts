import { describe, it, expect } from "vitest"
import { parseFlashcardLines } from "@/lib/flashcards/parse-flashcards"

describe("parseFlashcardLines", () => {
  it("parses a single-line **bold** answer", () => {
    const cards = parseFlashcardLines("A process that removes material is called **subtractive**.")
    expect(cards).toHaveLength(1)
    expect(cards[0]).toEqual({
      sentence: "A process that removes material is called **subtractive**.",
      answer: "subtractive",
      template: "A process that removes material is called [...].",
    })
  })

  it("parses multiple lines and skips blank lines", () => {
    const cards = parseFlashcardLines(
      "Line **one**.\n\nLine **two**.\n   \nLine three has no bold"
    )
    expect(cards).toHaveLength(2)
    expect(cards[0].answer).toBe("one")
    expect(cards[1].answer).toBe("two")
  })

  it("returns [] for empty input", () => {
    expect(parseFlashcardLines("")).toEqual([])
    expect(parseFlashcardLines("   ")).toEqual([])
  })
})
