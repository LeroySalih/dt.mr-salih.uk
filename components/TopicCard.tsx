"use client"
import Link from "next/link"
import { Icons, iconForCode, tintFor } from "@/components/Icons"

export type TopicCardProps = {
  code: string
  title: string
  rawTitle: string
  section: "core" | "systems"
  vocabCount: number
  index: number
  pct: number
  done: boolean
  signedIn: boolean
}

export function TopicCard({ code, title, rawTitle, vocabCount, index, pct, done, signedIn }: TopicCardProps) {
  const tint = tintFor(index)
  const iconKey = iconForCode(code)
  // Build URL slug — use code if present, else fall back to lessonId via rawTitle?
  // For now, use code when available; topic page will need to handle both.
  const slug = code || encodeURIComponent(rawTitle)
  const displayTitle = title || rawTitle || "(untitled)"
  return (
    <article data-tint={tint} className={`card tint-${tint} ${done ? "card-done" : ""}`}>
      <div className="card-top">
        <div className="card-chiprow">
          <span className="card-code">{code || "—"}</span>
          {done && <div className="card-badge" title="Complete!">✓</div>}
        </div>
        <h3 className="card-title">{displayTitle}</h3>
        <div className="card-icon">{Icons[iconKey]}</div>
      </div>
      <div className="card-body">
        <div className="card-meta">
          <span>{vocabCount} key words</span>
          <span className="dot" />
          <span>{signedIn ? "3 ways to study" : "2 ways to study"}</span>
        </div>
        <Link href={`/topic/${slug}`} className="notes-row">
          <span className="notes-label">Study Notes →</span>
          <span className="progress-row inline">
            <span className="progress-track"><span className="progress-fill" style={{ width: pct + "%" }} /></span>
            <span className="progress-pct">{pct}%</span>
          </span>
        </Link>
        <div className="card-actions">
          <Link href={`/topic/${slug}?mode=flashcards`} className="act"><span className="act-icon">🃏</span>Flashcards</Link>
          <Link href={`/topic/${slug}?mode=quiz`} className="act"><span className="act-icon">✏️</span>Quiz</Link>
          {signedIn && (
            <Link href={`/topic/${slug}?mode=explain`} className="act"><span className="act-icon">💬</span>Explain</Link>
          )}
        </div>
      </div>
    </article>
  )
}
