import { getTopicByCode, type Activity } from "@/lib/content"
import { getAuthenticatedProfile } from "@/lib/auth"
import { notFound } from "next/navigation"
import { tintFor } from "@/lib/tints"
import { TopicLauncher } from "@/components/TopicLauncher"
import { parseFlashcardLines } from "@/lib/flashcards/parse-flashcards"
import { type QuizQuestion } from "@/components/modals/QuizModal"
import { type ExplainPrompt } from "@/components/modals/ExplainModal"
import { StudyNotes, groupIntoPanels } from "@/components/notes/StudyNotes"

export const dynamic = "force-dynamic"

type BodyData = { flashcardActivityId?: string; lines?: string }
type McqBody = { question?: string; options?: Array<{ id: string; text: string }>; correctOptionId?: string }
type ShortTextBody = { question?: string; modelAnswer?: string }

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

function extractExplainPrompts(activities: Activity[]): ExplainPrompt[] {
  return activities
    .filter((a) => a.type === "short-text-question")
    .map((a) => {
      const b = (a.bodyData ?? {}) as ShortTextBody
      if (!b.question) return null
      return {
        activityId: a.activityId,
        question: b.question,
        modelAnswer: b.modelAnswer ?? "",
      }
    })
    .filter((p): p is ExplainPrompt => p !== null)
}

export default async function TopicPage({ params, searchParams }: {
  params: Promise<{ code: string }>
  searchParams: Promise<{ mode?: string }>
}) {
  const { code } = await params
  const { mode } = await searchParams

  const profile = await getAuthenticatedProfile()
  const signedIn = Boolean(profile)

  const topic = await getTopicByCode(decodeURIComponent(code), profile?.userId)
  if (!topic) notFound()

  const parts = topic.code.split(".")
  const minorRaw = parts[1] ? parseInt(parts[1], 10) : 0
  const index = Number.isNaN(minorRaw) ? 0 : Math.max(0, minorRaw - 1)
  const offset = topic.section === "systems" ? 3 : 0
  const tint = tintFor(index + offset)

  const fc = findFlashcards(topic.activities)
  const cards = fc ? parseFlashcardLines(fc.lines) : []
  const quizQuestions = extractQuizQuestions(topic.activities)
  const explainPrompts = extractExplainPrompts(topic.activities)
  const panels = groupIntoPanels(topic.activities)

  const launcher = (
    <TopicLauncher
      topic={{ code: topic.code, title: topic.title || topic.rawTitle, lessonId: topic.lessonId }}
      tint={tint}
      signedIn={signedIn}
      flashcards={fc ? { ...fc, cards } : null}
      quizQuestions={quizQuestions}
      explainPrompts={explainPrompts}
      initialMode={mode ?? null}
    />
  )

  return (
    <StudyNotes
      topic={{
        code: topic.code,
        title: topic.title || topic.rawTitle,
        section: topic.section,
        activityCount: topic.activities.length,
      }}
      panels={panels}
      tint={tint}
      launcher={launcher}
    />
  )
}
