const LS_KEY = "dt_revision_progress_v1"

export type LocalTopicEntry = {
  flashcardsDone?: boolean
  mcqBestScore?: number
}

export type LocalProgress = Record<string, LocalTopicEntry>

export function readLocalProgress(): LocalProgress {
  if (typeof localStorage === "undefined") return {}
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return (parsed && typeof parsed === "object" ? parsed : {}) as LocalProgress
  } catch {
    return {}
  }
}

function writeLocalProgress(next: LocalProgress) {
  if (typeof localStorage === "undefined") return
  localStorage.setItem(LS_KEY, JSON.stringify(next))
}

export function writeLocalFlashcardsDone(code: string, done: boolean) {
  const cur = readLocalProgress()
  cur[code] = { ...(cur[code] ?? {}), flashcardsDone: done }
  writeLocalProgress(cur)
}

export function writeLocalMcqScore(code: string, score: number) {
  const cur = readLocalProgress()
  const prev = cur[code]?.mcqBestScore ?? 0
  cur[code] = { ...(cur[code] ?? {}), mcqBestScore: Math.max(prev, score) }
  writeLocalProgress(cur)
}

export function clearLocalProgress() {
  if (typeof localStorage === "undefined") return
  localStorage.removeItem(LS_KEY)
}

export function localTopicPercent(entry: LocalTopicEntry | undefined): number {
  if (!entry) return 0
  const fc = entry.flashcardsDone ? 1 : 0
  const mcq = (entry.mcqBestScore ?? 0) >= 0.8 ? 1 : 0
  return Math.round(((fc + mcq) / 2) * 100)
}
