import { describe, it, expect, beforeEach } from "vitest"
import {
  readLocalProgress,
  writeLocalFlashcardsDone,
  writeLocalMcqScore,
  clearLocalProgress,
  localTopicPercent,
} from "@/lib/progress-client"

beforeEach(() => {
  localStorage.clear()
})

describe("local progress", () => {
  it("defaults to empty map", () => {
    expect(readLocalProgress()).toEqual({})
  })

  it("writes and reads flashcardsDone per topic code", () => {
    writeLocalFlashcardsDone("1.5", true)
    expect(readLocalProgress()["1.5"]?.flashcardsDone).toBe(true)
  })

  it("writes and reads mcq score (0..1)", () => {
    writeLocalMcqScore("5.4", 0.9)
    expect(readLocalProgress()["5.4"]?.mcqBestScore).toBe(0.9)
  })

  it("keeps the best score only", () => {
    writeLocalMcqScore("5.4", 0.6)
    writeLocalMcqScore("5.4", 0.9)
    writeLocalMcqScore("5.4", 0.7)
    expect(readLocalProgress()["5.4"]?.mcqBestScore).toBe(0.9)
  })

  it("clearLocalProgress wipes everything", () => {
    writeLocalFlashcardsDone("1.5", true)
    clearLocalProgress()
    expect(readLocalProgress()).toEqual({})
  })

  it("localTopicPercent: 0/50/100 based on the two booleans", () => {
    expect(localTopicPercent(undefined)).toBe(0)
    expect(localTopicPercent({})).toBe(0)
    expect(localTopicPercent({ flashcardsDone: true })).toBe(50)
    expect(localTopicPercent({ mcqBestScore: 0.8 })).toBe(50)
    expect(localTopicPercent({ mcqBestScore: 0.79 })).toBe(0)
    expect(localTopicPercent({ flashcardsDone: true, mcqBestScore: 0.95 })).toBe(100)
  })
})
