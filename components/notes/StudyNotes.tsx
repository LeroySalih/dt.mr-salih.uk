import * as React from "react"
import type { Activity } from "@/lib/content"
import { sanitiseHtml } from "@/lib/html"
import { markdownToSafeHtml } from "@/lib/markdown"

type DisplayText = { text?: string }
type DisplayKeyTerms = { markdown?: string }
type DisplayImage = { fileUrl?: string; imageUrl?: string; imageAlt?: string; imageFile?: string }
type ShowVideo = { fileUrl?: string }

function extractYoutubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=|youtube\.com\/embed\/)([A-Za-z0-9_-]{6,})/)
  return m ? m[1] : null
}

export type NotesSection = {
  id: string
  title: string | null
  type: "text" | "display-key-terms" | "generic"
  leadActivity: Activity | null
  blocks: Activity[] // display-image / show-video that follow until next lead activity
}

export function groupIntoSections(activities: Activity[]): NotesSection[] {
  const sections: NotesSection[] = []
  let current: NotesSection | null = null

  for (const a of activities) {
    if (a.type === "text" || a.type === "display-key-terms") {
      current = {
        id: a.activityId,
        title: a.title,
        type: a.type,
        leadActivity: a,
        blocks: [],
      }
      sections.push(current)
    } else if (a.type === "display-image" || a.type === "show-video") {
      if (!current) {
        current = { id: a.activityId, title: null, type: "generic", leadActivity: null, blocks: [] }
        sections.push(current)
      }
      current.blocks.push(a)
    } else if (
      a.type === "file-download" ||
      a.type === "upload-file" ||
      a.type === "text-question"
    ) {
      // Treat as a standalone minimal section
      sections.push({
        id: a.activityId,
        title: a.title ?? "Attachment",
        type: "generic",
        leadActivity: a,
        blocks: [],
      })
      current = null
    }
  }

  return sections
}

async function renderLeadBody(a: Activity): Promise<string> {
  if (a.type === "text") {
    const body = (a.bodyData ?? {}) as DisplayText
    return sanitiseHtml(body.text ?? "")
  }
  if (a.type === "display-key-terms") {
    const body = (a.bodyData ?? {}) as DisplayKeyTerms
    return await markdownToSafeHtml(body.markdown ?? "")
  }
  return ""
}

function MediaBlock({ activity }: { activity: Activity }) {
  if (activity.type === "display-image") {
    const b = (activity.bodyData ?? {}) as DisplayImage
    const src = b.imageUrl || b.fileUrl || b.imageFile
    const alt = b.imageAlt ?? ""
    if (!src) return null
    // If `src` has no protocol, treat as unresolved filename
    if (!/^https?:\/\//.test(src)) {
      return (
        <figure style={{ margin: "16px 0", padding: "20px", background: "var(--bg-2)", border: "2px dashed var(--ink-4)", borderRadius: 14, textAlign: "center", color: "var(--ink-3)" }}>
          📎 Image: <code>{src}</code>
        </figure>
      )
    }
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} style={{ maxWidth: "100%", height: "auto", borderRadius: 14, margin: "16px 0" }} />
  }
  if (activity.type === "show-video") {
    const b = (activity.bodyData ?? {}) as ShowVideo
    const url = b.fileUrl ?? ""
    const yt = extractYoutubeId(url)
    if (yt) {
      return (
        <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, margin: "16px 0", borderRadius: 14, overflow: "hidden", border: "2px solid var(--ink)" }}>
          <iframe
            src={`https://www.youtube.com/embed/${yt}`}
            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="Video"
          />
        </div>
      )
    }
    return <p>📹 <a href={url} target="_blank" rel="noreferrer">{url}</a></p>
  }
  return null
}

async function Section({ section, n }: { section: NotesSection; n: number }) {
  if (section.leadActivity && (section.leadActivity.type === "text" || section.leadActivity.type === "display-key-terms")) {
    const html = await renderLeadBody(section.leadActivity)
    return (
      <section id={`sec-${section.id}`} className="notes-section">
        <h3 data-num={n}>{section.title || "Section"}</h3>
        <div dangerouslySetInnerHTML={{ __html: html }} />
        {section.blocks.map((b) => <MediaBlock key={b.activityId} activity={b} />)}
      </section>
    )
  }
  if (section.leadActivity && (section.leadActivity.type === "file-download" || section.leadActivity.type === "upload-file" || section.leadActivity.type === "text-question")) {
    return (
      <section id={`sec-${section.id}`} className="notes-section">
        <h3 data-num={n}>{section.title}</h3>
        <p style={{ color: "var(--ink-3)" }}>📎 This is a {section.leadActivity.type.replace("-", " ")} activity.</p>
      </section>
    )
  }
  // Generic (no lead activity, just media blocks)
  return (
    <section id={`sec-${section.id}`} className="notes-section">
      <h3 data-num={n}>Media</h3>
      {section.blocks.map((b) => <MediaBlock key={b.activityId} activity={b} />)}
    </section>
  )
}

type Props = {
  topic: { code: string; title: string; section: "core" | "systems"; activityCount: number }
  sections: NotesSection[]
  tint: string
  launcher: React.ReactNode
}

export async function StudyNotes({ topic, sections, tint, launcher }: Props) {
  const sectionNodes = await Promise.all(
    sections.map((s, i) => Section({ section: s, n: i + 1 })),
  )

  const tintVars: Record<string, { tint: string; deep: string }> = {
    mint:  { tint: "var(--mint)",  deep: "var(--mint-deep)"  },
    peach: { tint: "var(--peach)", deep: "var(--peach-deep)" },
    sky:   { tint: "var(--sky)",   deep: "var(--sky-deep)"   },
    lilac: { tint: "var(--lilac)", deep: "var(--lilac-deep)" },
    lemon: { tint: "var(--lemon)", deep: "var(--lemon-deep)" },
    coral: { tint: "var(--coral)", deep: "var(--coral-deep)" },
    teal:  { tint: "var(--teal)",  deep: "var(--teal-deep)"  },
  }
  const vars = tintVars[tint] ?? tintVars.peach
  const style = { "--card-tint": vars.tint, "--card-deep": vars.deep } as React.CSSProperties

  return (
    <div className="notes-overlay" style={{ ...style, position: "static", background: "var(--bg)" }}>
      <div className="notes-bar">
        <a href="/" className="btn btn-small" style={{ padding: "6px 14px", fontSize: 13 }}>← All topics</a>
        {topic.code && <span className="card-code">{topic.code}</span>}
        <span className="notes-bar-title">{topic.title}</span>
      </div>

      <div className="notes-layout">
        <aside className="notes-toc">
          <div className="notes-toc-label">In this topic</div>
          <ol>
            {sections.map((s) => (
              <li key={s.id}>
                <a href={`#sec-${s.id}`}>{s.title || "Section"}</a>
              </li>
            ))}
          </ol>
        </aside>

        <main className="notes-main">
          <div className="notes-hero">
            <span className="notes-hero-tag">{topic.section === "systems" ? "Systems" : "Core"} · Topic {topic.code || "—"}</span>
            {topic.code && <div className="notes-hero-number">{topic.code}</div>}
            <h1 className="notes-hero-title">{topic.title}</h1>
            <p className="notes-hero-intro">{topic.activityCount} activities to work through.</p>
          </div>

          {sectionNodes.length === 0 ? (
            <div className="empty">
              <h3 className="empty-title">No notes yet</h3>
              <p>This topic doesn&apos;t have study notes populated. Try flashcards or quiz.</p>
            </div>
          ) : (
            sectionNodes.map((node, i) => (
              <React.Fragment key={sections[i].id}>{node}</React.Fragment>
            ))
          )}

          <div className="notes-cta">
            <h4>Ready to test yourself?</h4>
            <p>Lock it in with flashcards, a quick quiz, or an explain-it prompt.</p>
            {launcher}
          </div>
        </main>
      </div>
    </div>
  )
}
