"use client"
import * as React from "react"

type Me = { signedIn: false } | { signedIn: true; firstName: string | null; email: string | null }

export function FloatingAuthButton() {
  const [me, setMe] = React.useState<Me | null>(null)

  React.useEffect(() => {
    let alive = true
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => { if (alive) setMe(d) })
      .catch(() => { if (alive) setMe({ signedIn: false }) })
    return () => { alive = false }
  }, [])

  if (!me) return null

  if (me.signedIn) {
    const name = me.firstName || (me.email ? me.email.split("@")[0] : "You")
    return (
      <a className="fab-auth fab-signed-in" href="/profile" aria-label="Open profile">
        <span className="fab-avatar">🦕</span>
        <span className="fab-text">
          <span className="fab-name">{name}</span>
          <span className="fab-sub">My profile</span>
        </span>
      </a>
    )
  }

  return (
    <a className="fab-auth fab-signed-out" href="/sign-in">
      <span className="fab-dino">🦕</span>
      <span className="fab-text">
        <span className="fab-name">Sign in</span>
        <span className="fab-sub">Save your progress</span>
      </span>
    </a>
  )
}
