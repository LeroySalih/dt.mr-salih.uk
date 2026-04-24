"use client"
import * as React from "react"
import { Modal } from "@/components/modals/Modal"
import { writeLocalMcqScore } from "@/lib/progress-client"

export type QuizOption = { id: string; text: string }
export type QuizQuestion = {
  activityId: string
  question: string
  options: QuizOption[]
  correctOptionId: string
}

type Props = {
  topicCode: string
  topicTitle: string
  tint: string
  questions: QuizQuestion[]
  signedIn: boolean
  onClose: () => void
}

export function QuizModal({ topicCode, topicTitle, tint, questions, signedIn, onClose }: Props) {
  const [i, setI] = React.useState(0)
  const [picks, setPicks] = React.useState<Record<string, string>>({}) // activityId -> option_id
  const [finished, setFinished] = React.useState(false)

  if (questions.length === 0) {
    return (
      <Modal topicCode={topicCode} tint={tint} onClose={onClose} title="Quiz">
        <p>No quiz questions yet for this topic.</p>
      </Modal>
    )
  }

  const q = questions[i]
  const picked = picks[q.activityId] ?? null
  const score = questions.reduce((s, qn) => s + (picks[qn.activityId] === qn.correctOptionId ? 1 : 0), 0)

  const pick = (optionId: string) => {
    if (picked !== null) return
    setPicks((p) => ({ ...p, [q.activityId]: optionId }))
  }

  const next = async () => {
    if (i + 1 >= questions.length) {
      // Finished — persist
      if (signedIn) {
        await Promise.all(
          questions.map((qn) => {
            const chosen = picks[qn.activityId]
            if (!chosen) return null
            const isCorrect = chosen === qn.correctOptionId
            return fetch(`/api/activities/${qn.activityId}/submissions`, {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                type: "multiple-choice-question",
                body: {
                  option_id: chosen,
                  is_correct: isCorrect,
                  score: isCorrect ? 1 : 0,
                  correctOptionId: qn.correctOptionId,
                },
              }),
            }).catch(() => null)
          }),
        )
      } else {
        writeLocalMcqScore(topicCode, score / questions.length)
      }
      setFinished(true)
      return
    }
    setI(i + 1)
  }

  if (finished) {
    const pct = Math.round((score / questions.length) * 100)
    const banner = pct >= 80 ? "Smashed it!" : pct >= 50 ? "Nice work!" : "Keep going!"
    return (
      <Modal topicCode={topicCode} tint={tint} onClose={onClose} title="Quiz complete"
        footer={<>
          <span className="modal-progress">{signedIn ? "Saved" : "Saved locally"}</span>
          <button className="btn primary" onClick={onClose}>Close</button>
        </>}>
        <div className="quiz-done">
          <h3>{banner}</h3>
          <p>You got <b>{score}</b> out of <b>{questions.length}</b></p>
          <div className="quiz-score-big">{pct}%</div>
        </div>
      </Modal>
    )
  }

  return (
    <Modal topicCode={topicCode} tint={tint} onClose={onClose} title={`Quiz · ${topicTitle}`}
      footer={<>
        <span className="modal-progress">Question <b>{i + 1}</b> of {questions.length} · Score <b>{score}</b></span>
        <button className="btn primary" onClick={next} disabled={picked === null}>
          {i + 1 >= questions.length ? "Finish" : "Next →"}
        </button>
      </>}>
      <div className="quiz-q">{q.question}</div>
      <div className="quiz-options">
        {q.options.map((opt, idx) => {
          const cls = picked === null ? "" :
            opt.id === q.correctOptionId ? "correct" :
            opt.id === picked ? "wrong" : "disabled"
          return (
            <button key={opt.id} className={`quiz-opt ${cls}`} onClick={() => pick(opt.id)}>
              <span className="quiz-letter">{String.fromCharCode(65 + idx)}</span>
              <span>{opt.text}</span>
            </button>
          )
        })}
      </div>
      {picked !== null && (
        <div className="quiz-explain">
          <b>{picked === q.correctOptionId ? "Correct! " : "Not quite. "}</b>
          {picked === q.correctOptionId
            ? "Nicely done."
            : `The correct answer is ${q.options.find((o) => o.id === q.correctOptionId)?.text ?? "elsewhere"}.`}
        </div>
      )}
    </Modal>
  )
}
