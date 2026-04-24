import { describe, it, expect } from "vitest"
import { similarity, SIMILARITY_THRESHOLD } from "@/lib/flashcards/similarity"

describe("similarity", () => {
  it("exact match scores 1", () => {
    expect(similarity("concrete", "concrete")).toBe(1)
  })
  it("case/whitespace insensitive", () => {
    expect(similarity("  Concrete ", "concrete")).toBe(1)
  })
  it("typo within threshold", () => {
    expect(similarity("concerete", "concrete")).toBeGreaterThanOrEqual(SIMILARITY_THRESHOLD)
  })
  it("different word scores low", () => {
    expect(similarity("banana", "concrete")).toBeLessThan(SIMILARITY_THRESHOLD)
  })
})
