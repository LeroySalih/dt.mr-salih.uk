"use client"
import * as React from "react"
import { useRouter } from "next/navigation"

type Props = {
  firstName: string
  lastName: string
  email: string
  classCodes: string[]
  stats: { started: number; mastered: number; total: number; overall: number }
  recent: Array<{ code: string; title: string; pct: number }>
}

export function ProfileClient({ firstName, lastName, email, classCodes, stats, recent }: Props) {
  const router = useRouter()
  const [busy, setBusy] = React.useState(false)

  async function signOut() {
    if (busy) return
    setBusy(true)
    await fetch("/api/auth/sign-out", { method: "POST" }).catch(() => {})
    try { localStorage.removeItem("dt_revision_progress_v1") } catch {}
    router.push("/")
    router.refresh()
  }

  const displayName = [firstName, lastName].filter(Boolean).join(" ") || email || "Pupil"
  const level = Math.min(10, Math.floor(stats.overall / 10) + 1)

  return (
    <div className="profile-page">
      <div className="profile-bar">
        <a href="/" className="btn">← Back to topics</a>
        <span className="profile-bar-title">My Profile</span>
        <button className="btn btn-ghost" onClick={signOut} disabled={busy}>Sign out</button>
      </div>

      <div className="profile-layout">
        <div className="profile-hero">
          <div className="profile-avatar-wrap">
            <div className="profile-avatar-big">🦕</div>
            <div className="profile-level-badge">LVL {level}</div>
          </div>
          <div className="profile-hero-text">
            <h1 className="profile-name">{displayName}</h1>
            <div className="profile-meta">
              {classCodes.length > 0 && classCodes.map((c) => (
                <span key={c} className="profile-class">Class {c}</span>
              ))}
              <span>{email}</span>
            </div>
          </div>
        </div>

        <div className="profile-stats">
          <div className="pstat pstat-overall">
            <div className="pstat-value">{stats.overall}<small>%</small></div>
            <div className="pstat-label">Overall</div>
            <div className="pstat-bar"><span style={{ width: stats.overall + "%" }}/></div>
          </div>
          <div className="pstat pstat-started">
            <div className="pstat-value">{stats.started}</div>
            <div className="pstat-label">Topics started</div>
          </div>
          <div className="pstat pstat-mastered">
            <div className="pstat-value">{stats.mastered}<small>/{stats.total}</small></div>
            <div className="pstat-label">Mastered</div>
          </div>
          <div className="pstat pstat-words">
            <div className="pstat-value">{stats.total}</div>
            <div className="pstat-label">Topics total</div>
          </div>
        </div>

        <div className="profile-section">
          <h3 className="profile-section-title">Your progress</h3>
          {recent.length === 0 ? (
            <div className="profile-empty">
              <span>🦖</span>
              <div>
                <b>No progress yet — that&apos;s okay!</b>
                <small>Open any topic and the dinos will start tracking what you&apos;ve learned.</small>
              </div>
            </div>
          ) : (
            <div className="profile-topics">
              {recent.map((t) => (
                <div key={t.code || t.title} className="profile-topic-row">
                  <span className="profile-topic-code">{t.code || "—"}</span>
                  <span className="profile-topic-title">{t.title}</span>
                  <span className="profile-topic-bar"><span style={{ width: t.pct + "%" }}/></span>
                  <span className="profile-topic-pct">{t.pct}%</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="profile-foot">
          Signed in as {email}. Progress syncs automatically to your account.
        </div>
      </div>
    </div>
  )
}
