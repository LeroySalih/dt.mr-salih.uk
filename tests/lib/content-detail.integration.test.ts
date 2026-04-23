import { describe, it, expect } from "vitest"
import { getTopicByCode, listTopics } from "@/lib/content"

describe("getTopicByCode (integration)", () => {
  it("returns null for an unknown code", async () => {
    expect(await getTopicByCode("9.9.9")).toBeNull()
  })

  it("returns a topic for the first coded lesson found", async () => {
    const topics = await listTopics()
    const first = topics.find((t) => t.code !== "")
    expect(first).toBeDefined()
    const detail = await getTopicByCode(first!.code)
    expect(detail).not.toBeNull()
    expect(detail!.code).toBe(first!.code)
    expect(detail!.lessonId).toBe(first!.lessonId)
    expect(Array.isArray(detail!.activities)).toBe(true)
  })

  it("every activity has a valid type from the allowed union", async () => {
    const topics = await listTopics()
    // Pick a lesson with plenty of activities
    const sampleCode = topics.find((t) => t.unitId === "1010-SYSTEMS-1" && t.code !== "")?.code
    if (!sampleCode) return // skip if DB empty
    const detail = await getTopicByCode(sampleCode)
    expect(detail).not.toBeNull()
    const allowed = new Set([
      "text", "display-key-terms", "display-image", "show-video",
      "multiple-choice-question", "short-text-question",
      "do-flashcards", "display-flashcards",
      "file-download", "upload-file", "text-question",
    ])
    for (const a of detail!.activities) {
      expect(allowed.has(a.type)).toBe(true)
      expect(a.activityId.length).toBeGreaterThan(0)
      expect(Number.isInteger(a.orderBy)).toBe(true)
    }
  })

  it("activities are sorted by order_by then activity_id", async () => {
    const topics = await listTopics()
    const sampleCode = topics.find((t) => t.unitId === "1010-SYSTEMS-1" && t.code !== "")?.code
    if (!sampleCode) return
    const detail = await getTopicByCode(sampleCode)
    if (!detail || detail.activities.length < 2) return
    for (let i = 1; i < detail.activities.length; i++) {
      const prev = detail.activities[i - 1]
      const curr = detail.activities[i]
      const orderOk = prev.orderBy < curr.orderBy ||
        (prev.orderBy === curr.orderBy && prev.activityId <= curr.activityId)
      expect(orderOk).toBe(true)
    }
  })
})
