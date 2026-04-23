# dt.mr-salih.uk Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a pupil revision site at `dt.mr-salih.uk` that reads curriculum content from the existing `dino` PostgreSQL database (shared with planner-004), lets signed-in pupils persist progress to dino, and lets anonymous pupils use localStorage — matching the visual design in `Dino 2-design files/` pixel-for-pixel.

**Architecture:** Standalone Next.js 16 App Router app with `pg` connection pool, bcrypt/cookie auth (same pattern as planner-004), reads against `units`/`lessons`/`activities` tables, writes progress to `flashcard_sessions` + `submissions`, and enqueues explain answers onto `ai_marking_queue` for the shared n8n AI marking pipeline.

**Tech Stack:** Next.js 16, React 19, TypeScript, `pg`, bcryptjs, Zod, Vitest + React Testing Library, Playwright.

**Reference spec:** `docs/superpowers/specs/2026-04-23-dt-mr-salih-uk-design.md`

**Reference design files:** `Dino 2-design files/{v2.html,styles-v2.css,app-v2.jsx,auth-v2.jsx,topics.js,assets/}`

**Reference implementation (read-only — never import, always copy/adapt):** `/Users/leroysalih/nodejs/planner-004/src/lib/{db.ts,auth.ts,ai/marking-queue.ts,server-actions/auth.ts,server-actions/short-text.ts,server-actions/flashcards.ts}`

---

## Phase 0 — Cleanup & scaffold

### Task 0.1: Remove stale prototype files, initialise git

**Files:**
- Delete: `v2.html`, `styles-v2.css`, `app-v2.jsx`, `topics.js` (all in repo root — stale artefacts from an earlier session; the design source is `Dino 2-design files/`)
- Keep: `Dino 2-design files/` (authoritative design source)
- Keep: `docs/superpowers/` (specs + plans)
- Create: `.gitignore`

- [ ] **Step 1: Delete stale files**

```bash
cd /Users/leroysalih/nodejs/dt.mr-salih.uk
rm v2.html styles-v2.css app-v2.jsx topics.js
```

- [ ] **Step 2: Init git and write .gitignore**

```bash
git init -b main
```

Create `.gitignore`:

```
node_modules/
.next/
out/
.env.local
.env.*.local
*.log
.DS_Store
coverage/
playwright-report/
test-results/
```

- [ ] **Step 3: Initial commit**

```bash
git add .gitignore docs/ "Dino 2-design files/"
git commit -m "chore: initial commit with design files and spec"
```

---

### Task 0.2: Create Next.js project skeleton

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`

- [ ] **Step 1: Scaffold Next.js**

```bash
cd /Users/leroysalih/nodejs/dt.mr-salih.uk
npx -y create-next-app@latest . --typescript --app --no-src-dir --no-tailwind --no-eslint --import-alias "@/*" --use-pnpm --yes
```

Expected: creates `app/`, `public/`, `package.json`, `tsconfig.json`, `next.config.ts`.

- [ ] **Step 2: Add runtime dependencies**

```bash
pnpm add pg bcryptjs zod
pnpm add -D @types/pg @types/bcryptjs
```

- [ ] **Step 3: Add dev dependencies (test tooling)**

```bash
pnpm add -D vitest @vitest/ui @vitejs/plugin-react happy-dom @testing-library/react @testing-library/jest-dom @testing-library/user-event playwright @playwright/test
pnpm exec playwright install --with-deps chromium
```

- [ ] **Step 4: Add `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import path from "node:path"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
  test: {
    environment: "happy-dom",
    setupFiles: ["./tests/setup.ts"],
    globals: true,
  },
})
```

- [ ] **Step 5: Add `tests/setup.ts`**

```ts
import "@testing-library/jest-dom/vitest"
```

- [ ] **Step 6: Add test scripts to `package.json`**

Edit `package.json` → `"scripts"`:

```json
{
  "dev": "next dev --port 3100",
  "build": "next build",
  "start": "next start --port 3100",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:e2e": "playwright test"
}
```

- [ ] **Step 7: Verify dev server boots**

```bash
pnpm dev
```

Expected: Next.js boots on `http://localhost:3100` without errors. Stop it with Ctrl-C.

- [ ] **Step 8: Commit**

```bash
git add .
git commit -m "chore: scaffold next.js 16 app with vitest + playwright"
```

---

### Task 0.3: Copy design assets and stylesheet

**Files:**
- Create: `public/assets/salih-avatar.png`, `public/assets/hero-pupils.png`
- Create: `app/styles-v2.css` (copied verbatim)
- Modify: `app/layout.tsx` (import stylesheet, add fonts, set title)

- [ ] **Step 1: Copy image assets**

```bash
mkdir -p public/assets
cp "Dino 2-design files/assets/salih-avatar.png" public/assets/
cp "Dino 2-design files/assets/hero-pupils.png" public/assets/
```

- [ ] **Step 2: Copy stylesheet verbatim**

```bash
cp "Dino 2-design files/styles-v2.css" app/styles-v2.css
```

- [ ] **Step 3: Rewrite `app/layout.tsx`**

Replace contents with:

```tsx
import type { Metadata } from "next"
import "./styles-v2.css"

export const metadata: Metadata = {
  title: "dt.mr-salih.uk — iGCSE D&T Systems",
  description: "Pupil revision site for Edexcel iGCSE D&T Systems",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT@0,9..144,500..700,50..100;1,9..144,500..700,50..100&family=Nunito:wght@500;700;800&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
```

- [ ] **Step 4: Verify**

```bash
pnpm dev
```

Open `http://localhost:3100`. Expected: default Next.js starter page, but now rendered in the Nunito/Fraunces fonts from the design.

- [ ] **Step 5: Commit**

```bash
git add public/assets app/styles-v2.css app/layout.tsx
git commit -m "feat: port design stylesheet and assets"
```

---

### Task 0.4: Environment config

**Files:**
- Create: `.env.local`, `.env.example`

- [ ] **Step 1: Create `.env.example`** (committed)

```
DATABASE_URL=postgresql://postgres:<password>@localhost:5432/dino?sslmode=disable
OPEN_AI_KEY=
N8N_MARKING_WEBHOOK_URL=https://n8n.mr-salih.org/webhook/ai-marking
AI_MARK_WEBHOOK_URL=
MARKING_QUEUE_SECRET=
COOKIE_DOMAIN=
NODE_ENV=development
```

- [ ] **Step 2: Create `.env.local`** (not committed; values from planner-004's `.env` that the user already has)

Copy `DATABASE_URL`, `OPEN_AI_KEY`, `N8N_MARKING_WEBHOOK_URL`, `MARKING_QUEUE_SECRET` from `/Users/leroysalih/nodejs/planner-004/.env`.

Leave `COOKIE_DOMAIN` empty in development; set to `.mr-salih.uk` in prod/dev deploys.

- [ ] **Step 3: Commit**

```bash
git add .env.example
git commit -m "chore: document environment variables"
```

---

## Phase 1 — Database + content layer

### Task 1.1: `lib/db.ts` — connection pool

**Files:**
- Create: `lib/db.ts`
- Create: `tests/lib/db.test.ts`

- [ ] **Step 1: Write failing test**

`tests/lib/db.test.ts`:

```ts
import { describe, it, expect, vi } from "vitest"

describe("lib/db", () => {
  it("query throws when DATABASE_URL is missing", async () => {
    vi.stubEnv("DATABASE_URL", "")
    vi.resetModules()
    const { query } = await import("@/lib/db")
    await expect(query("select 1")).rejects.toThrow(/DATABASE_URL/i)
    vi.unstubAllEnvs()
  })
})
```

- [ ] **Step 2: Run test, verify it fails**

```bash
pnpm test tests/lib/db.test.ts
```

Expected: FAIL (`Cannot find module '@/lib/db'`).

- [ ] **Step 3: Create `lib/db.ts`** — copy-adapt from `/Users/leroysalih/nodejs/planner-004/src/lib/db.ts` verbatim (it's only 119 lines and already handles retry, SSL config, pool reset on connection errors).

- [ ] **Step 4: Run test, verify it passes**

```bash
pnpm test tests/lib/db.test.ts
```

Expected: PASS.

- [ ] **Step 5: Smoke-test against real dino**

Create `scripts/db-smoke.ts`:

```ts
import { query } from "@/lib/db"

async function main() {
  const { rows } = await query<{ table_name: string }>(
    `select table_name from information_schema.tables where table_schema = 'public' and table_name in ('units','lessons','activities','profiles','auth_sessions','submissions','flashcard_sessions','ai_marking_queue','pupil_activity_feedback','group_membership','groups') order by table_name`,
  )
  console.log(rows.map((r) => r.table_name).join("\n"))
  if (rows.length !== 11) throw new Error(`Expected 11 shared tables, got ${rows.length}`)
  console.log("✓ All expected tables present")
  process.exit(0)
}
main().catch((e) => { console.error(e); process.exit(1) })
```

Run:

```bash
pnpm tsx scripts/db-smoke.ts
```

(install `tsx` if missing: `pnpm add -D tsx`)

Expected: prints 11 table names and `✓ All expected tables present`.

- [ ] **Step 6: Commit**

```bash
git add lib/db.ts tests/lib/db.test.ts scripts/db-smoke.ts
git commit -m "feat(db): add pg pool with retry and smoke test"
```

---

### Task 1.2: Resolve open items against the live database

Open items from the spec §11 must be resolved before content loading can be coded. These queries inspect the live dino database to confirm column names and data conventions.

**Files:**
- Create: `scripts/inspect-dino.ts`

- [ ] **Step 1: Create inspect script**

```ts
import { query } from "@/lib/db"

async function main() {
  // 1. activities columns
  const cols = await query<{ column_name: string; data_type: string }>(
    `select column_name, data_type from information_schema.columns where table_name = 'activities' order by ordinal_position`,
  )
  console.log("activities columns:")
  cols.rows.forEach((r) => console.log(`  - ${r.column_name}: ${r.data_type}`))

  // 2. Do the 4 expected units exist?
  const units = await query<{ unit_id: string; title: string; subject: string | null }>(
    `select unit_id, title, subject from units where title in ('Core 1','Core 2','Core 3','Systems') order by title`,
  )
  console.log(`\nMatching units (expect 4): ${units.rows.length}`)
  units.rows.forEach((u) => console.log(`  - ${u.title} (subject=${u.subject ?? "null"}, id=${u.unit_id})`))

  // 3. Lesson titles under those units — confirm code prefix convention
  const lessons = await query<{ title: string; unit_title: string }>(
    `select l.title, u.title as unit_title from lessons l join units u on u.unit_id = l.unit_id where u.title in ('Core 1','Core 2','Core 3','Systems') order by u.title, l.order_by`,
  )
  console.log(`\nLessons in those units: ${lessons.rows.length}`)
  lessons.rows.slice(0, 5).forEach((l) => console.log(`  - [${l.unit_title}] ${l.title}`))
  if (lessons.rows.length > 5) console.log(`  … (${lessons.rows.length - 5} more)`)

  // 4. Distinct activity types present under those units
  const types = await query<{ type: string | null; n: number }>(
    `select a.type, count(*)::int as n from activities a join lessons l on l.lesson_id = a.lesson_id join units u on u.unit_id = l.unit_id where u.title in ('Core 1','Core 2','Core 3','Systems') group by a.type order by n desc`,
  )
  console.log(`\nActivity types in those units:`)
  types.rows.forEach((t) => console.log(`  - ${t.type ?? "null"}: ${t.n}`))

  // 5. Sample flashcard activity body_data shape
  const fc = await query<{ activity_id: string; lesson_id: string | null; body_data: unknown }>(
    `select a.activity_id, a.lesson_id, a.body_data from activities a join lessons l on l.lesson_id = a.lesson_id join units u on u.unit_id = l.unit_id where u.title in ('Core 1','Core 2','Core 3','Systems') and a.type = 'flashcard' limit 1`,
  )
  console.log(`\nSample flashcard body_data (if any):`)
  console.log(JSON.stringify(fc.rows[0] ?? null, null, 2))

  // 6. Sample display-text body_data
  const dt = await query<{ activity_id: string; body_data: unknown }>(
    `select a.activity_id, a.body_data from activities a join lessons l on l.lesson_id = a.lesson_id join units u on u.unit_id = l.unit_id where u.title in ('Core 1','Core 2','Core 3','Systems') and a.type = 'display-text' limit 1`,
  )
  console.log(`\nSample display-text body_data (if any):`)
  console.log(JSON.stringify(dt.rows[0] ?? null, null, 2))

  process.exit(0)
}
main().catch((e) => { console.error(e); process.exit(1) })
```

- [ ] **Step 2: Run it**

```bash
pnpm tsx scripts/inspect-dino.ts
```

- [ ] **Step 3: Record findings in a note file**

Create `docs/superpowers/notes/dino-content-shapes.md` and paste the output. This becomes the reference for all later content-loader code. If any of the five open items from the spec is not resolved by this script, expand the script to probe further until all are.

- [ ] **Step 4: Commit**

```bash
git add scripts/inspect-dino.ts docs/superpowers/notes/dino-content-shapes.md
git commit -m "docs(content): record dino activity/unit/lesson shapes"
```

---

### Task 1.3: `lib/topic-code.ts` — parse topic code from lesson title

**Files:**
- Create: `lib/topic-code.ts`
- Create: `tests/lib/topic-code.test.ts`

- [ ] **Step 1: Write failing tests**

`tests/lib/topic-code.test.ts`:

```ts
import { describe, it, expect } from "vitest"
import { parseTopicCode } from "@/lib/topic-code"

describe("parseTopicCode", () => {
  it("extracts a core code from the title prefix", () => {
    expect(parseTopicCode("1.5 Design strategies and iterative design")).toEqual({
      code: "1.5",
      title: "Design strategies and iterative design",
    })
  })

  it("extracts a systems code from the title prefix", () => {
    expect(parseTopicCode("5.4 Programmable components and microcontrollers")).toEqual({
      code: "5.4",
      title: "Programmable components and microcontrollers",
    })
  })

  it("handles two-digit minor codes", () => {
    expect(parseTopicCode("1.17 Modern and smart materials")).toEqual({
      code: "1.17",
      title: "Modern and smart materials",
    })
  })

  it("tolerates extra whitespace", () => {
    expect(parseTopicCode("  5.1   Sources and origins  ")).toEqual({
      code: "5.1",
      title: "Sources and origins",
    })
  })

  it("returns null when no code prefix is present", () => {
    expect(parseTopicCode("Introduction to D&T")).toBeNull()
  })

  it("returns null for empty strings", () => {
    expect(parseTopicCode("")).toBeNull()
    expect(parseTopicCode("   ")).toBeNull()
  })
})
```

- [ ] **Step 2: Run tests, verify all fail**

```bash
pnpm test tests/lib/topic-code.test.ts
```

Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

`lib/topic-code.ts`:

```ts
const CODE_RE = /^\s*(\d+\.\d+)\s+(.+?)\s*$/

export type ParsedTopicCode = { code: string; title: string }

export function parseTopicCode(raw: string | null | undefined): ParsedTopicCode | null {
  if (!raw) return null
  const match = CODE_RE.exec(raw)
  if (!match) return null
  const [, code, title] = match
  if (!title) return null
  return { code, title }
}
```

- [ ] **Step 4: Run tests, verify all pass**

```bash
pnpm test tests/lib/topic-code.test.ts
```

Expected: PASS (6 assertions).

- [ ] **Step 5: Commit**

```bash
git add lib/topic-code.ts tests/lib/topic-code.test.ts
git commit -m "feat(content): parse topic code from lesson title"
```

---

### Task 1.4: `lib/content.ts` — topic list loader

Loads all 25 topics (lessons in Core 1/2/3 and Systems units) with metadata and per-topic activity counts. No pupil context yet.

**Files:**
- Create: `lib/content.ts`
- Create: `tests/lib/content.integration.test.ts` (live DB test)

- [ ] **Step 1: Write integration test**

`tests/lib/content.integration.test.ts`:

```ts
import { describe, it, expect } from "vitest"
import { listTopics } from "@/lib/content"

describe("listTopics (integration)", () => {
  it("returns exactly 25 topics split between core and systems", async () => {
    const topics = await listTopics()
    expect(topics.length).toBe(25)
    const core = topics.filter((t) => t.section === "core")
    const systems = topics.filter((t) => t.section === "systems")
    expect(core.length).toBe(17)
    expect(systems.length).toBe(8)
  })

  it("every topic has a non-empty parsed code and title", async () => {
    const topics = await listTopics()
    for (const t of topics) {
      expect(t.code).toMatch(/^\d+\.\d+$/)
      expect(t.title.length).toBeGreaterThan(0)
      expect(t.lessonId.length).toBeGreaterThan(0)
    }
  })

  it("core topics have codes starting with 1.", async () => {
    const topics = await listTopics()
    for (const t of topics.filter((x) => x.section === "core")) {
      expect(t.code.startsWith("1.")).toBe(true)
    }
  })

  it("systems topics have codes starting with 5.", async () => {
    const topics = await listTopics()
    for (const t of topics.filter((x) => x.section === "systems")) {
      expect(t.code.startsWith("5.")).toBe(true)
    }
  })
})
```

- [ ] **Step 2: Run test, verify it fails**

```bash
pnpm test tests/lib/content.integration.test.ts
```

Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

`lib/content.ts`:

```ts
import { query } from "@/lib/db"
import { parseTopicCode } from "@/lib/topic-code"

export type TopicSection = "core" | "systems"

export type TopicSummary = {
  code: string
  title: string
  section: TopicSection
  lessonId: string
  unitId: string
  unitTitle: string
  vocabCount: number
}

const CORE_UNITS = ["Core 1", "Core 2", "Core 3"]
const SYSTEMS_UNITS = ["Systems"]
const ALL_UNITS = [...CORE_UNITS, ...SYSTEMS_UNITS]

type Row = {
  lesson_id: string
  lesson_title: string | null
  unit_id: string
  unit_title: string
  vocab_count: number
}

export async function listTopics(): Promise<TopicSummary[]> {
  const { rows } = await query<Row>(
    `
      select
        l.lesson_id,
        l.title as lesson_title,
        u.unit_id,
        u.title as unit_title,
        coalesce((
          select jsonb_array_length(a.body_data -> 'cards')
          from activities a
          where a.lesson_id = l.lesson_id
            and a.type = 'flashcard'
            and coalesce(a.active, true) = true
          limit 1
        ), 0)::int as vocab_count
      from lessons l
      join units u on u.unit_id = l.unit_id
      where u.title = any($1::text[])
        and coalesce(l.active, true) = true
        and coalesce(u.active, true) = true
      order by l.order_by nulls last, l.title
    `,
    [ALL_UNITS],
  )

  return rows
    .map((row) => {
      const parsed = parseTopicCode(row.lesson_title)
      if (!parsed) return null
      const section: TopicSection = CORE_UNITS.includes(row.unit_title) ? "core" : "systems"
      return {
        code: parsed.code,
        title: parsed.title,
        section,
        lessonId: row.lesson_id,
        unitId: row.unit_id,
        unitTitle: row.unit_title,
        vocabCount: row.vocab_count ?? 0,
      } satisfies TopicSummary
    })
    .filter((t): t is TopicSummary => t !== null)
}
```

**Note on flashcard shape:** this assumes `body_data -> 'cards'` is the array of flashcards. If the inspect script in Task 1.2 revealed a different shape, adjust the `jsonb_array_length` path accordingly before running the test.

- [ ] **Step 4: Run integration test, verify it passes**

```bash
pnpm test tests/lib/content.integration.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/content.ts tests/lib/content.integration.test.ts
git commit -m "feat(content): list all 25 topics from dino"
```

---

### Task 1.5: `lib/content.ts` — topic detail loader

Loads a single topic's full content: the ordered activity list (display-text, MCQ, short-text, flashcard).

**Files:**
- Modify: `lib/content.ts`
- Create: `tests/lib/content-detail.integration.test.ts`

- [ ] **Step 1: Write integration test**

`tests/lib/content-detail.integration.test.ts`:

```ts
import { describe, it, expect } from "vitest"
import { getTopicByCode } from "@/lib/content"

describe("getTopicByCode (integration)", () => {
  it("returns the topic and its ordered activities", async () => {
    const topic = await getTopicByCode("5.4")
    expect(topic).not.toBeNull()
    expect(topic!.code).toBe("5.4")
    expect(topic!.activities.length).toBeGreaterThan(0)
    for (const a of topic!.activities) {
      expect(a.activityId.length).toBeGreaterThan(0)
      expect(["display-text", "multiple-choice-question", "short-text-question", "flashcard"]).toContain(a.type)
    }
  })

  it("activities are sorted by order", async () => {
    const topic = await getTopicByCode("1.1")
    expect(topic).not.toBeNull()
    const orders = topic!.activities.map((a) => a.orderBy)
    const sorted = [...orders].sort((a, b) => a - b)
    expect(orders).toEqual(sorted)
  })

  it("returns null for an unknown code", async () => {
    expect(await getTopicByCode("9.9")).toBeNull()
  })
})
```

- [ ] **Step 2: Run test, verify it fails**

```bash
pnpm test tests/lib/content-detail.integration.test.ts
```

Expected: FAIL (`getTopicByCode is not a function`).

- [ ] **Step 3: Extend `lib/content.ts`**

Append:

```ts
export type ActivityType = "display-text" | "multiple-choice-question" | "short-text-question" | "flashcard"

export type Activity = {
  activityId: string
  type: ActivityType
  title: string | null
  orderBy: number
  bodyData: unknown
}

export type TopicDetail = TopicSummary & {
  activities: Activity[]
}

export async function getTopicByCode(code: string): Promise<TopicDetail | null> {
  const topics = await listTopics()
  const summary = topics.find((t) => t.code === code)
  if (!summary) return null

  const { rows } = await query<{
    activity_id: string
    type: string | null
    title: string | null
    order_by: number | null
    body_data: unknown
  }>(
    `
      select activity_id, type, title, coalesce(order_by, 0) as order_by, body_data
      from activities
      where lesson_id = $1
        and coalesce(active, true) = true
        and type = any(array['display-text','multiple-choice-question','short-text-question','flashcard'])
      order by order_by nulls last, activity_id
    `,
    [summary.lessonId],
  )

  const activities: Activity[] = rows
    .filter((r): r is typeof r & { type: ActivityType } =>
      r.type === "display-text" ||
      r.type === "multiple-choice-question" ||
      r.type === "short-text-question" ||
      r.type === "flashcard"
    )
    .map((r) => ({
      activityId: r.activity_id,
      type: r.type,
      title: r.title,
      orderBy: r.order_by ?? 0,
      bodyData: r.body_data,
    }))

  return { ...summary, activities }
}
```

- [ ] **Step 4: Run tests, verify they pass**

```bash
pnpm test tests/lib/content-detail.integration.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/content.ts tests/lib/content-detail.integration.test.ts
git commit -m "feat(content): load a single topic with ordered activities"
```

---

## Phase 2 — Auth

### Task 2.1: `lib/auth.ts` — sessions, cookies, password verify

Copy-adapt the essentials of planner-004's `auth.ts` (session cookie, bcrypt helpers, `createSession`, `endSession`, `getAuthenticatedProfile`). Cookie name: `dt_session` (distinct from planner-004's `planner_session`). No CSRF / throttling in v1 — flagged in the "Deferred" section at the end.

**Files:**
- Create: `lib/auth.ts`
- Create: `tests/lib/auth.test.ts`

- [ ] **Step 1: Write unit tests for pure helpers**

`tests/lib/auth.test.ts`:

```ts
import { describe, it, expect } from "vitest"
import { hashPassword, verifyPassword } from "@/lib/auth"

describe("lib/auth password helpers", () => {
  it("hashPassword produces a bcrypt hash that verifyPassword accepts", async () => {
    const hash = await hashPassword("correct horse battery staple")
    expect(hash).toMatch(/^\$2[aby]?\$/)
    expect(await verifyPassword("correct horse battery staple", hash)).toBe(true)
    expect(await verifyPassword("wrong password", hash)).toBe(false)
  })
})
```

- [ ] **Step 2: Run test, verify it fails**

```bash
pnpm test tests/lib/auth.test.ts
```

Expected: FAIL (module not found).

- [ ] **Step 3: Create `lib/auth.ts`**

```ts
import { randomBytes, randomUUID } from "node:crypto"
import { cookies, headers } from "next/headers"
import bcrypt from "bcryptjs"
import { query } from "@/lib/db"

const SESSION_COOKIE = "dt_session"
const SESSION_TTL_MS = 60 * 60 * 1000 // 1 hour rolling
const BCRYPT_COST = 10

export type Profile = {
  userId: string
  email: string | null
  firstName: string | null
  lastName: string | null
  isTeacher: boolean
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, BCRYPT_COST)
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}

function cookieSecure() {
  return process.env.NODE_ENV === "production"
}

function cookieDomain() {
  const d = process.env.COOKIE_DOMAIN
  return d && d.length > 0 ? d : undefined
}

async function setSessionCookie(sessionId: string, token: string, expiresAt: Date) {
  const store = await cookies()
  store.set({
    name: SESSION_COOKIE,
    value: `${sessionId}.${token}`,
    httpOnly: true,
    sameSite: "lax",
    secure: cookieSecure(),
    domain: cookieDomain(),
    path: "/",
    expires: expiresAt,
  })
}

async function clearSessionCookie() {
  try {
    const store = await cookies()
    store.set({
      name: SESSION_COOKIE,
      value: "",
      httpOnly: true,
      sameSite: "lax",
      secure: cookieSecure(),
      domain: cookieDomain(),
      path: "/",
      maxAge: 0,
    })
  } catch {
    // Mutation may be disallowed in RSC; best-effort.
  }
}

function parseSessionCookie(raw: string | undefined | null) {
  if (!raw) return null
  const [sessionId, token] = raw.split(".")
  if (!sessionId || !token) return null
  return { sessionId, token }
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url")
  const tokenHash = await bcrypt.hash(token, BCRYPT_COST)
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS)
  const headerList = await headers()
  const ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null
  const userAgent = headerList.get("user-agent") ?? null

  const sessionId = randomUUID()
  await query(
    `insert into auth_sessions (session_id, user_id, token_hash, expires_at, ip, user_agent)
     values ($1, $2, $3, $4, $5, $6)`,
    [sessionId, userId, tokenHash, expiresAt.toISOString(), ip, userAgent],
  )

  await setSessionCookie(sessionId, token, expiresAt)
}

export async function endSession() {
  const store = await cookies()
  const parsed = parseSessionCookie(store.get(SESSION_COOKIE)?.value ?? null)
  if (parsed?.sessionId) {
    await query("delete from auth_sessions where session_id = $1", [parsed.sessionId])
  }
  await clearSessionCookie()
}

export async function getAuthenticatedProfile(): Promise<Profile | null> {
  const store = await cookies()
  const parsed = parseSessionCookie(store.get(SESSION_COOKIE)?.value ?? null)
  if (!parsed) return null

  const { rows } = await query<{
    session_id: string
    user_id: string
    token_hash: string
    expires_at: string
  }>(
    `select session_id, user_id, token_hash, expires_at from auth_sessions where session_id = $1 limit 1`,
    [parsed.sessionId],
  )
  const session = rows[0]
  if (!session) {
    await clearSessionCookie()
    return null
  }

  const expiresAt = new Date(session.expires_at)
  if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) {
    await query("delete from auth_sessions where session_id = $1", [parsed.sessionId])
    await clearSessionCookie()
    return null
  }

  const matches = await bcrypt.compare(parsed.token, session.token_hash)
  if (!matches) {
    await query("delete from auth_sessions where session_id = $1", [parsed.sessionId])
    await clearSessionCookie()
    return null
  }

  const { rows: profileRows } = await query<{
    user_id: string
    email: string | null
    is_teacher: boolean | null
    first_name: string | null
    last_name: string | null
  }>(
    `select user_id, email, is_teacher, first_name, last_name from profiles where user_id = $1 limit 1`,
    [session.user_id],
  )
  const p = profileRows[0]
  if (!p) return null

  return {
    userId: p.user_id,
    email: p.email,
    firstName: p.first_name,
    lastName: p.last_name,
    isTeacher: Boolean(p.is_teacher),
  }
}
```

- [ ] **Step 4: Run tests, verify they pass**

```bash
pnpm test tests/lib/auth.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/auth.ts tests/lib/auth.test.ts
git commit -m "feat(auth): session cookie + bcrypt password helpers"
```

---

### Task 2.2: `POST /api/auth/sign-in` route

**Files:**
- Create: `app/api/auth/sign-in/route.ts`
- Create: `lib/sign-in.ts` (extracted logic for testability)
- Create: `tests/lib/sign-in.test.ts`

- [ ] **Step 1: Write failing test for `authenticate()` helper**

`tests/lib/sign-in.test.ts`:

```ts
import { describe, it, expect, beforeAll } from "vitest"
import { hashPassword } from "@/lib/auth"
import { query } from "@/lib/db"
import { authenticate } from "@/lib/sign-in"

const TEST_EMAIL = `test-${Date.now()}@example.invalid`
const TEST_PASSWORD = "hunter2-strong-password"
let userId: string

beforeAll(async () => {
  const hash = await hashPassword(TEST_PASSWORD)
  const { rows } = await query<{ user_id: string }>(
    `insert into profiles (user_id, email, password_hash, is_teacher)
     values (gen_random_uuid()::text, $1, $2, false)
     returning user_id`,
    [TEST_EMAIL, hash],
  )
  userId = rows[0].user_id
})

describe("authenticate", () => {
  it("returns the profile when email + password match", async () => {
    const result = await authenticate(TEST_EMAIL, TEST_PASSWORD)
    expect(result.success).toBe(true)
    expect(result.userId).toBe(userId)
  })

  it("fails with wrong password", async () => {
    const result = await authenticate(TEST_EMAIL, "not-the-password")
    expect(result.success).toBe(false)
    expect(result.userId).toBeNull()
  })

  it("fails with unknown email", async () => {
    const result = await authenticate(`nobody-${Date.now()}@example.invalid`, "x")
    expect(result.success).toBe(false)
  })
})
```

- [ ] **Step 2: Run test, verify it fails**

```bash
pnpm test tests/lib/sign-in.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Create `lib/sign-in.ts`**

```ts
import { query } from "@/lib/db"
import { verifyPassword } from "@/lib/auth"

export type AuthResult =
  | { success: true; userId: string }
  | { success: false; userId: null; error: string }

export async function authenticate(rawEmail: string, password: string): Promise<AuthResult> {
  const email = rawEmail.trim().toLowerCase()
  if (!email || !password) {
    return { success: false, userId: null, error: "Email and password are required." }
  }

  const { rows } = await query<{ user_id: string; password_hash: string | null }>(
    `select user_id, password_hash from profiles where lower(email) = lower($1) limit 1`,
    [email],
  )
  const profile = rows[0]
  if (!profile?.password_hash) {
    return { success: false, userId: null, error: "Invalid email or password." }
  }

  const ok = await verifyPassword(password, profile.password_hash)
  if (!ok) {
    return { success: false, userId: null, error: "Invalid email or password." }
  }
  return { success: true, userId: profile.user_id }
}
```

- [ ] **Step 4: Create route handler**

`app/api/auth/sign-in/route.ts`:

```ts
import { NextResponse } from "next/server"
import { z } from "zod"
import { authenticate } from "@/lib/sign-in"
import { createSession } from "@/lib/auth"

const Body = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST(request: Request) {
  const json = await request.json().catch(() => null)
  const parsed = Body.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid payload." }, { status: 400 })
  }

  const result = await authenticate(parsed.data.email, parsed.data.password)
  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 401 })
  }

  await createSession(result.userId)
  return NextResponse.json({ success: true })
}
```

- [ ] **Step 5: Run tests, verify they pass**

```bash
pnpm test tests/lib/sign-in.test.ts
```

Expected: PASS. Clean up the test row (`delete from profiles where email like 'test-%@example.invalid'` — run manually or add to test teardown).

- [ ] **Step 6: Commit**

```bash
git add lib/sign-in.ts app/api/auth/sign-in/route.ts tests/lib/sign-in.test.ts
git commit -m "feat(auth): POST /api/auth/sign-in"
```

---

### Task 2.3: `POST /api/auth/sign-out` route

**Files:**
- Create: `app/api/auth/sign-out/route.ts`

- [ ] **Step 1: Create route**

```ts
import { NextResponse } from "next/server"
import { endSession } from "@/lib/auth"

export async function POST() {
  await endSession()
  return NextResponse.json({ success: true })
}
```

- [ ] **Step 2: Manual smoke test**

Start `pnpm dev`, sign in via a hand-crafted fetch (using a test account's real email/password), then:

```bash
curl -i -X POST http://localhost:3100/api/auth/sign-out --cookie "dt_session=..."
```

Expected: `200 OK` and `Set-Cookie: dt_session=; Max-Age=0; …`.

- [ ] **Step 3: Commit**

```bash
git add app/api/auth/sign-out/route.ts
git commit -m "feat(auth): POST /api/auth/sign-out"
```

---

## Phase 3 — Progress

### Task 3.1: `lib/progress.ts` — compute progress for signed-in pupils

**Files:**
- Create: `lib/progress.ts`
- Create: `tests/lib/progress.integration.test.ts`

- [ ] **Step 1: Write integration test**

`tests/lib/progress.integration.test.ts`:

```ts
import { describe, it, expect } from "vitest"
import { computeTopicProgress } from "@/lib/progress"
import { listTopics } from "@/lib/content"

describe("computeTopicProgress (integration)", () => {
  it("returns all three booleans false for a brand-new pupil id", async () => {
    const topics = await listTopics()
    const first = topics[0]
    const progress = await computeTopicProgress({
      pupilId: "does-not-exist-00000000",
      lessonIds: [first.lessonId],
    })
    expect(progress[first.lessonId]).toEqual({
      flashcardsDone: false,
      mcqPassed: false,
      explainDone: false,
    })
  })

  it("returns a map keyed by lesson id for every input id", async () => {
    const topics = await listTopics()
    const ids = topics.slice(0, 3).map((t) => t.lessonId)
    const progress = await computeTopicProgress({ pupilId: "does-not-exist-00000000", lessonIds: ids })
    for (const id of ids) {
      expect(progress[id]).toBeDefined()
    }
  })
})
```

- [ ] **Step 2: Run test, verify it fails**

```bash
pnpm test tests/lib/progress.integration.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement**

`lib/progress.ts`:

```ts
import { query } from "@/lib/db"

export type TopicProgress = {
  flashcardsDone: boolean
  mcqPassed: boolean
  explainDone: boolean
}

export async function computeTopicProgress(params: {
  pupilId: string
  lessonIds: string[]
}): Promise<Record<string, TopicProgress>> {
  const { pupilId, lessonIds } = params
  if (lessonIds.length === 0) return {}

  // 1. Flashcards: any completed session for the lesson's flashcard activity
  const { rows: fcRows } = await query<{ lesson_id: string }>(
    `
      select distinct a.lesson_id
      from flashcard_sessions fs
      join activities a on a.activity_id = fs.activity_id
      where fs.pupil_id = $1
        and a.lesson_id = any($2::text[])
        and fs.status = 'completed'
    `,
    [pupilId, lessonIds],
  )
  const flashcardsDoneSet = new Set(fcRows.map((r) => r.lesson_id))

  // 2. MCQ: mean score across all MCQ activities in the lesson >= 0.8
  // Latest submission per (activity, pupil), scored via existing compute_submission_base_score
  const { rows: mcqRows } = await query<{ lesson_id: string; mean_score: number | null }>(
    `
      with mcq_acts as (
        select activity_id, lesson_id
        from activities
        where lesson_id = any($2::text[])
          and type = 'multiple-choice-question'
          and coalesce(active, true) = true
      ),
      latest_sub as (
        select distinct on (s.activity_id)
          s.activity_id,
          public.compute_submission_base_score(s.body, 'multiple-choice-question') as score
        from submissions s
        join mcq_acts ma on ma.activity_id = s.activity_id
        where s.user_id = $1
        order by s.activity_id, s.submitted_at desc nulls last
      )
      select ma.lesson_id, avg(ls.score)::float as mean_score
      from mcq_acts ma
      left join latest_sub ls on ls.activity_id = ma.activity_id
      group by ma.lesson_id
    `,
    [pupilId, lessonIds],
  )
  const mcqPassedSet = new Set(
    mcqRows.filter((r) => (r.mean_score ?? 0) >= 0.8).map((r) => r.lesson_id),
  )

  // 3. Explain: every short-text activity in the lesson has both a submission and a feedback row
  const { rows: expRows } = await query<{
    lesson_id: string
    required: number
    satisfied: number
  }>(
    `
      with ex_acts as (
        select activity_id, lesson_id
        from activities
        where lesson_id = any($2::text[])
          and type = 'short-text-question'
          and coalesce(active, true) = true
      )
      select
        ea.lesson_id,
        count(*)::int as required,
        count(*) filter (
          where exists (select 1 from submissions s where s.activity_id = ea.activity_id and s.user_id = $1)
            and exists (
              select 1 from pupil_activity_feedback f
              where f.activity_id = ea.activity_id
                and f.pupil_id = $1
                and f.source in ('auto','ai','teacher')
            )
        )::int as satisfied
      from ex_acts ea
      group by ea.lesson_id
    `,
    [pupilId, lessonIds],
  )
  const explainDoneSet = new Set(
    expRows.filter((r) => r.required > 0 && r.satisfied === r.required).map((r) => r.lesson_id),
  )

  const out: Record<string, TopicProgress> = {}
  for (const id of lessonIds) {
    out[id] = {
      flashcardsDone: flashcardsDoneSet.has(id),
      mcqPassed: mcqPassedSet.has(id),
      explainDone: explainDoneSet.has(id),
    }
  }
  return out
}

export function topicPercent(p: TopicProgress | undefined, isSignedIn: boolean): number {
  if (!p) return 0
  if (isSignedIn) {
    const yes = [p.flashcardsDone, p.mcqPassed, p.explainDone].filter(Boolean).length
    return Math.round((yes / 3) * 100)
  }
  const yes = [p.flashcardsDone, p.mcqPassed].filter(Boolean).length
  return Math.round((yes / 2) * 100)
}
```

- [ ] **Step 4: Run tests, verify they pass**

```bash
pnpm test tests/lib/progress.integration.test.ts
```

Expected: PASS.

- [ ] **Step 5: Add unit tests for `topicPercent`**

Append to `tests/lib/progress.integration.test.ts`:

```ts
import { topicPercent } from "@/lib/progress"

describe("topicPercent", () => {
  const allFalse = { flashcardsDone: false, mcqPassed: false, explainDone: false }
  const allTrue = { flashcardsDone: true, mcqPassed: true, explainDone: true }

  it("anonymous (2 boxes): 0%, 50%, 100%", () => {
    expect(topicPercent(allFalse, false)).toBe(0)
    expect(topicPercent({ ...allFalse, flashcardsDone: true }, false)).toBe(50)
    expect(topicPercent(allTrue, false)).toBe(100)
  })

  it("signed-in (3 boxes): 0%, ~33%, ~67%, 100%", () => {
    expect(topicPercent(allFalse, true)).toBe(0)
    expect(topicPercent({ ...allFalse, flashcardsDone: true }, true)).toBe(33)
    expect(topicPercent({ ...allFalse, flashcardsDone: true, mcqPassed: true }, true)).toBe(67)
    expect(topicPercent(allTrue, true)).toBe(100)
  })
})
```

Run:

```bash
pnpm test tests/lib/progress.integration.test.ts
```

Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/progress.ts tests/lib/progress.integration.test.ts
git commit -m "feat(progress): compute per-topic progress for signed-in pupils"
```

---

### Task 3.2: `lib/progress-client.ts` — client-side progress adapter

**Files:**
- Create: `lib/progress-client.ts`
- Create: `tests/lib/progress-client.test.ts`

- [ ] **Step 1: Write tests**

`tests/lib/progress-client.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest"
import { readLocalProgress, writeLocalFlashcardsDone, writeLocalMcqScore, clearLocalProgress } from "@/lib/progress-client"

beforeEach(() => {
  localStorage.clear()
})

describe("local progress", () => {
  it("defaults to empty map", () => {
    expect(readLocalProgress()).toEqual({})
  })

  it("writes and reads flashcardsDone per topic code", () => {
    writeLocalFlashcardsDone("1.5", true)
    expect(readLocalProgress()["1.5"]?.flashcardsDone).toBe(true)
  })

  it("writes and reads mcq score (0..1)", () => {
    writeLocalMcqScore("5.4", 0.9)
    expect(readLocalProgress()["5.4"]?.mcqBestScore).toBe(0.9)
  })

  it("keeps the best score only", () => {
    writeLocalMcqScore("5.4", 0.6)
    writeLocalMcqScore("5.4", 0.9)
    writeLocalMcqScore("5.4", 0.7)
    expect(readLocalProgress()["5.4"]?.mcqBestScore).toBe(0.9)
  })

  it("clearLocalProgress wipes everything", () => {
    writeLocalFlashcardsDone("1.5", true)
    clearLocalProgress()
    expect(readLocalProgress()).toEqual({})
  })
})
```

- [ ] **Step 2: Run tests, verify they fail**

```bash
pnpm test tests/lib/progress-client.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement**

`lib/progress-client.ts`:

```ts
const LS_KEY = "dt_revision_progress_v1"

export type LocalTopicEntry = {
  flashcardsDone?: boolean
  mcqBestScore?: number // 0..1
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
```

- [ ] **Step 4: Run tests, verify they pass**

```bash
pnpm test tests/lib/progress-client.test.ts
```

Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/progress-client.ts tests/lib/progress-client.test.ts
git commit -m "feat(progress): anonymous-pupil localStorage adapter"
```

---

## Phase 4 — Landing page

### Task 4.1: `GET /api/topics`

Returns the 25 topics with per-pupil progress (signed-in) or an empty progress map (anonymous). Client then merges with localStorage.

**Files:**
- Create: `app/api/topics/route.ts`

- [ ] **Step 1: Implement**

```ts
import { NextResponse } from "next/server"
import { listTopics } from "@/lib/content"
import { computeTopicProgress } from "@/lib/progress"
import { getAuthenticatedProfile } from "@/lib/auth"

export async function GET() {
  const topics = await listTopics()
  const profile = await getAuthenticatedProfile()

  let progress: Awaited<ReturnType<typeof computeTopicProgress>> = {}
  if (profile) {
    progress = await computeTopicProgress({
      pupilId: profile.userId,
      lessonIds: topics.map((t) => t.lessonId),
    })
  }

  return NextResponse.json({
    signedIn: Boolean(profile),
    profile: profile
      ? { userId: profile.userId, firstName: profile.firstName, email: profile.email }
      : null,
    topics: topics.map((t) => ({
      code: t.code,
      title: t.title,
      section: t.section,
      lessonId: t.lessonId,
      vocabCount: t.vocabCount,
      progress: progress[t.lessonId] ?? { flashcardsDone: false, mcqPassed: false, explainDone: false },
    })),
  })
}
```

- [ ] **Step 2: Smoke test**

```bash
pnpm dev
curl -s http://localhost:3100/api/topics | head -c 400
```

Expected: JSON with `signedIn: false`, `profile: null`, and 25 topic objects.

- [ ] **Step 3: Commit**

```bash
git add app/api/topics/route.ts
git commit -m "feat(api): GET /api/topics"
```

---

### Task 4.2: Landing page components — Hero, TopicCard, TopicGrid

The design's existing JSX (`Dino 2-design files/app-v2.jsx`) is the reference. Port its visual structure while swapping data sources (`window.TOPICS` → API) and adapting to server components where possible.

**Files:**
- Create: `components/Hero.tsx`
- Create: `components/TopicCard.tsx`
- Create: `components/TopicGrid.tsx`
- Create: `components/Icons.tsx` (SVG icon map + ICON_FOR mapping, verbatim from design)

- [ ] **Step 1: Create `components/Icons.tsx`** — copy the `Icons` object and `ICON_FOR` / `TINTS` / `tintFor` from `Dino 2-design files/app-v2.jsx` lines 18–86, exporting them:

```tsx
"use client"
import * as React from "react"

export const TINTS = ["mint", "peach", "sky", "lilac", "lemon", "coral", "teal"] as const
export type Tint = (typeof TINTS)[number]

export function tintFor(index: number): Tint {
  return TINTS[index % TINTS.length]
}

export const ICON_FOR: Record<string, string> = {
  "1.1": "leaf", "1.2": "star", "1.3": "bulb", "1.4": "book",
  "1.5": "bulb", "1.6": "tools", "1.7": "gear", "1.8": "book",
  "1.9": "star", "1.10": "leaf", "1.11": "tools", "1.12": "wave",
  "1.13": "gear", "1.14": "book", "1.15": "star", "1.16": "gear", "1.17": "chip",
  "5.1": "chip", "5.2": "wave", "5.3": "gear", "5.4": "chip",
  "5.5": "wave", "5.6": "tools", "5.7": "chip", "5.8": "tools",
}

export const Icons: Record<string, React.ReactNode> = {
  // Copy each SVG from Dino 2-design files/app-v2.jsx lines 20–72 verbatim
  // (bulb, gear, chip, tools, book, leaf, wave, star)
  // Each SVG is static JSX — paste each one inside a JSX fragment
}
```

Copy each SVG exactly from the design file into the object.

- [ ] **Step 2: Create `components/Hero.tsx`**

Port `Dino 2-design files/app-v2.jsx` lines 88–137. Make it a server component (no `"use client"`) since it's static data + props. Replace the hardcoded logo image with `next/image` or plain `<img src="/assets/salih-avatar.png" />`.

```tsx
import Image from "next/image"

type Props = {
  overall: number
  coreDone: number
  coreTotal: number
  sysDone: number
  sysTotal: number
  firstName?: string | null
}

export function Hero({ overall, coreDone, coreTotal, sysDone, sysTotal, firstName }: Props) {
  return (
    <div className="hero">
      <div className="hero-top">
        <div className="logo">
          <div className="logo-mark logo-mark-img">
            <Image src="/assets/salih-avatar.png" alt="" width={42} height={42} />
          </div>
          <span><em className="logo-accent">dt</em><b>.mr-salih.uk</b></span>
        </div>
        <div className="hero-spec">Edexcel iGCSE · D&amp;T Systems</div>
      </div>

      <div className="hero-body">
        <div className="hero-body-left">
          <h1>
            {firstName ? (
              <>Hey <em>{firstName}</em> — let's smash it.</>
            ) : (
              <>Let's smash <em>GCSE revision</em> — one topic at a time.</>
            )}
          </h1>
          <p className="hero-sub">
            Flip flashcards, crush quizzes, and practise exam answers across all 25 topics. Your progress saves automatically.
          </p>
          <div className="stats">
            <div className="stat stat-overall"><div className="stat-value">{overall}<span className="suf">%</span></div><div className="stat-label">Overall</div></div>
            <div className="stat stat-core"><div className="stat-value">{coreDone}<span className="suf">/{coreTotal}</span></div><div className="stat-label">Core done</div></div>
            <div className="stat stat-sys"><div className="stat-value">{sysDone}<span className="suf">/{sysTotal}</span></div><div className="stat-label">Systems done</div></div>
            <div className="stat"><div className="stat-value">25</div><div className="stat-label">Topics total</div></div>
          </div>
        </div>
        <div className="hero-body-right">
          <Image src="/assets/hero-pupils.png" alt="Two pupils with boxes of D&T topics" width={300} height={300} className="hero-illo" />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create `components/TopicCard.tsx`**

Port `Dino 2-design files/app-v2.jsx` lines 140–190. Client component (uses `onOpen`):

```tsx
"use client"
import Link from "next/link"
import { Icons, ICON_FOR, tintFor } from "@/components/Icons"

export type TopicCardProps = {
  code: string
  title: string
  section: "core" | "systems"
  vocabCount: number
  index: number
  pct: number
  done: boolean
}

export function TopicCard({ code, title, section, vocabCount, index, pct, done }: TopicCardProps) {
  const tint = tintFor(index)
  const iconKey = ICON_FOR[code] ?? "star"
  return (
    <article data-tint={tint} className={`card tint-${tint} ${done ? "card-done" : ""}`}>
      <div className="card-top">
        <div className="card-chiprow">
          <span className="card-code">{code}</span>
          {done && <div className="card-badge" title="Complete!">✓</div>}
        </div>
        <h3 className="card-title">{title}</h3>
        <div className="card-icon">{Icons[iconKey]}</div>
      </div>
      <div className="card-body">
        <div className="card-meta">
          <span>{vocabCount} key words</span>
          <span className="dot" />
          <span>3 ways to study</span>
        </div>
        <Link href={`/topic/${code}`} className="notes-row">
          <span className="notes-label">Open study notes →</span>
          <span className="progress-row inline">
            <span className="progress-track"><span className="progress-fill" style={{ width: pct + "%" }} /></span>
            <span className="progress-pct">{pct}%</span>
          </span>
        </Link>
        <div className="card-actions">
          <Link href={`/topic/${code}?mode=flashcards`} className="act"><span className="act-icon">🃏</span>Flashcards</Link>
          <Link href={`/topic/${code}?mode=quiz`} className="act"><span className="act-icon">✏️</span>Quiz</Link>
          {/* Explain link is rendered only for signed-in users in TopicGrid */}
        </div>
      </div>
    </article>
  )
}
```

- [ ] **Step 4: Create `components/TopicGrid.tsx`** (client component, fetches from `/api/topics`, handles search + filters, merges anon local progress)

```tsx
"use client"
import * as React from "react"
import { TopicCard } from "@/components/TopicCard"
import { readLocalProgress, localTopicPercent } from "@/lib/progress-client"

type ApiTopic = {
  code: string
  title: string
  section: "core" | "systems"
  lessonId: string
  vocabCount: number
  progress: { flashcardsDone: boolean; mcqPassed: boolean; explainDone: boolean }
}

type Filter = "all" | "core" | "systems" | "todo"

export function TopicGrid({ initial }: {
  initial: { signedIn: boolean; profile: { firstName: string | null } | null; topics: ApiTopic[] }
}) {
  const [query, setQuery] = React.useState("")
  const [filter, setFilter] = React.useState<Filter>("all")
  const [localTick, setLocalTick] = React.useState(0)

  React.useEffect(() => {
    // Re-render when localStorage may have changed (after returning from a topic page)
    const handler = () => setLocalTick((n) => n + 1)
    window.addEventListener("focus", handler)
    window.addEventListener("storage", handler)
    return () => {
      window.removeEventListener("focus", handler)
      window.removeEventListener("storage", handler)
    }
  }, [])

  const local = initial.signedIn ? {} : readLocalProgress()

  function pctFor(t: ApiTopic) {
    if (initial.signedIn) {
      const { flashcardsDone, mcqPassed, explainDone } = t.progress
      return Math.round(([flashcardsDone, mcqPassed, explainDone].filter(Boolean).length / 3) * 100)
    }
    return localTopicPercent(local[t.code])
  }

  const filtered = initial.topics.filter((t) => {
    const q = query.trim().toLowerCase()
    if (filter === "core" && t.section !== "core") return false
    if (filter === "systems" && t.section !== "systems") return false
    if (filter === "todo" && pctFor(t) === 100) return false
    if (q && !t.title.toLowerCase().includes(q) && !t.code.toLowerCase().includes(q)) return false
    return true
  })

  const core = filtered.filter((t) => t.section === "core")
  const systems = filtered.filter((t) => t.section === "systems")
  const coreCount = initial.topics.filter((t) => t.section === "core").length
  const sysCount = initial.topics.filter((t) => t.section === "systems").length
  const coreDone = initial.topics.filter((t) => t.section === "core" && pctFor(t) === 100).length
  const sysDone = initial.topics.filter((t) => t.section === "systems" && pctFor(t) === 100).length

  // Expose a stable signature so Hero can be kept in sync if needed later
  void localTick

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
            <span className="section-count"><b>{coreDone}</b>/{coreCount} done</span>
          </div>
          <div className="grid">
            {core.map((t, i) => (
              <TopicCard key={t.lessonId} code={t.code} title={t.title} section="core" vocabCount={t.vocabCount} index={i} pct={pctFor(t)} done={pctFor(t) === 100} />
            ))}
          </div>
        </section>
      )}

      {systems.length > 0 && (
        <section>
          <div className="section-head">
            <span className="section-tag tag-sys">Systems</span>
            <h2>Your specialism — electronics &amp; PCBs</h2>
            <span className="section-count"><b>{sysDone}</b>/{sysCount} done</span>
          </div>
          <div className="grid">
            {systems.map((t, i) => (
              <TopicCard key={t.lessonId} code={t.code} title={t.title} section="systems" vocabCount={t.vocabCount} index={i + 3} pct={pctFor(t)} done={pctFor(t) === 100} />
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
```

- [ ] **Step 5: Replace `app/page.tsx`**

```tsx
import { Hero } from "@/components/Hero"
import { TopicGrid } from "@/components/TopicGrid"
import { listTopics } from "@/lib/content"
import { computeTopicProgress } from "@/lib/progress"
import { getAuthenticatedProfile } from "@/lib/auth"

export const dynamic = "force-dynamic"

export default async function HomePage() {
  const profile = await getAuthenticatedProfile()
  const topics = await listTopics()
  const progress = profile
    ? await computeTopicProgress({ pupilId: profile.userId, lessonIds: topics.map((t) => t.lessonId) })
    : {}

  const signedIn = Boolean(profile)
  const enriched = topics.map((t) => ({
    code: t.code,
    title: t.title,
    section: t.section,
    lessonId: t.lessonId,
    vocabCount: t.vocabCount,
    progress: progress[t.lessonId] ?? { flashcardsDone: false, mcqPassed: false, explainDone: false },
  }))

  // Hero stats need to be computed on the client for anon (localStorage) — but we
  // can ship sensible defaults for signed-in pupils.
  const coreTotal = enriched.filter((t) => t.section === "core").length
  const sysTotal = enriched.filter((t) => t.section === "systems").length
  const coreDone = signedIn
    ? enriched.filter((t) => t.section === "core" && t.progress.flashcardsDone && t.progress.mcqPassed && t.progress.explainDone).length
    : 0
  const sysDone = signedIn
    ? enriched.filter((t) => t.section === "systems" && t.progress.flashcardsDone && t.progress.mcqPassed && t.progress.explainDone).length
    : 0
  const overall = signedIn
    ? Math.round(
        (enriched.reduce((s, t) => s + ([t.progress.flashcardsDone, t.progress.mcqPassed, t.progress.explainDone].filter(Boolean).length / 3), 0) / enriched.length) * 100,
      )
    : 0

  return (
    <div className="page">
      <Hero overall={overall} coreDone={coreDone} coreTotal={coreTotal} sysDone={sysDone} sysTotal={sysTotal} firstName={profile?.firstName ?? null} />
      <TopicGrid initial={{ signedIn, profile: profile ? { firstName: profile.firstName } : null, topics: enriched }} />
      <footer className="foot">Progress saved right here in your browser <span className="heart">♥</span> No sign-in needed.</footer>
    </div>
  )
}
```

- [ ] **Step 6: Manual check**

```bash
pnpm dev
```

Open `http://localhost:3100`. Expected: landing page renders with Hero, search row, two section bands, 25 topic cards with correct codes/titles/colours matching the design screenshot visually.

- [ ] **Step 7: Commit**

```bash
git add components/ app/page.tsx
git commit -m "feat(home): topic grid landing page"
```

---

## Phase 5 — Flashcards

### Task 5.1: `POST /api/lessons/[id]/flashcards` — record a completed session

**Files:**
- Create: `app/api/lessons/[id]/flashcards/route.ts`

- [ ] **Step 1: Create route**

```ts
import { NextResponse } from "next/server"
import { z } from "zod"
import { query } from "@/lib/db"
import { getAuthenticatedProfile } from "@/lib/auth"

const Body = z.object({
  activityId: z.string().min(1),
  totalCards: z.number().int().min(1),
  correctCount: z.number().int().min(0),
})

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const profile = await getAuthenticatedProfile()
  if (!profile) {
    return NextResponse.json({ success: false, error: "Sign in required." }, { status: 401 })
  }

  const { id: lessonId } = await context.params
  const json = await request.json().catch(() => null)
  const parsed = Body.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid payload." }, { status: 400 })
  }

  // Confirm the activity belongs to this lesson and is the flashcard activity
  const { rows: actRows } = await query<{ lesson_id: string | null; type: string | null }>(
    `select lesson_id, type from activities where activity_id = $1`,
    [parsed.data.activityId],
  )
  const activity = actRows[0]
  if (!activity || activity.lesson_id !== lessonId || activity.type !== "flashcard") {
    return NextResponse.json({ success: false, error: "Activity not found for this lesson." }, { status: 404 })
  }

  await query(
    `insert into flashcard_sessions (pupil_id, activity_id, total_cards, correct_count, status, started_at, completed_at)
     values ($1, $2, $3, $4, 'completed', now(), now())`,
    [profile.userId, parsed.data.activityId, parsed.data.totalCards, parsed.data.correctCount],
  )

  return NextResponse.json({ success: true })
}
```

**Note on schema drift:** if `flashcard_sessions` in dino has required columns not set above (see Task 1.2 inspect output), add them. Planner-004's active code inserts `(pupil_id, activity_id, total_cards, do_activity_id)` and updates `status/correct_count/completed_at` in a follow-up query. Match that pattern if needed.

- [ ] **Step 2: Smoke test via curl (with an active dt_session cookie)**

```bash
curl -i -X POST http://localhost:3100/api/lessons/<lessonId>/flashcards \
  -H "content-type: application/json" \
  --cookie "dt_session=<...>" \
  -d '{"activityId":"<activityId>","totalCards":5,"correctCount":4}'
```

Expected: `200 {"success":true}`. Verify with:

```sql
select * from flashcard_sessions where pupil_id = '<userId>' order by completed_at desc limit 1;
```

- [ ] **Step 3: Commit**

```bash
git add app/api/lessons
git commit -m "feat(flashcards): record completed session"
```

---

### Task 5.2: `FlashcardsModal` component

**Files:**
- Create: `components/modals/FlashcardsModal.tsx`
- Create: `components/modals/Modal.tsx`

- [ ] **Step 1: Create `Modal.tsx`** — port `Modal` function from `Dino 2-design files/app-v2.jsx` lines 193–223 verbatim with TypeScript types. Client component.

- [ ] **Step 2: Create `FlashcardsModal.tsx`** — port `FlashcardsModal` from the design (lines 227–258). Replace `topic.flashcards` with activity `bodyData` (pass cards + activityId + lessonId as props). On "Next →" of the final card, `POST` to `/api/lessons/[lessonId]/flashcards` if signed in, otherwise call `writeLocalFlashcardsDone(code, true)`.

```tsx
"use client"
import * as React from "react"
import { Modal } from "@/components/modals/Modal"
import { writeLocalFlashcardsDone } from "@/lib/progress-client"

export type Card = { term: string; def: string }

export function FlashcardsModal({
  topicCode, topicTitle, lessonId, activityId, cards, tint, signedIn, onClose,
}: {
  topicCode: string
  topicTitle: string
  lessonId: string
  activityId: string
  cards: Card[]
  tint: string
  signedIn: boolean
  onClose: () => void
}) {
  const [i, setI] = React.useState(0)
  const [flipped, setFlipped] = React.useState(false)
  const [done, setDone] = React.useState(false)

  if (!cards.length) {
    return <Modal topicCode={topicCode} tint={tint} onClose={onClose} title="Flashcards"><p>No flashcards yet.</p></Modal>
  }

  async function finish() {
    if (done) return
    setDone(true)
    if (signedIn) {
      await fetch(`/api/lessons/${lessonId}/flashcards`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ activityId, totalCards: cards.length, correctCount: cards.length }),
      }).catch(() => {})
    } else {
      writeLocalFlashcardsDone(topicCode, true)
    }
  }

  const card = cards[i]
  const prev = () => { setFlipped(false); setI((i - 1 + cards.length) % cards.length) }
  const next = () => {
    setFlipped(false)
    if (i + 1 >= cards.length) { void finish(); return }
    setI(i + 1)
  }

  return (
    <Modal topicCode={topicCode} tint={tint} onClose={onClose} title={`Flashcards · ${topicTitle}`}
      footer={<>
        <span className="modal-progress"><b>{i + 1}</b> of {cards.length}</span>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" onClick={prev}>← Prev</button>
          <button className="btn primary" onClick={next}>{i + 1 >= cards.length ? "Finish" : "Next →"}</button>
        </div>
      </>}>
      <div className={`flashcard ${flipped ? "flipped" : ""}`} onClick={() => setFlipped((f) => !f)}>
        <div className="flashcard-inner">
          <div className="flashcard-face front"><div className="flashcard-term">{card.term}</div><div className="flashcard-hint">Click to flip</div></div>
          <div className="flashcard-face back"><div className="flashcard-def">{card.def}</div><div className="flashcard-hint">Click to flip back</div></div>
        </div>
      </div>
    </Modal>
  )
}
```

- [ ] **Step 3: Manual test via Topic page wiring** — deferred to Task 7.3 where we launch the modal from the topic page.

- [ ] **Step 4: Commit**

```bash
git add components/modals
git commit -m "feat(flashcards): FlashcardsModal component"
```

---

## Phase 6 — Quiz

### Task 6.1: `POST /api/activities/[id]/submissions` — MCQ path

**Files:**
- Create: `app/api/activities/[id]/submissions/route.ts`
- Create: `lib/submissions.ts`

- [ ] **Step 1: Create `lib/submissions.ts`**

```ts
import { query } from "@/lib/db"

/**
 * Insert a new submission. Overwrite semantics are achieved by reading the latest
 * submission at query time (ordered by submitted_at desc). Mirrors planner-004.
 */
export async function insertSubmission(params: {
  activityId: string
  userId: string
  body: Record<string, unknown>
}): Promise<string> {
  const { rows } = await query<{ submission_id: string }>(
    `insert into submissions (activity_id, user_id, body, submitted_at)
     values ($1, $2, $3::jsonb, now())
     returning submission_id`,
    [params.activityId, params.userId, JSON.stringify(params.body)],
  )
  return rows[0].submission_id
}
```

- [ ] **Step 2: Create route**

```ts
import { NextResponse } from "next/server"
import { z } from "zod"
import { query } from "@/lib/db"
import { getAuthenticatedProfile } from "@/lib/auth"
import { insertSubmission } from "@/lib/submissions"

const Body = z.object({
  type: z.enum(["multiple-choice-question", "short-text-question"]),
  body: z.record(z.string(), z.unknown()),
})

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const profile = await getAuthenticatedProfile()
  if (!profile) {
    return NextResponse.json({ success: false, error: "Sign in required." }, { status: 401 })
  }

  const { id: activityId } = await context.params
  const json = await request.json().catch(() => null)
  const parsed = Body.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid payload." }, { status: 400 })
  }

  const { rows } = await query<{ type: string | null }>(
    `select type from activities where activity_id = $1`,
    [activityId],
  )
  if (!rows[0] || rows[0].type !== parsed.data.type) {
    return NextResponse.json({ success: false, error: "Activity type mismatch." }, { status: 400 })
  }

  const submissionId = await insertSubmission({
    activityId,
    userId: profile.userId,
    body: parsed.data.body,
  })

  return NextResponse.json({ success: true, submissionId })
}
```

Short-text enqueue is added in Task 8.4.

- [ ] **Step 3: Commit**

```bash
git add app/api/activities lib/submissions.ts
git commit -m "feat(submissions): POST /api/activities/[id]/submissions (MCQ)"
```

---

### Task 6.2: `QuizModal` component

**Files:**
- Create: `components/modals/QuizModal.tsx`

- [ ] **Step 1: Port from design** — `Dino 2-design files/app-v2.jsx` lines 261–324. Props take an array of MCQ activities (each with activityId + question + opts + answer + why). On each answer, the modal scores client-side (per the design) and at finish:
  - Signed-in: POST `/api/activities/[mcqActivityId]/submissions` **once per answered question**, body shape `{ type: "multiple-choice-question", body: { picked_index, is_correct, score } }` — matches planner-004's `compute_submission_base_score` which reads `is_correct` first.
  - Anonymous: `writeLocalMcqScore(topicCode, pct/100)`.

Pseudocode for the finish handler:

```tsx
async function finish() {
  const finalScore = score / qs.length
  if (signedIn) {
    await Promise.all(
      qs.map((q, idx) => {
        const pickedIdx = picks[idx]
        const isCorrect = pickedIdx === q.answer
        return fetch(`/api/activities/${q.activityId}/submissions`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            type: "multiple-choice-question",
            body: { picked_index: pickedIdx, is_correct: isCorrect, score: isCorrect ? 1 : 0 },
          }),
        }).catch(() => null)
      }),
    )
  } else {
    writeLocalMcqScore(topicCode, finalScore)
  }
  setFinished(true)
}
```

(Track `picks: number[]` alongside `score: number` during the quiz.)

- [ ] **Step 2: Commit**

```bash
git add components/modals/QuizModal.tsx
git commit -m "feat(quiz): QuizModal with submission writes"
```

---

## Phase 7 — Study notes reader

### Task 7.1: `/topic/[code]` page shell

**Files:**
- Create: `app/topic/[code]/page.tsx`
- Create: `components/notes/StudyNotes.tsx`
- Create: `components/notes/NotesBlock.tsx`
- Create: `components/notes/Keyword.tsx`
- Create: `components/notes/InlineMCQ.tsx`

- [ ] **Step 1: Create `app/topic/[code]/page.tsx`**

```tsx
import { getTopicByCode } from "@/lib/content"
import { getAuthenticatedProfile } from "@/lib/auth"
import { StudyNotes } from "@/components/notes/StudyNotes"
import { notFound } from "next/navigation"
import { tintFor } from "@/components/Icons"

export const dynamic = "force-dynamic"

export default async function TopicPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const topic = await getTopicByCode(code)
  if (!topic) notFound()
  const profile = await getAuthenticatedProfile()

  const index = parseInt(code.split(".")[1] ?? "0", 10) - 1
  const offset = topic.section === "systems" ? 3 : 0
  const tint = tintFor((isNaN(index) ? 0 : index) + offset)

  return (
    <StudyNotes
      topic={{
        code: topic.code,
        title: topic.title,
        section: topic.section,
        lessonId: topic.lessonId,
      }}
      activities={topic.activities}
      tint={tint}
      signedIn={Boolean(profile)}
    />
  )
}
```

- [ ] **Step 2: Create `components/notes/StudyNotes.tsx`**

Port `Dino 2-design files/app-v2.jsx` lines 519–616. Adapt:

- Data comes from props (`activities` list) rather than `topic.sections`.
- Split the activity list into **sections**: each `display-text` starts a new section whose `body` contains inline MCQ / short-text blocks that follow it until the next display-text.
- For the sticky TOC, one entry per display-text activity (use its `title`).
- Flashcards/Quiz/Explain launch buttons at the bottom navigate to `/topic/[code]?mode=...` or open a modal state in a parent wrapper.

Grouping helper:

```ts
import type { Activity } from "@/lib/content"

export type NotesSection = {
  id: string
  title: string
  displayActivity: Activity
  inlineBlocks: Activity[]
}

export function groupActivitiesIntoSections(activities: Activity[]): NotesSection[] {
  const sections: NotesSection[] = []
  let current: NotesSection | null = null
  for (const a of activities) {
    if (a.type === "display-text") {
      current = { id: a.activityId, title: a.title ?? "Section", displayActivity: a, inlineBlocks: [] }
      sections.push(current)
    } else if (a.type === "multiple-choice-question" || a.type === "short-text-question") {
      if (current) current.inlineBlocks.push(a)
    }
    // flashcard activities are not inlined into sections — they're the "Flashcards" button source
  }
  return sections
}
```

- [ ] **Step 3: Create `NotesBlock.tsx`, `Keyword.tsx`, `InlineMCQ.tsx`**

Port the three components from `Dino 2-design files/app-v2.jsx` lines 387–440. For `InlineMCQ`, props carry the activity's `bodyData` shape; scores aren't persisted (the topic-level Quiz button handles progress). For `Keyword`, source term/def comes from the `key_ideas` table only if you still want keyword chips in notes — **defer this** (not in display-text activities per user clarification).

- [ ] **Step 4: Manual visual check** — `/topic/5.4` should render a scrollable study-notes page with TOC on the left, sections on the right, and a CTA footer.

- [ ] **Step 5: Commit**

```bash
git add app/topic components/notes
git commit -m "feat(notes): study notes reader page"
```

---

### Task 7.2: Launch Flashcards / Quiz / Explain from topic page

**Files:**
- Modify: `app/topic/[code]/page.tsx`
- Create: `components/notes/TopicLauncher.tsx` (client component that holds modal state and launches the right modal)

- [ ] **Step 1: Create `TopicLauncher.tsx`** — holds `mode: "none" | "flashcards" | "quiz" | "explain"` state, reads initial `mode` from `searchParams`, renders the three modals conditionally, receives activity list as a prop.

- [ ] **Step 2: Thread `TopicLauncher` into `StudyNotes`'s bottom CTA** — its three buttons call `setMode("flashcards" | "quiz" | "explain")`.

- [ ] **Step 3: Conditionally hide Explain** — if `!signedIn`, don't render the Explain button at all (matches spec §9).

- [ ] **Step 4: Manual check** — open `/topic/1.5`, click "Flashcards", verify the modal opens with the right term/def cards. Click "Quiz", same. Explain button only appears when signed in.

- [ ] **Step 5: Commit**

```bash
git add components/notes/TopicLauncher.tsx app/topic
git commit -m "feat(notes): launch study modes from topic page"
```

---

## Phase 8 — Explain mode (signed-in only)

### Task 8.1: `lib/ai-marking.ts` — enqueue short-text for marking

**Files:**
- Create: `lib/ai-marking.ts`

- [ ] **Step 1: Implement**

```ts
import { query } from "@/lib/db"

/**
 * Enqueue a submission onto ai_marking_queue for n8n to process.
 * Matches planner-004's enqueue shape (see src/lib/ai/marking-queue.ts).
 *
 * Note: planner-004's queue requires an `assignment_id`. For revision-site
 * submissions there is no assignment context; we use a constant sentinel
 * 'revision:<lessonId>' that the n8n flow must accept. Confirm this during
 * Task 1.2 inspection — if assignment_id is FK-constrained, we'll need to
 * provide a real assignment or change the enqueue strategy.
 */
export async function enqueueShortTextMarking(params: {
  submissionId: string
  assignmentSentinel: string
}) {
  await query(
    `insert into ai_marking_queue (submission_id, assignment_id, status)
     values ($1, $2, 'pending')
     on conflict (submission_id) where status in ('pending','processing') do nothing`,
    [params.submissionId, params.assignmentSentinel],
  )
}
```

**Blocker check:** before using this, confirm via Task 1.2 inspection whether `ai_marking_queue.assignment_id` is FK-constrained to `assignments(...)`. If it is, you must join through an existing assignment (pupil's group × unit) rather than inventing a sentinel. Update the enqueue call accordingly.

- [ ] **Step 2: Commit**

```bash
git add lib/ai-marking.ts
git commit -m "feat(ai): enqueue short-text submissions for marking"
```

---

### Task 8.2: Wire short-text enqueue into submissions route

**Files:**
- Modify: `app/api/activities/[id]/submissions/route.ts`

- [ ] **Step 1: Extend route** — after `insertSubmission` returns, if `type === 'short-text-question'` call `enqueueShortTextMarking` with the new submission id.

```ts
if (parsed.data.type === "short-text-question") {
  // Find the pupil's assignment for this lesson's unit, if any
  const { rows: asnRows } = await query<{ assignment_id: string | null }>(
    `
      select a.unit_id || ':' || a.group_id as assignment_id
      from assignments a
      join lessons l on l.unit_id = a.unit_id
      join group_membership gm on gm.group_id = a.group_id and gm.user_id = $2
      where l.lesson_id = (select lesson_id from activities where activity_id = $1)
      limit 1
    `,
    [activityId, profile.userId],
  )
  const sentinel = asnRows[0]?.assignment_id ?? `revision:${activityId}`
  await enqueueShortTextMarking({ submissionId, assignmentSentinel: sentinel })
}
```

(Replace sentinel strategy if Task 1.2 showed `assignment_id` is FK-constrained.)

- [ ] **Step 2: Commit**

```bash
git add app/api/activities
git commit -m "feat(explain): enqueue short-text answers for AI marking"
```

---

### Task 8.3: `GET /api/activities/[id]/feedback`

**Files:**
- Create: `app/api/activities/[id]/feedback/route.ts`

- [ ] **Step 1: Implement**

```ts
import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getAuthenticatedProfile } from "@/lib/auth"

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const profile = await getAuthenticatedProfile()
  if (!profile) {
    return NextResponse.json({ success: false, error: "Sign in required." }, { status: 401 })
  }
  const { id: activityId } = await context.params

  const { rows } = await query<{
    feedback_text: string | null
    score: number | null
    source: string
    created_at: string
  }>(
    `
      select feedback_text, score, source, created_at
      from pupil_activity_feedback
      where activity_id = $1 and pupil_id = $2
      order by
        case source when 'teacher' then 0 when 'ai' then 1 when 'auto' then 2 else 3 end,
        created_at desc
      limit 1
    `,
    [activityId, profile.userId],
  )

  const row = rows[0]
  if (!row) {
    return NextResponse.json({ status: "pending" })
  }
  return NextResponse.json({
    status: "ready",
    source: row.source,
    feedback: row.feedback_text,
    score: row.score,
  })
}
```

Teacher feedback wins over AI feedback via the `case` ordering above.

- [ ] **Step 2: Commit**

```bash
git add app/api/activities/[id]/feedback
git commit -m "feat(explain): GET feedback endpoint with teacher-wins ordering"
```

---

### Task 8.4: `ExplainModal` + `InlineExplain` components

**Files:**
- Create: `components/modals/ExplainModal.tsx`
- Create: `components/notes/InlineExplain.tsx`

- [ ] **Step 1: Port `ExplainModal`** from `Dino 2-design files/app-v2.jsx` lines 327–353. Replace the model-answer pattern with the submit-and-poll flow.

```tsx
"use client"
import * as React from "react"
import { Modal } from "@/components/modals/Modal"

export function ExplainModal({
  topicCode, topicTitle, tint, activities, onClose,
}: {
  topicCode: string
  topicTitle: string
  tint: string
  activities: { activityId: string; prompt: string; hint?: string }[]
  onClose: () => void
}) {
  const [idx, setIdx] = React.useState(0)
  if (activities.length === 0) {
    return <Modal topicCode={topicCode} tint={tint} onClose={onClose} title="Explain"><p>No explain prompts yet.</p></Modal>
  }
  const current = activities[idx]
  return (
    <Modal topicCode={topicCode} tint={tint} onClose={onClose} title={`Explain · ${topicTitle}`}
      footer={<>
        <span className="modal-progress"><b>{idx + 1}</b> of {activities.length}</span>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>← Prev</button>
          <button className="btn primary" disabled={idx === activities.length - 1} onClick={() => setIdx(idx + 1)}>Next →</button>
          {idx === activities.length - 1 && <button className="btn primary" onClick={onClose}>Done</button>}
        </div>
      </>}>
      <ExplainBlock key={current.activityId} activityId={current.activityId} prompt={current.prompt} hint={current.hint} />
    </Modal>
  )
}

function ExplainBlock({ activityId, prompt, hint }: { activityId: string; prompt: string; hint?: string }) {
  const [text, setText] = React.useState("")
  const [sending, setSending] = React.useState(false)
  const [feedback, setFeedback] = React.useState<null | { source: string; feedback: string | null; score: number | null }>(null)

  async function submit() {
    if (!text.trim() || sending) return
    setSending(true)
    setFeedback(null)
    const res = await fetch(`/api/activities/${activityId}/submissions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type: "short-text-question", body: { answer: text } }),
    })
    if (!res.ok) { setSending(false); return }
    // Poll for feedback up to ~30s
    const deadline = Date.now() + 30_000
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 2000))
      const poll = await fetch(`/api/activities/${activityId}/feedback`).then((r) => r.json())
      if (poll.status === "ready") { setFeedback(poll); break }
    }
    setSending(false)
  }

  return (
    <div>
      <div className="explain-prompt">{prompt}</div>
      {hint && <div className="inline-explain-hint">Hint: {hint}</div>}
      <textarea className="explain-input" placeholder="Write your answer here…" value={text} onChange={(e) => setText(e.target.value)} />
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
        <button className="btn primary" disabled={!text.trim() || sending} onClick={submit}>
          {sending ? "Checking…" : "Check my answer"}
        </button>
      </div>
      {feedback && feedback.feedback && (
        <div className="inline-explain-feedback">
          <div className="inline-explain-feedback-label">{feedback.source === "teacher" ? "Teacher feedback" : "Tutor feedback"}</div>
          <div className="inline-explain-feedback-text">{feedback.feedback}</div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create `InlineExplain.tsx`** for use inside Study Notes — same submit/poll logic but rendered inline. Only rendered when `signedIn=true`.

- [ ] **Step 3: Wire `ExplainModal` into `TopicLauncher`** — activities come from `topic.activities.filter((a) => a.type === "short-text-question")`, mapped into the props shape. `bodyData` is the source of `prompt` + `hint` (confirmed via Task 1.2).

- [ ] **Step 4: Smoke test** — sign in, open `/topic/5.4?mode=explain`, type an answer, click "Check my answer", verify "Checking…" spinner appears and feedback arrives.

- [ ] **Step 5: Commit**

```bash
git add components/modals/ExplainModal.tsx components/notes/InlineExplain.tsx
git commit -m "feat(explain): submit + poll AI feedback"
```

---

## Phase 9 — Auth UI & profile

### Task 9.1: `SignInPage` component (port design)

**Files:**
- Create: `app/sign-in/page.tsx`
- Create: `components/SignInForm.tsx`

- [ ] **Step 1: Port from design** — `Dino 2-design files/auth-v2.jsx` lines 55–161 is the visual reference. Replace the two-step form (name + avatar) with a single email + password form. Keep the overall layout (left decorative panel with mascot, right form card).

```tsx
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
    // Discard local progress on sign-in per spec §5
    try { localStorage.removeItem("dt_revision_progress_v1") } catch {}
    router.push("/")
    router.refresh()
  }

  return (
    <form onSubmit={submit} className="signin-card">
      <h2 className="signin-q">Sign in</h2>
      <p className="signin-q-sub">Use your school email and password.</p>
      <input className="signin-input" type="email" placeholder="you@school.org" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
      <input className="signin-input" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      {error && <div style={{ color: "var(--coral-deep)", fontWeight: 700, marginBottom: 10 }}>{error}</div>}
      <button className="btn primary btn-big" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
    </form>
  )
}
```

- [ ] **Step 2: `app/sign-in/page.tsx`** — server component, wraps `SignInForm` in the left/right layout from the design.

- [ ] **Step 3: Commit**

```bash
git add app/sign-in components/SignInForm.tsx
git commit -m "feat(auth): sign-in page"
```

---

### Task 9.2: `ProfilePage`

**Files:**
- Create: `app/profile/page.tsx`
- Create: `components/ProfilePage.tsx`

- [ ] **Step 1: Port** from `Dino 2-design files/auth-v2.jsx` lines 164–325. Data sources:
  - Name: `profiles.first_name` / `profiles.last_name`
  - Class code: single `groups.join_code` via `group_membership` (show "—" if multiple/zero groups)
  - Avatar emoji: still localStorage (cosmetic, not in dino)
  - Stats: recompute from `computeTopicProgress` + topic count

```tsx
// app/profile/page.tsx
import { getAuthenticatedProfile } from "@/lib/auth"
import { redirect } from "next/navigation"
import { query } from "@/lib/db"
import { listTopics } from "@/lib/content"
import { computeTopicProgress } from "@/lib/progress"
import { ProfilePage } from "@/components/ProfilePage"

export const dynamic = "force-dynamic"

export default async function Page() {
  const profile = await getAuthenticatedProfile()
  if (!profile) redirect("/sign-in")

  const { rows: groupRows } = await query<{ join_code: string | null }>(
    `select g.join_code from groups g join group_membership gm on gm.group_id = g.group_id
     where gm.user_id = $1 and coalesce(g.active, true) = true`,
    [profile.userId],
  )
  const classCode = groupRows.length === 1 ? groupRows[0].join_code : null

  const topics = await listTopics()
  const progress = await computeTopicProgress({ pupilId: profile.userId, lessonIds: topics.map((t) => t.lessonId) })

  const started = topics.filter((t) => {
    const p = progress[t.lessonId]
    return p && (p.flashcardsDone || p.mcqPassed || p.explainDone)
  }).length
  const mastered = topics.filter((t) => {
    const p = progress[t.lessonId]
    return p && p.flashcardsDone && p.mcqPassed && p.explainDone
  }).length
  const overall = Math.round(
    (topics.reduce((s, t) => {
      const p = progress[t.lessonId]
      if (!p) return s
      return s + ([p.flashcardsDone, p.mcqPassed, p.explainDone].filter(Boolean).length / 3)
    }, 0) / Math.max(topics.length, 1)) * 100,
  )

  return (
    <ProfilePage
      firstName={profile.firstName ?? ""}
      lastName={profile.lastName ?? ""}
      email={profile.email}
      classCode={classCode}
      stats={{ started, mastered, total: topics.length, overall, words: 0 }}
    />
  )
}
```

(`words` stat requires counting key_ideas / flashcard entries — leave as 0 in v1 for simplicity, noted in Deferred at the end.)

- [ ] **Step 2: Implement `components/ProfilePage.tsx`** — visual port of the design's ProfilePage, but with settings limited to: Sign out (calls `/api/auth/sign-out`), no Reset Progress (the user said signed-in pupils' progress lives in dino; the "discard local" applies to the localStorage flow).

- [ ] **Step 3: Commit**

```bash
git add app/profile components/ProfilePage.tsx
git commit -m "feat(profile): profile page with live stats"
```

---

### Task 9.3: `FloatingAuthButton`

**Files:**
- Create: `components/FloatingAuthButton.tsx`
- Modify: `app/layout.tsx` to render it

- [ ] **Step 1: Port** from `Dino 2-design files/auth-v2.jsx` lines 354–375. Fetch auth state from `/api/auth/me` (create a thin `GET` route that returns `getAuthenticatedProfile()` or `null`), link to `/sign-in` when anonymous and `/profile` when signed in.

- [ ] **Step 2: Add `GET /api/auth/me`**

```ts
// app/api/auth/me/route.ts
import { NextResponse } from "next/server"
import { getAuthenticatedProfile } from "@/lib/auth"

export async function GET() {
  const p = await getAuthenticatedProfile()
  return NextResponse.json(p ? { signedIn: true, firstName: p.firstName, email: p.email } : { signedIn: false })
}
```

- [ ] **Step 3: Mount FAB in `app/layout.tsx`** at the bottom of `<body>`.

- [ ] **Step 4: Manual check** — anon: FAB shows "Sign in". Signed-in: FAB shows name + avatar, clicking goes to `/profile`.

- [ ] **Step 5: Commit**

```bash
git add components/FloatingAuthButton.tsx app/api/auth/me app/layout.tsx
git commit -m "feat(auth): floating auth button"
```

---

## Phase 10 — Integration, polish, deploy

### Task 10.1: End-to-end smoke test (Playwright)

**Files:**
- Create: `playwright.config.ts`
- Create: `e2e/home.spec.ts`, `e2e/topic.spec.ts`, `e2e/sign-in.spec.ts`

- [ ] **Step 1: Playwright config**

```ts
import { defineConfig } from "@playwright/test"
export default defineConfig({
  testDir: "./e2e",
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  use: { baseURL: "http://localhost:3100" },
})
```

- [ ] **Step 2: `e2e/home.spec.ts`**

```ts
import { test, expect } from "@playwright/test"

test("landing page shows 25 topic cards", async ({ page }) => {
  await page.goto("/")
  await expect(page.locator(".card")).toHaveCount(25)
  await expect(page.locator("h1")).toContainText(/GCSE revision|smash it/i)
})

test("search narrows the grid", async ({ page }) => {
  await page.goto("/")
  await page.fill('input[placeholder^="Search"]', "microcontroll")
  await expect(page.locator(".card")).toHaveCount(1)
})
```

- [ ] **Step 3: `e2e/topic.spec.ts`**

```ts
import { test, expect } from "@playwright/test"

test("topic 5.4 renders the notes reader", async ({ page }) => {
  await page.goto("/topic/5.4")
  await expect(page.locator(".notes-hero-number")).toHaveText("5.4")
  await expect(page.locator(".notes-section")).not.toHaveCount(0)
})

test("explain button hidden for anonymous users", async ({ page }) => {
  await page.goto("/topic/5.4")
  await expect(page.getByRole("link", { name: /^Explain/i })).toHaveCount(0)
})
```

- [ ] **Step 4: `e2e/sign-in.spec.ts`** — exercises sign-in using a seeded test account (skip in CI until a test-seed is built; flagged in Deferred).

- [ ] **Step 5: Run**

```bash
pnpm test:e2e
```

Expected: home and topic specs pass. Sign-in spec skipped pending seed.

- [ ] **Step 6: Commit**

```bash
git add e2e playwright.config.ts
git commit -m "test: e2e smoke coverage for home and topic pages"
```

---

### Task 10.2: Deploy config for dev + prod

**Files:**
- Create: `Dockerfile`
- Create: `docker-compose.yml` (or pair with planner-004's existing compose)
- Create: `README.md` (deployment notes)

- [ ] **Step 1: Dockerfile** — mirror planner-004's multi-stage `node:20-alpine` Dockerfile, build with `pnpm build`, run `pnpm start`.

- [ ] **Step 2: README** — document:
  - Prod URL: `https://dt.mr-salih.uk`
  - Dev URL: `https://dt-dev.mr-salih.uk`
  - Required env vars (see `.env.example`)
  - `COOKIE_DOMAIN=.mr-salih.uk` in both prod and dev
  - How dt.mr-salih.uk relates to planner-004 (shared `dino` DB, independent deploys, no code imports)
  - Known limitation: session cookies are NOT shared with planner-004 (different parent domains, `.mr-salih.uk` vs `.mr-salih.org`) — pupils sign in separately on each app with the same credentials.

- [ ] **Step 3: Commit**

```bash
git add Dockerfile README.md docker-compose.yml
git commit -m "chore: deployment config"
```

---

## Deferred (explicitly out of scope for v1)

These are in the spec's "Out of scope" list (§10) or surfaced during plan writing. Do not implement in this pass:

- Dark mode toggle UI (CSS exists in styles-v2.css; no toggle wired)
- Avatar emoji picker for signed-in pupils (localStorage only in v1)
- Words-learned stat on profile page (returns 0 in v1)
- Per-card `flashcard_attempts` writes (only `flashcard_sessions` in v1)
- CSRF + throttling on sign-in (planner-004 has both; defer until pupils start using it at scale)
- PWA / offline support
- Session TTL sliding window refresh (cookies are 1h fixed in v1)
- Sign-up / password reset
- Migration of anonymous localStorage progress into dino on sign-in (discard per spec §5)
- Sign-in e2e test with a seeded test account

---

## Self-review notes

Checked against the spec (`docs/superpowers/specs/2026-04-23-dt-mr-salih-uk-design.md`):

- §1 (Purpose): covered by Phases 4–8.
- §2 (Deployment): Task 0.4 (env) + Task 10.2 (deploy config).
- §3 (Architecture): Phase 0 + Phase 1 + Phase 2.
- §4 (Data mapping): Tasks 1.3–1.5.
- §5 (Progress model): Tasks 3.1–3.2; signed-in flow in Task 4.1; anon flow in Tasks 5.2, 6.2.
- §6 (Auth): Tasks 2.1–2.3, 9.1–9.3.
- §7 (Routes): listed API routes created across Tasks 2.2, 2.3, 4.1, 5.1, 6.1, 8.2, 8.3, 9.3.
- §8 (Explain + AI): Tasks 8.1–8.4.
- §9 (Visual fidelity): Task 0.3 + component ports in Phases 4, 5, 6, 7, 9.
- §10 (Out of scope): enumerated in "Deferred" above.
- §11 (Open items): Task 1.2 is explicitly the resolution step; later tasks reference it when they depend on the findings.
- §12 (Risks): flagged in `README.md` (Task 10.2) for the cookie-domain risk; the dino-shape risk is mitigated by Task 1.2 and the integration tests.

One spec gap noted and flagged in the plan: the spec's cookie-domain assumption (`.mr-salih.uk` shared with "future planner apps") works fine for single-sign-on **within** the revision site but does not grant SSO with planner-004, which is on `.mr-salih.org`. Pupils sign in to both apps separately. This is documented in Task 10.2's README and is an acceptable v1 behaviour per the "same credentials" decision in brainstorming.
