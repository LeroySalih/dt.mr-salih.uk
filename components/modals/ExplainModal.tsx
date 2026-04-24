"use client"
import * as React from "react"
import { Modal } from "@/components/modals/Modal"

export type ExplainPrompt = {
  activityId: string
  question: string
  modelAnswer: string
}

type Props = {
  topicCode: string
  topicTitle: string
  tint: string
  prompts: ExplainPrompt[]
  onClose: () => void
}

export function ExplainModal({ topicCode, topicTitle, tint, prompts, onClose }: Props) {
  const [i, setI] = React.useState(0)

  if (prompts.length === 0) {
    return (
      <Modal topicCode={topicCode} tint={tint} onClose={onClose} title="Explain">
        <p>No explain prompts yet for this topic.</p>
      </Modal>
    )
  }

  const p = prompts[i]
  const atEnd = i === prompts.length - 1

  return (
    <Modal topicCode={topicCode} tint={tint} onClose={onClose} title={`Explain · ${topicTitle}`}
      footer={<>
        <span className="modal-progress"><b>{i + 1}</b> of {prompts.length}</span>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" disabled={i === 0} onClick={() => setI(i - 1)}>← Prev</button>
          {atEnd ? (
            <button className="btn primary" onClick={onClose}>Done</button>
          ) : (
            <button className="btn primary" onClick={() => setI(i + 1)}>Next →</button>
          )}
        </div>
      </>}>
      <ExplainBlock key={p.activityId} prompt={p} />
    </Modal>
  )
}

function ExplainBlock({ prompt }: { prompt: ExplainPrompt }) {
  const [text, setText] = React.useState("")
  const [busy, setBusy] = React.useState(false)
  const [showModel, setShowModel] = React.useState(false)
  const [feedback, setFeedback] = React.useState<null | { source: string; feedback: string | null; score: number | null }>(null)

  async function submit() {
    if (!text.trim() || busy) return
    setBusy(true)
    setFeedback(null)
    try {
      const res = await fetch(`/api/activities/${prompt.activityId}/submissions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type: "short-text-question", body: { answer: text } }),
      })
      if (!res.ok) {
        setBusy(false)
        return
      }
      // Poll for up to ~30s
      const deadline = Date.now() + 30_000
      while (Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 2000))
        const poll = await fetch(`/api/activities/${prompt.activityId}/feedback`).then((r) => r.json()).catch(() => null)
        if (poll && poll.status === "ready") {
          setFeedback(poll)
          break
        }
      }
    } catch {
      // swallow — user can retry
    }
    setBusy(false)
  }

  return (
    <div>
      <div className="explain-prompt">{prompt.question}</div>
      <textarea
        className="explain-input"
        placeholder="Write your answer in your own words…"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 10 }}>
        <button className="btn" onClick={() => setShowModel((s) => !s)}>
          {showModel ? "Hide model answer" : "Show model answer"}
        </button>
        <button className="btn primary" onClick={submit} disabled={!text.trim() || busy}>
          {busy ? "Checking…" : "Check my answer"}
        </button>
      </div>

      {feedback && feedback.feedback && (
        <div className="inline-explain-feedback">
          <div className="inline-explain-feedback-label">
            {feedback.source === "teacher" ? "Teacher feedback" : "Tutor feedback"}
          </div>
          <div className="inline-explain-feedback-text">{feedback.feedback}</div>
        </div>
      )}

      {feedback && !feedback.feedback && (
        <div className="inline-explain-feedback">
          <div className="inline-explain-feedback-text">Marking is still in progress. Try again in a minute.</div>
        </div>
      )}

      {showModel && (
        <div className="explain-model">
          <span className="explain-model-label">Model answer</span>
          {prompt.modelAnswer}
        </div>
      )}
    </div>
  )
}
