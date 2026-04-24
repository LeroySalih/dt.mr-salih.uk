import { getTopicByCode, type Activity } from "@/lib/content"
import { getAuthenticatedProfile } from "@/lib/auth"
import { notFound } from "next/navigation"
import { tintFor } from "@/lib/tints"
import { TopicLauncher } from "@/components/TopicLauncher"
import { parseFlashcardLines } from "@/lib/flashcards/parse-flashcards"
import { type QuizQuestion } from "@/components/modals/QuizModal"

export const dynamic = "force-dynamic"

type BodyData = { flashcardActivityId?: string; lines?: string }
type McqBody = { question?: string; options?: Array<{ id: string; text: string }>; correctOptionId?: string }

function findFlashcards(activities: Activity[]): { doActivityId: string; deckActivityId: string; lines: string } | null {
  const doFc = activities.find((a) => a.type === "do-flashcards")
  if (!doFc) return null
  const body = (doFc.bodyData ?? {}) as BodyData
  const deckId = body.flashcardActivityId
  if (!deckId) return null
  // deck activity is in the same list (or we can load separately)
  const deck = activities.find((a) => a.activityId === deckId && a.type === "display-flashcards")
  if (!deck) return null
  const deckBody = (deck.bodyData ?? {}) as BodyData
  return { doActivityId: doFc.activityId, deckActivityId: deck.activityId, lines: deckBody.lines ?? "" }
}

function extractQuizQuestions(activities: Activity[]): QuizQuestion[] {
  return activities
    .filter((a) => a.type === "multiple-choice-question")
    .map((a) => {
      const b = (a.bodyData ?? {}) as McqBody
      if (!b.question || !Array.isArray(b.options) || !b.correctOptionId) return null
      return {
        activityId: a.activityId,
        question: b.question,
        options: b.options.filter((o): o is { id: string; text: string } => !!(o.id && o.text)),
        correctOptionId: b.correctOptionId,
      }
    })
    .filter((q): q is QuizQuestion => q !== null)
}

export default async function TopicPage({ params, searchParams }: {
  params: Promise<{ code: string }>
  searchParams: Promise<{ mode?: string }>
}) {
  const { code } = await params
  const { mode } = await searchParams

  // Decode slug — might be a code like "1.1.1" or URL-encoded raw title
  const topic = await getTopicByCode(decodeURIComponent(code))
  if (!topic) notFound()

  const profile = await getAuthenticatedProfile()
  const signedIn = Boolean(profile)

  const parts = topic.code.split(".")
  const minorRaw = parts[1] ? parseInt(parts[1], 10) : 0
  const index = Number.isNaN(minorRaw) ? 0 : Math.max(0, minorRaw - 1)
  const offset = topic.section === "systems" ? 3 : 0
  const tint = tintFor(index + offset)

  const fc = findFlashcards(topic.activities)
  const cards = fc ? parseFlashcardLines(fc.lines) : []
  const quizQuestions = extractQuizQuestions(topic.activities)

  return (
    <div className="page" style={{ paddingTop: 24 }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <a href="/" className="btn" style={{ display: "inline-block", marginBottom: 16 }}>← All topics</a>
        <h1 style={{ fontFamily: "var(--f-display)", fontWeight: 600, fontSize: 36, letterSpacing: "-0.02em", color: "var(--ink)", marginBottom: 8 }}>
          {topic.code && <span className="card-code" style={{ marginRight: 12 }}>{topic.code}</span>}
          {topic.title || topic.rawTitle}
        </h1>
        <p style={{ color: "var(--ink-3)", fontWeight: 700, fontSize: 13, marginBottom: 16 }}>
          {topic.activities.length} activities · {cards.length} flashcards · {topic.section === "systems" ? "Systems" : "Core"}
        </p>
        <p style={{ color: "var(--ink-2)", marginBottom: 24 }}>
          Study notes reader coming soon. For now, use the buttons below.
        </p>
        <TopicLauncher
          topic={{
            code: topic.code,
            title: topic.title || topic.rawTitle,
            lessonId: topic.lessonId,
          }}
          tint={tint}
          signedIn={signedIn}
          flashcards={fc ? { ...fc, cards } : null}
          initialMode={mode ?? null}
          quizQuestions={quizQuestions.length > 0 ? quizQuestions : null}
        />
      </div>
    </div>
  )
}
