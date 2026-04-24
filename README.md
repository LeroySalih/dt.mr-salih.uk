# dt.mr-salih.uk

Pupil revision site for Edexcel iGCSE D&T Systems, powered by the shared `dino` PostgreSQL database (also used by [planner-004](../planner-004)).

- **Prod:** `https://dt.mr-salih.uk`
- **Dev:** `https://dt-dev.mr-salih.uk`
- **Local:** `http://localhost:3100`

## Overview

- Standalone Next.js 16 App Router app. TypeScript, React 19.
- Reads curriculum content (units → lessons → activities) from dino.
- Writes pupil progress to dino: `flashcard_sessions`, `flashcard_attempts`, `submissions`, `ai_marking_queue`.
- Anonymous pupils see flashcards + quiz only, with progress stored in localStorage.
- Signed-in pupils see flashcards + quiz + explain, with progress persisted to dino.
- Explain answers feed the shared n8n AI marking pipeline; feedback comes back via `pupil_activity_feedback`.

## Relationship to planner-004

- Same `dino` database (no schema changes made by this app).
- **No code imports** between the two apps. Files like `lib/db.ts`, `lib/auth.ts`, and the flashcards helpers were copy-adapted from planner-004.
- **No session sharing.** planner-004 uses the `planner_session` cookie on `.mr-salih.org`; this app uses `dt_session` on `.mr-salih.uk`. Pupils sign into each app separately with the same email/password.

## Setup

```bash
pnpm install
cp .env.example .env.local
# Fill in DATABASE_URL etc.
pnpm dev       # http://localhost:3100
pnpm test      # vitest unit + integration
pnpm test:e2e  # playwright smoke tests
pnpm build     # production build
```

## Environment

See `.env.example`. Key vars:

- `DATABASE_URL` — Postgres connection to the shared `dino` database.
- `CORE_UNIT_IDS` — comma-separated `units.unit_id` values shown in the Core band.
- `SYSTEMS_UNIT_IDS` — comma-separated `units.unit_id` values shown in the Systems band.
- `COOKIE_DOMAIN` — cookie domain for the `dt_session` cookie. Leave empty in dev; set to `.mr-salih.uk` in prod and dev deploys.
- `OPEN_AI_KEY`, `N8N_MARKING_WEBHOOK_URL`, `MARKING_QUEUE_SECRET` — for the AI marking pipeline (currently consumed by planner-004's queue processor, which we share).

## Content conventions

A **topic** is a `lessons` row under one of the configured unit_ids whose title does NOT match `/assessment/i`. The topic code is parsed from the lesson title prefix (`1.1.1 Technology Impact` → code `1.1.1`). Content within a topic comes from its `activities` rows:

| UI | Activity type(s) |
|---|---|
| Study notes section | `text` (HTML), `display-key-terms` (markdown) |
| Inline media | `display-image`, `show-video` |
| Quiz question | `multiple-choice-question` (body: `{ question, options[], correctOptionId }`) |
| Explain prompt (signed-in only) | `short-text-question` (body: `{ question, modelAnswer }`) |
| Flashcards (the button) | `do-flashcards` → `display-flashcards` (body: `{ lines }` with `**bold**` answers) |

For full details see `docs/superpowers/specs/2026-04-23-dt-mr-salih-uk-design.md` and `docs/superpowers/notes/dino-content-shapes.md`.

## Deployment

The `Dockerfile` produces a self-contained production image (Node 20 alpine, multi-stage build). The container binds port 3100.

Required runtime env:

- `DATABASE_URL`
- `CORE_UNIT_IDS`, `SYSTEMS_UNIT_IDS`
- `COOKIE_DOMAIN=.mr-salih.uk`
- `OPEN_AI_KEY`, `N8N_MARKING_WEBHOOK_URL`, `MARKING_QUEUE_SECRET`
- `NODE_ENV=production`

## Tests

- **Unit + integration:** `pnpm test` (Vitest). Integration tests hit the live `dino` database via `DATABASE_URL` in `.env.local`.
- **E2E:** `pnpm test:e2e` (Playwright, Chromium). Starts the dev server if needed; reuses an existing one on 3100.

## Known limitations (v1)

See `docs/superpowers/plans/2026-04-23-dt-mr-salih-uk.md` — "Deferred" section. Highlights:

- No dark-mode toggle UI (CSS vars exist).
- Profile avatar is a static 🦕 emoji.
- `display-image.body_data.fileUrl` with bare filenames (no `http://`) render as a placeholder caption — resolution against a CDN is TODO.
- No anonymous → signed-in progress migration; local progress is discarded on sign-in (by design).
- No sign-up / password reset (accounts are provisioned through planner-004).
# dt.mr-salih.uk
