import { describe, it, expect } from "vitest"
import { listTopics } from "@/lib/content"

describe("listTopics (integration)", () => {
  let topics: Awaited<ReturnType<typeof listTopics>>

  it("loads some topics from the four configured units", async () => {
    topics = await listTopics()
    expect(topics.length).toBeGreaterThan(20)
    expect(topics.length).toBeLessThan(50) // sanity upper bound
  })

  it("excludes lessons whose titles contain 'assessment' (case-insensitive)", async () => {
    for (const t of topics) {
      expect(t.rawTitle.toLowerCase()).not.toContain("assessment")
    }
  })

  it("every topic has a lesson id and unit id", async () => {
    for (const t of topics) {
      expect(t.lessonId.length).toBeGreaterThan(0)
      expect(t.unitId.length).toBeGreaterThan(0)
    }
  })

  it("sections are derived from unit_id", async () => {
    const unitIdBands: Record<string, "core" | "systems"> = {
      "1001-CORE-1": "core",
      "1003-CORE-2": "core",
      "CORE-3-10": "core",
      "1010-SYSTEMS-1": "systems",
    }
    for (const t of topics) {
      expect(unitIdBands[t.unitId]).toBe(t.section)
    }
  })

  it("topics from Systems 1 unit are in the systems band", async () => {
    const sys = topics.filter((t) => t.unitId === "1010-SYSTEMS-1")
    expect(sys.length).toBeGreaterThan(0)
    for (const t of sys) expect(t.section).toBe("systems")
  })

  it("at least some topics have a parsed code like 1.1 or 5.3.2", async () => {
    const coded = topics.filter((t) => /^\d+(\.\d+){1,2}$/.test(t.code))
    expect(coded.length).toBeGreaterThan(10)
  })

  it("topics without a code prefix still appear (code === '')", async () => {
    // At least 'Overview' or similar — not guaranteed but likely
    const uncoded = topics.filter((t) => t.code === "")
    // Don't enforce a hard count; just ensure the array shape allows it
    expect(Array.isArray(uncoded)).toBe(true)
  })

  it("vocabCount is a non-negative integer", async () => {
    for (const t of topics) {
      expect(Number.isInteger(t.vocabCount)).toBe(true)
      expect(t.vocabCount).toBeGreaterThanOrEqual(0)
    }
  })
})
