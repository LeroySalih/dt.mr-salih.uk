"use client"
import * as React from "react"
import { useRouter } from "next/navigation"

export function SignInForm() {
  const router = useRouter()
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const res = await fetch("/api/auth/sign-in", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json().catch(() => null)
    if (!res.ok || !data?.success) {
      setError(data?.error ?? "Sign-in failed.")
      setBusy(false)
      return
    }
    try { localStorage.removeItem("dt_revision_progress_v1") } catch {}
    router.push("/")
    router.refresh()
  }

  return (
    <form onSubmit={submit} className="signin-card">
      <div className="signin-step-head">
        <span className="signin-step-num">1</span>
        <span className="signin-step-label">sign in</span>
      </div>
      <h2 className="signin-q">Sign in</h2>
      <p className="signin-q-sub">Use your school email and password.</p>
      <input
        className="signin-input"
        type="email"
        placeholder="you@school.org"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoFocus
      />
      <input
        className="signin-input"
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      {error && <div style={{ color: "var(--coral-deep)", fontWeight: 700, marginBottom: 10 }}>{error}</div>}
      <button className="btn primary btn-big" disabled={busy || !email || !password}>
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  )
}
