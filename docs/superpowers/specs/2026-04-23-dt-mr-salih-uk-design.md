# dt.mr-salih.uk — Design Spec

**Date:** 2026-04-23
**Design source:** `Dino 2-design files/` (handoff from Claude Design)
**Shared infrastructure:** `dino` PostgreSQL database (also used by planner-004)

## 1. Purpose

A pupil-facing revision site for Edexcel iGCSE D&T Systems, covering the 25 KS4 topics (1.1–1.17 Core + 5.1–5.8 Systems). Pupils can:

- Read rich study notes per topic
- Run a flashcards mode over key terms
- Take a multiple-choice quiz
- Write short-text "explain" answers that receive AI feedback

The site is powered by the existing `dino` database, which already hosts the KS4 D&T curriculum authored through planner-004. dt.mr-salih.uk is a **read-mostly consumer** of that content plus a **writer of pupil progress** (flashcard sessions, submissions). **No schema changes to dino.**

## 2. Deployment

- **Prod:** `dt.mr-salih.uk`
- **Dev:** `dt-dev.mr-salih.uk`
- Cookie domain: `.mr-salih.uk` (or shared parent with planner apps) so auth sessions are portable.

## 3. Architecture

Standalone **Next.js 16 App Router** project at `/Users/leroysalih/nodejs/dt.mr-salih.uk/`, replacing the existing CDN/Babel prototype. Stack matches planner-004:

- TypeScript, React 19
- `pg` connection pool (helper copied from `planner-004/src/lib/db.ts`, not imported)
- Same `DATABASE_URL` env var
- Same `OPEN_AI_KEY`, `N8N_MARKING_WEBHOOK_URL`, `AI_MARK_WEBHOOK_URL` env vars

**No code imports between dt.mr-salih.uk and planner-004.** Coupling is limited to (a) the shared database and (b) a stable env-var contract.

### Module boundaries

```
src/
  app/                       # Next.js App Router
    (home)/page.tsx          # topic grid (landing)
    topic/[code]/page.tsx    # study-notes reader
    sign-in/page.tsx         # email + password form
    profile/page.tsx         # profile, stats, settings
    api/
      auth/sign-in/route.ts
      auth/sign-out/route.ts
      topics/route.ts                        # list + per-pupil progress
      topics/[code]/route.ts                 # full topic w/ ordered activities
      lessons/[id]/flashcards/route.ts       # open/close flashcard_session
      activities/[id]/submissions/route.ts   # write MCQ or short-text answer
      activities/[id]/feedback/route.ts      # poll AI/teacher feedback
  lib/
    db.ts                    # pg pool (copied from planner-004)
    auth.ts                  # session validation against auth_sessions
    content.ts               # load + shape dino rows into UI topic model
    progress.ts              # compute topic % per pupil
    progress-client.ts       # client-side adapter (signed-in → API, anon → localStorage)
    ai-marking.ts            # enqueue short-text for marking (matches planner-004)
  components/
    Hero.tsx
    TopicCard.tsx
    TopicGrid.tsx
    FloatingAuthButton.tsx
    SignInPage.tsx
    ProfilePage.tsx
    modals/
      FlashcardsModal.tsx
      QuizModal.tsx
      ExplainModal.tsx
    notes/
      StudyNotes.tsx
      NotesBlock.tsx
      InlineMCQ.tsx
      InlineExplain.tsx
      Keyword.tsx
      diagrams/SignalsDiagram.tsx
      diagrams/IODiagram.tsx
  styles/
    styles-v2.css            # ported verbatim from design
```

Design's existing CSS (`styles-v2.css`) and JSX structure (`app-v2.jsx`, `auth-v2.jsx`) port 1:1 into the components tree. Visual output must match the prototype pixel-for-pixel; internal structure is free to change.

## 4. Data mapping (dino → UI)

| UI concept | Dino source |
|---|---|
| **Core section band** | Lessons belonging to units named `Core 1`, `Core 2`, `Core 3` (`units.title`) |
| **Systems section band** | Lessons belonging to unit named `Systems` (`units.title`) |
| **Topic** (e.g. `1.5`) | One `lessons` row under one of the above units |
| **Topic code** | Prefix of `lessons.title` (e.g. `"1.5 Design strategies and iterative design"` → code `1.5`, display title `"Design strategies and iterative design"`). Parser strips the leading code token and whitespace. |
| **Study-notes sections** | `activities` with `type = 'display-text'`, ordered by `activities.order_index` (or equivalent ordering column) within the lesson. `title` → section heading; `body_data` → body. |
| **Inline MCQ in notes** | `activities.type = 'multiple-choice-question'` appearing between display-text activities in the lesson's ordered list |
| **Inline Explain in notes** | `activities.type = 'short-text-question'` appearing between display-text activities in the lesson's ordered list |
| **Flashcards (button)** | The lesson's single `activities.type = 'flashcard'` row. `body_data` holds the term/def array. |
| **Quiz (button)** | All MCQ activities in the lesson, played sequentially |
| **Explain (button)** | All short-text activities in the lesson, played sequentially |
| **Topic title** | Parsed from `lessons.title` |
| **`vocabCount`** in design | Count of term/def entries in the lesson's flashcard activity `body_data` |

**Only these four units and their lessons are displayed.** All other curricula in dino are ignored by this site.

## 5. Progress model

### Anonymous pupils

Progress lives in `localStorage` under a single key, keyed by topic code. Shape:

```ts
{
  [topicCode: string]: {
    flashcardsDone?: boolean
    mcqBestScore?: number   // 0..1
  }
}
```

Topic % = average of two booleans (`flashcardsDone`, `mcqBestScore ≥ 0.8`) × 100, rounded. Each box is worth 50%.

Explain mode is **not shown** to anonymous pupils.

### Signed-in pupils

Progress is read from dino. Three booleans contribute ⅓ each:

- `flashcardsDone` — at least one `flashcard_sessions` row where `pupil_id = :pupil`, `lesson_id = :lesson`, `status = 'completed'`
- `mcqPassed` — mean score across all submissions for the lesson's MCQ activities ≥ 0.8. Score per submission comes from `compute_submission_base_score(body, 'multiple-choice-question')` (existing dino function).
- `explainDone` — **every** short-text activity in the lesson has both (a) a `submissions` row for this pupil, and (b) a `pupil_activity_feedback` row with `source ∈ ('auto','ai','teacher')`. Teacher overrides apply automatically.

### Writes

All writes are to existing tables:

- Flashcards: open a `flashcard_sessions` row on mode start; update `correct_count` / `total_cards` / `completed_at` / `status` on close. `flashcard_attempts` is not written in v1 (deferred).
- MCQ / Explain answers: upsert into `submissions` keyed by `(activity_id, user_id)` — overwrite prior submission (matches the "scores overwrite" requirement).
- Explain answers additionally enqueue onto `ai_marking_queue`, which planner-004's n8n webhook drains; feedback arrives in `pupil_activity_feedback` with `source = 'ai'`.

### Local → signed-in transition

On successful sign-in, **discard** localStorage progress. Pupil is told via a one-line notice that local progress is local-only.

## 6. Authentication

Pupils sign in with the same credentials they use in planner-004:

- `POST /api/auth/sign-in` — accepts `{ email, password }`, looks up `profiles` row by email, bcrypt-compares against `password_hash`, writes `auth_sessions` row, sets HTTP-only cookie (`Secure`, `SameSite=Lax`, domain `.mr-salih.uk`).
- `POST /api/auth/sign-out` — deletes the session row, clears cookie.
- Session validation — every server request resolves the cookie to a `pupil_id` by looking up `auth_sessions` (and checking `expires_at`).

No sign-up, no password reset, no email verification on this site. Account provisioning stays in planner-004.

## 7. Routes

### Pages

- `/` — hero + topic grid, split into Core and Systems bands, search box, filter chips (All / Core / Systems / To do). Server-renders topic list with progress; client-hydrates interactive pieces.
- `/topic/[code]` — full-screen study-notes reader. Sticky TOC (one entry per display-text section), mark-as-read per section, CTA footer to launch flashcards / quiz / explain.
- `/sign-in` — email + password form.
- `/profile` — name, avatar, class code, computed stats, settings (sign out, discard local progress). Signed-in only; anonymous users redirected to `/sign-in`.

### API

| Method + path | Purpose | Auth |
|---|---|---|
| `POST /api/auth/sign-in` | Sign in, issue cookie | public |
| `POST /api/auth/sign-out` | Sign out | required |
| `GET /api/topics` | 25 topics with per-pupil progress flags | optional (returns anon shape if no session) |
| `GET /api/topics/[code]` | Full topic with ordered activities | optional |
| `POST /api/lessons/[id]/flashcards` | Open + close flashcard session (one request per completed run) | required |
| `POST /api/activities/[id]/submissions` | Submit answer (MCQ or short-text) | required (anonymous pupils never hit this endpoint — their MCQ scores stay in localStorage) |
| `GET /api/activities/[id]/feedback` | Poll marking feedback | required |

## 8. Explain + AI flow

1. Pupil types answer in the Explain modal (or inline Explain block inside study notes), clicks "Check my answer".
2. Client `POST`s to `/api/activities/[id]/submissions` with `{ answer }`.
3. Server upserts the `submissions` row, then enqueues onto `ai_marking_queue` using the same enqueue logic planner-004 uses for short-text questions.
4. n8n webhook processes the queue and writes a `pupil_activity_feedback` row with `source = 'ai'` and the feedback text.
5. Client polls `GET /api/activities/[id]/feedback` every ~2s (max 30s). First hit with a feedback row returns the text; UI renders it.
6. Teacher overrides made in planner-004 produce a `source = 'teacher'` row. Subsequent polls (or a re-open of the topic) show the teacher's feedback instead of the AI's.

## 9. Visual fidelity

The design's existing `styles-v2.css` ships verbatim. Components must render pixel-perfectly against the prototype. No redesign in this phase.

Assets in `Dino 2-design files/assets/` (`salih-avatar.png`, `hero-pupils.png`) copy into `public/`.

## 10. Out of scope

- Dark mode (CSS is already present in the design, but the toggle UI and persistence are deferred)
- Streaks, XP, badges beyond the static level badge on the profile page
- Teacher-side views (live in planner-004)
- Sign-up / password reset / email verification
- Any schema changes to dino
- Seeder for KS4 content (authored directly through planner-004)
- Migration of anonymous localStorage progress into dino on sign-in (explicitly discarded)
- Offline support / PWA

## 11. Open items to resolve during implementation

These are non-blocking but need answers before the first read path can be wired up. Resolve by inspecting the dino database directly or by checking how planner-004 writes this content today:

1. **Activity ordering column** — confirm the column name on `activities` that orders activities within a lesson (likely `order_index` or similar).
2. **Flashcard activity `body_data` shape** — confirm the JSON shape planner-004 uses for the flashcard activity type (expected: `{ cards: [{ term, def }, ...] }` or similar).
3. **Display-text activity `body_data` shape** — confirm how body paragraphs are stored (likely markdown string or HTML blob).
4. **Enqueue path for `ai_marking_queue`** — copy planner-004's existing enqueue logic verbatim rather than reimplementing; confirm the exact SQL / n8n payload shape.
5. **Lesson → units filter** — confirm the exact unit titles (`Core 1`, `Core 2`, `Core 3`, `Systems`) match what's in dino. A small SQL sanity check at build/deploy time is worth adding.

## 12. Risks

- **Tight coupling to planner-004's authoring conventions.** If planner-004 changes its activity-type names or body_data shapes, this site breaks. Mitigation: a small set of integration tests that query dino with the expected shapes and fail loudly if they change.
- **AI feedback latency.** n8n queue depth could push feedback well beyond 30s. Mitigation: the poll endpoint returns a "still marking" status after 30s and the UI reverts to a "we'll email you when it's ready" state — out of scope for v1 but worth flagging.
- **Session cookie domain.** If planner-004 and this site aren't deployed under the same parent domain, single-sign-on won't work. Mitigation: confirm domain plan before implementation; fall back to separate sessions if necessary.
