import DOMPurify from "isomorphic-dompurify"

export function sanitiseHtml(raw: string): string {
  return DOMPurify.sanitize(raw, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ["script", "iframe", "object", "embed"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover"],
  })
}
