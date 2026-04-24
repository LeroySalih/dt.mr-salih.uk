"use client"
import * as React from "react"
import { FlashcardsModal } from "@/components/modals/FlashcardsModal"
import { QuizModal, type QuizQuestion } from "@/components/modals/QuizModal"
import { ExplainModal, type ExplainPrompt } from "@/components/modals/ExplainModal"
import type { FlashCard } from "@/lib/flashcards/parse-flashcards"

type Props = {
  topic: { code: string; title: string; lessonId: string }
  tint: string
  signedIn: boolean
  flashcards: { doActivityId: string; deckActivityId: string; lines: string; cards: FlashCard[] } | null
  initialMode: string | null
  quizQuestions: QuizQuestion[] | null
  explainPrompts: ExplainPrompt[]
}

export function TopicLauncher({ topic, tint, signedIn, flashcards, initialMode, quizQuestions, explainPrompts }: Props) {
  const [mode, setMode] = React.useState<"none" | "flashcards" | "quiz" | "explain">(
    initialMode === "flashcards" || initialMode === "quiz" || initialMode === "explain"
      ? (initialMode as "flashcards" | "quiz" | "explain")
      : "none",
  )

  // Require sign-in for flashcards to write progress. Anonymous users can still
  // practise but nothing persists — skip session creation.
  const canFlashcard = !!flashcards && flashcards.cards.length > 0
  const canQuiz = !!quizQuestions && quizQuestions.length > 0
  const canExplain = signedIn && explainPrompts.length > 0

  return (
    <>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button className="btn primary" disabled={!canFlashcard} onClick={() => setMode("flashcards")}>🃏 Flashcards ({flashcards?.cards.length ?? 0})</button>
        <button className="btn primary" disabled={!canQuiz} onClick={() => setMode("quiz")}>✏️ Quiz ({quizQuestions?.length ?? 0})</button>
        {signedIn && (
          <button className="btn" disabled={!canExplain} onClick={() => setMode("explain")}>
            💬 Explain ({explainPrompts.length})
          </button>
        )}
      </div>

      {mode === "flashcards" && flashcards && signedIn && (
        <FlashcardsModal
          topicCode={topic.code}
          topicTitle={topic.title}
          tint={tint}
          deckActivityId={flashcards.deckActivityId}
          doActivityId={flashcards.doActivityId}
          cards={flashcards.cards}
          onClose={() => setMode("none")}
        />
      )}

      {mode === "flashcards" && flashcards && !signedIn && (
        <FlashcardsAnonNotice onClose={() => setMode("none")} />
      )}

      {mode === "quiz" && canQuiz && (
        <QuizModal
          topicCode={topic.code}
          topicTitle={topic.title}
          tint={tint}
          questions={quizQuestions!}
          signedIn={signedIn}
          onClose={() => setMode("none")}
        />
      )}

      {mode === "explain" && canExplain && (
        <ExplainModal
          topicCode={topic.code}
          topicTitle={topic.title}
          tint={tint}
          prompts={explainPrompts}
          onClose={() => setMode("none")}
        />
      )}
    </>
  )
}

function FlashcardsAnonNotice({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <header className="modal-head">
          <h3 className="modal-title">Sign in to practise flashcards</h3>
          <button className="modal-close" onClick={onClose} aria-label="close">✕</button>
        </header>
        <div className="modal-body">
          <p>We save your flashcard progress against your account. Sign in, then come back to practise. (Anonymous flashcards may arrive later.)</p>
        </div>
        <div className="modal-foot">
          <span />
          <a href="/sign-in" className="btn primary">Sign in</a>
        </div>
      </div>
    </div>
  )
}
