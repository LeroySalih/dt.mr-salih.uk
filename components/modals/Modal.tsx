"use client"
import * as React from "react"

type Props = {
  topicCode: string
  tint: string
  onClose: () => void
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
}

const TINT_VARS: Record<string, { tint: string; deep: string }> = {
  mint:  { tint: "var(--mint)",  deep: "var(--mint-deep)"  },
  peach: { tint: "var(--peach)", deep: "var(--peach-deep)" },
  sky:   { tint: "var(--sky)",   deep: "var(--sky-deep)"   },
  lilac: { tint: "var(--lilac)", deep: "var(--lilac-deep)" },
  lemon: { tint: "var(--lemon)", deep: "var(--lemon-deep)" },
  coral: { tint: "var(--coral)", deep: "var(--coral-deep)" },
  teal:  { tint: "var(--teal)",  deep: "var(--teal-deep)"  },
}

export function Modal({ topicCode, tint, onClose, title, children, footer }: Props) {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = "" }
  }, [onClose])

  const vars = TINT_VARS[tint] ?? TINT_VARS.peach
  const style = { "--card-tint": vars.tint, "--card-deep": vars.deep } as React.CSSProperties

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={style}>
        <header className="modal-head">
          {topicCode && <span className="card-code">{topicCode}</span>}
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={onClose} aria-label="close">✕</button>
        </header>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  )
}
