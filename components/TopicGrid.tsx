"use client"
import * as React from "react"
import { TopicCard } from "@/components/TopicCard"
import { readLocalProgress, localTopicPercent } from "@/lib/progress-client"

export type ApiTopic = {
  code: string
  title: string
  rawTitle: string
  section: "core" | "systems"
  lessonId: string
  vocabCount: number
  progress: { flashcardsDone: boolean; mcqPassed: boolean; explainDone: boolean }
}

type Filter = "all" | "core" | "systems" | "todo"

export function TopicGrid({ initial }: {
  initial: { signedIn: boolean; topics: ApiTopic[] }
}) {
  const [query, setQuery] = React.useState("")
  const [filter, setFilter] = React.useState<Filter>("all")
  const [, forceRender] = React.useReducer((x: number) => x + 1, 0)

  React.useEffect(() => {
    const handler = () => forceRender()
    window.addEventListener("focus", handler)
    window.addEventListener("storage", handler)
    return () => {
      window.removeEventListener("focus", handler)
      window.removeEventListener("storage", handler)
    }
  }, [])

  const local = initial.signedIn ? {} : readLocalProgress()

  function pctFor(t: ApiTopic): number {
    if (initial.signedIn) {
      const { flashcardsDone, mcqPassed, explainDone } = t.progress
      return Math.round(([flashcardsDone, mcqPassed, explainDone].filter(Boolean).length / 3) * 100)
    }
    return localTopicPercent(local[t.code])
  }

  const q = query.trim().toLowerCase()
  const filtered = initial.topics.filter((t) => {
    if (filter === "core" && t.section !== "core") return false
    if (filter === "systems" && t.section !== "systems") return false
    if (filter === "todo" && pctFor(t) === 100) return false
    if (q && !t.title.toLowerCase().includes(q) && !t.code.toLowerCase().includes(q) && !t.rawTitle.toLowerCase().includes(q)) return false
    return true
  })

  const core = filtered.filter((t) => t.section === "core")
  const systems = filtered.filter((t) => t.section === "systems")
  const coreCount = initial.topics.filter((t) => t.section === "core").length
  const sysCount = initial.topics.filter((t) => t.section === "systems").length
  const coreDone = initial.topics.filter((t) => t.section === "core" && pctFor(t) === 100).length
  const sysDone = initial.topics.filter((t) => t.section === "systems" && pctFor(t) === 100).length
  // exposed via data attrs so Hero can read them if needed later — for now ignored
  void coreCount; void sysCount; void coreDone; void sysDone

  return (
    <>
      <div className="tools-row">
        <label className="search">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input type="text" placeholder="Search topics or key words…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        <div className="chips">
          {(["all","core","systems","todo"] as const).map((f) => (
            <button key={f} className={`chip ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
              {f === "all" ? "All" : f === "core" ? "Core" : f === "systems" ? "Systems" : "To do"}
            </button>
          ))}
        </div>
      </div>

      {core.length > 0 && (
        <section>
          <div className="section-head">
            <span className="section-tag tag-core">Core</span>
            <h2>The basics — everyone does these</h2>
            <span className="section-count"><b>{initial.topics.filter((t) => t.section === "core" && pctFor(t) === 100).length}</b>/{core.length} done</span>
          </div>
          <div className="grid">
            {core.map((t, i) => (
              <TopicCard
                key={t.lessonId}
                code={t.code}
                title={t.title}
                rawTitle={t.rawTitle}
                section="core"
                lessonId={t.lessonId}
                vocabCount={t.vocabCount}
                index={i}
                pct={pctFor(t)}
                done={pctFor(t) === 100}
                signedIn={initial.signedIn}
              />
            ))}
          </div>
        </section>
      )}

      {systems.length > 0 && (
        <section>
          <div className="section-head">
            <span className="section-tag tag-sys">Systems</span>
            <h2>Your specialism — electronics &amp; PCBs</h2>
            <span className="section-count"><b>{initial.topics.filter((t) => t.section === "systems" && pctFor(t) === 100).length}</b>/{systems.length} done</span>
          </div>
          <div className="grid">
            {systems.map((t, i) => (
              <TopicCard
                key={t.lessonId}
                code={t.code}
                title={t.title}
                rawTitle={t.rawTitle}
                section="systems"
                lessonId={t.lessonId}
                vocabCount={t.vocabCount}
                index={i + 3}
                pct={pctFor(t)}
                done={pctFor(t) === 100}
                signedIn={initial.signedIn}
              />
            ))}
          </div>
        </section>
      )}

      {filtered.length === 0 && (
        <div className="empty">
          <h3 className="empty-title">No topics match that search 🔍</h3>
          <p style={{ color: "var(--ink-3)", margin: 0 }}>Try clearing the search or switching filter.</p>
        </div>
      )}
    </>
  )
}
