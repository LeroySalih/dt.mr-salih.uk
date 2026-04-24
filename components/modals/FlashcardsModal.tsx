"use client"
import * as React from "react"
import { Modal } from "@/components/modals/Modal"
import { type FlashCard } from "@/lib/flashcards/parse-flashcards"
import { similarity, SIMILARITY_THRESHOLD } from "@/lib/flashcards/similarity"

type Phase = "question" | "feedback" | "complete"

type FeedbackState = {
  isCorrect: boolean
  isExactMatch: boolean
  correctAnswer: string
  typedAnswer: string
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

type Props = {
  topicCode: string
  topicTitle: string
  tint: string
  deckActivityId: string  // display-flashcards activity id
  doActivityId?: string   // do-flashcards activity id (if available)
  cards: FlashCard[]
  onClose: () => void
  onComplete?: () => void
}

export function FlashcardsModal({ topicCode, topicTitle, tint, deckActivityId, doActivityId, cards, onClose, onComplete }: Props) {
  const [pile, setPile] = React.useState<FlashCard[]>([])
  const [sessionId, setSessionId] = React.useState<string | null>(null)
  const [phase, setPhase] = React.useState<Phase>("question")
  const [typed, setTyped] = React.useState("")
  const [feedback, setFeedback] = React.useState<FeedbackState | null>(null)
  const [consecutiveCorrect, setConsecutiveCorrect] = React.useState(0)
  const [attemptCounts, setAttemptCounts] = React.useState<Map<string, number>>(new Map())
  const [totalCorrect, setTotalCorrect] = React.useState(0)
  const startedRef = React.useRef(false)

  // Start session on mount
  React.useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true
    setPile(shuffle(cards))
    if (cards.length > 0) {
      fetch("/api/flashcard-sessions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ activityId: deckActivityId, totalCards: cards.length, doActivityId }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => { if (data?.sessionId) setSessionId(data.sessionId) })
        .catch(() => {})
    }
  }, [cards, deckActivityId, doActivityId])

  if (cards.length === 0) {
    return (
      <Modal topicCode={topicCode} tint={tint} onClose={onClose} title="Flashcards">
        <p>No flashcards yet for this topic.</p>
      </Modal>
    )
  }

  const handleSubmit = () => {
    const answer = typed.trim()
    if (phase !== "question" || pile.length === 0 || !answer) return
    const current = pile[0]
    const score = similarity(answer, current.answer)
    const isExactMatch = answer.toLowerCase() === current.answer.trim().toLowerCase()
    const isCorrect = score >= SIMILARITY_THRESHOLD

    setFeedback({ isCorrect, isExactMatch, correctAnswer: current.answer, typedAnswer: answer })
    setPhase("feedback")

    const key = current.template
    const nextCounts = new Map(attemptCounts)
    const n = (nextCounts.get(key) ?? 0) + 1
    nextCounts.set(key, n)
    setAttemptCounts(nextCounts)

    if (isCorrect) setTotalCorrect((c) => c + 1)

    if (sessionId) {
      void fetch(`/api/flashcard-sessions/${sessionId}/attempts`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          term: current.template,
          definition: current.answer,
          chosenDefinition: answer,
          isCorrect,
          attemptNumber: n,
        }),
      }).catch(() => {})
    }
  }

  const handleNext = () => {
    if (phase !== "feedback" || pile.length === 0 || !feedback) return
    const current = pile[0]
    if (feedback.isCorrect) {
      const newConsec = consecutiveCorrect + 1
      if (newConsec >= pile.length) {
        // Clean pass!
        setConsecutiveCorrect(newConsec)
        setPhase("complete")
        if (sessionId) {
          void fetch(`/api/flashcard-sessions/${sessionId}/complete`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ correctCount: totalCorrect }),
          }).catch(() => {})
        }
        onComplete?.()
        return
      }
      const next = [...pile.slice(1), current] // move to end
      setPile(next)
      setConsecutiveCorrect(newConsec)
    } else {
      const rest = pile.slice(1)
      const insertAt = Math.min(2, rest.length)
      const next = [...rest.slice(0, insertAt), current, ...rest.slice(insertAt)]
      setPile(next)
      setConsecutiveCorrect(0)
    }
    setFeedback(null)
    setTyped("")
    setPhase("question")
  }

  if (phase === "complete") {
    return (
      <Modal topicCode={topicCode} tint={tint} onClose={onClose} title="Flashcards complete"
        footer={<button className="btn primary" onClick={onClose}>Done</button>}>
        <div className="quiz-done">
          <h3>Clean pass! 🎉</h3>
          <p>You got every card right in a row.</p>
          <div className="quiz-score-big">{cards.length}/{cards.length}</div>
        </div>
      </Modal>
    )
  }

  const current = pile[0]
  const percentClean = pile.length > 0 ? Math.round((consecutiveCorrect / pile.length) * 100) : 0

  const footer = phase === "question" ? (
    <>
      <span className="modal-progress"><b>{consecutiveCorrect}</b>/{pile.length} in a row</span>
      <button className="btn primary" onClick={handleSubmit} disabled={typed.trim().length === 0}>Submit</button>
    </>
  ) : (
    <>
      <span className="modal-progress">{percentClean}% to clean pass</span>
      <button className="btn primary" onClick={handleNext} autoFocus>Next →</button>
    </>
  )

  return (
    <Modal topicCode={topicCode} tint={tint} onClose={onClose} title={`Flashcards · ${topicTitle}`} footer={footer}>
      <div style={{ fontFamily: "var(--f-display)", fontWeight: 600, fontSize: 22, lineHeight: 1.3, marginBottom: 18, color: "var(--ink)" }}>
        {current.template.split("[...]").map((part, i, arr) => (
          <React.Fragment key={i}>
            {part}
            {i < arr.length - 1 && (
              <span style={{
                display: "inline-block",
                minWidth: "5rem",
                padding: "2px 8px",
                margin: "0 4px",
                borderBottom: "2px solid var(--ink)",
                textAlign: "center",
                fontWeight: 700,
                color: feedback?.isCorrect ? "var(--mint-deep)" : feedback ? "var(--coral-deep)" : "var(--ink-3)",
              }}>
                {feedback ? feedback.typedAnswer : "…"}
              </span>
            )}
          </React.Fragment>
        ))}
      </div>

      {phase === "question" ? (
        <input
          className="explain-input"
          style={{ minHeight: "auto", padding: "12px 14px" }}
          placeholder="Type the missing word…"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSubmit() } }}
          autoFocus
        />
      ) : feedback ? (
        <div className="quiz-explain" style={{ background: feedback.isCorrect ? "var(--mint)" : "#FFD4DC" }}>
          <b>{feedback.isCorrect && feedback.isExactMatch
            ? "Correct! "
            : feedback.isCorrect
              ? "Close enough — "
              : "Not quite. "}
          </b>
          {!feedback.isExactMatch && <>The answer is <b>{feedback.correctAnswer}</b>.</>}
        </div>
      ) : null}
    </Modal>
  )
}
