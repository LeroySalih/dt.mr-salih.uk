import { describe, it, expect } from "vitest"
import { computeTopicProgress, topicPercent } from "@/lib/progress"
import { listTopics } from "@/lib/content"

describe("computeTopicProgress (integration)", () => {
  it("returns all three booleans false for a brand-new pupil id", async () => {
    const topics = await listTopics()
    const first = topics[0]
    const progress = await computeTopicProgress({
      pupilId: "does-not-exist-00000000",
      lessonIds: [first.lessonId],
    })
    expect(progress[first.lessonId]).toEqual({
      flashcardsDone: false,
      mcqPassed: false,
      explainDone: false,
    })
  })

  it("returns a map keyed by lesson id for every input id", async () => {
    const topics = await listTopics()
    const ids = topics.slice(0, 3).map((t) => t.lessonId)
    const progress = await computeTopicProgress({ pupilId: "does-not-exist-00000000", lessonIds: ids })
    for (const id of ids) {
      expect(progress[id]).toBeDefined()
    }
  })

  it("returns an empty object for empty input", async () => {
    const progress = await computeTopicProgress({ pupilId: "anything", lessonIds: [] })
    expect(progress).toEqual({})
  })
})

describe("topicPercent", () => {
  const allFalse = { flashcardsDone: false, mcqPassed: false, explainDone: false }
  const allTrue = { flashcardsDone: true, mcqPassed: true, explainDone: true }

  it("anonymous (2 boxes): 0/50/100", () => {
    expect(topicPercent(allFalse, false)).toBe(0)
    expect(topicPercent({ ...allFalse, flashcardsDone: true }, false)).toBe(50)
    expect(topicPercent({ ...allFalse, mcqPassed: true }, false)).toBe(50)
    expect(topicPercent(allTrue, false)).toBe(100)
  })

  it("signed-in (3 boxes): 0/33/67/100", () => {
    expect(topicPercent(allFalse, true)).toBe(0)
    expect(topicPercent({ ...allFalse, flashcardsDone: true }, true)).toBe(33)
    expect(topicPercent({ ...allFalse, flashcardsDone: true, mcqPassed: true }, true)).toBe(67)
    expect(topicPercent(allTrue, true)).toBe(100)
  })

  it("handles undefined input as 0", () => {
    expect(topicPercent(undefined, true)).toBe(0)
    expect(topicPercent(undefined, false)).toBe(0)
  })
})
