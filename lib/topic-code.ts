const CODE_PREFIX_RE = /^(\d+(?:\.\d+){1,2})\s*([\s\S]*?)\s*$/

export type ParsedTopicCode = { code: string; title: string }

export function parseTopicCode(raw: string | null | undefined): ParsedTopicCode | null {
  if (raw === null || raw === undefined) return null
  const trimmed = raw.trim()
  if (trimmed.length === 0) return null
  const match = CODE_PREFIX_RE.exec(trimmed)
  if (match) {
    return { code: match[1], title: match[2] }
  }
  return { code: "", title: trimmed }
}
