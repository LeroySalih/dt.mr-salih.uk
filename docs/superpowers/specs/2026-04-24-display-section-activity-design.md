# Display-Section Activity — Design Spec

_Date: 2026-04-24_

## Overview

Add support for a new `display-section` activity type. When present in a lesson, it acts as a named divider: all activities that follow it are rendered inside a white, bordered panel until the next `display-section` is encountered. The panel header is built from the activity's calculated index, title, and description.

---

## Context

Activities are fetched from the `activities` DB table for a given lesson and rendered via `StudyNotes.tsx`. Currently, `groupIntoSections()` groups them into `NotesSection[]` — a flat list of text/media/generic sections. There is no concept of a higher-level named grouping within a topic.

The DB already stores `display-section` activities. This change wires them into the rendering layer.

---

## Data Shape

### DB columns (existing schema)

| column     | value for display-section |
|------------|--------------------------|
| `title`    | e.g. `"Starter"` |
| `type`     | `"display-section"` |
| `body_data`| `{ "description": "Do now activities" }` |

### New type in `lib/content.ts`

```ts
type DisplaySectionBody = { description?: string }
```

---

## Architecture

### Two-level rendering model

```
Activity[] (raw, ordered)
    │
    ▼
groupIntoPanels()
    │
    ▼
ActivityPanel[]
  ├── { type: "ungrouped",        sections: NotesSection[] }
  └── { type: "display-section",  index, title, description, activityId, sections: NotesSection[] }
         │
         └── groupIntoSections() runs on inner activities per panel
```

`groupIntoSections()` is unchanged. It runs once per panel on that panel's inner (non-`display-section`) activities.

---

## Type Definitions

### `ActivityPanel` (new, exported from `StudyNotes.tsx`)

```ts
export type ActivityPanel =
  | { type: "ungrouped"; sections: NotesSection[] }
  | {
      type: "display-section"
      index: number        // 1-based, increments per display-section panel only
      title: string        // from activity.title
      description: string  // from body_data.description ?? ""
      activityId: string   // anchor id and React key
      sections: NotesSection[]
    }
```

---

## `groupIntoPanels()` Function

Exported from `StudyNotes.tsx`.

**Algorithm:**
1. Walk `activities` in order, accumulating a `pending` buffer of non-`display-section` activities.
2. On encountering a `display-section` activity:
   a. If `pending` is non-empty, flush it as an ungrouped panel (`groupIntoSections(pending)`).
   b. Clear `pending`.
   c. Start a new display-section panel, recording its `activityId`, `title`, and `description`. All subsequent non-`display-section` activities accumulate into this panel's inner buffer.
3. When a second (or later) `display-section` is hit, close the current display-section panel and repeat from step 2b.
4. At end of list, flush the remaining buffer into whichever panel is open.
5. Assign `index` as a 1-based counter incrementing only for display-section panels.

**Edge cases:**
- No `display-section` activities → single ungrouped panel containing all activities.
- `display-section` is the very first activity → no ungrouped panel; first panel is a display-section panel.
- Consecutive `display-section` activities (nothing between them) → second panel has empty `sections: []`.
- Activities after the last `display-section` → appended to the last display-section panel's inner list.

---

## Changes Required

### `lib/content.ts`

- Add `"display-section"` to the `ActivityType` union.
- Add `"display-section"` to `ALLOWED_ACTIVITY_TYPES`.

### `components/notes/StudyNotes.tsx`

- Add `DisplaySectionBody` local type.
- Add `ActivityPanel` exported type.
- Add `groupIntoPanels()` exported function.
- Update `StudyNotes` props: replace `sections: NotesSection[]` with `panels: ActivityPanel[]`.
- Update TOC: ungrouped panel → list inner sections by title (current behaviour); display-section panel → one TOC entry using panel title, linking to `#panel-{activityId}`.
- Update main render: ungrouped panel → render sections as today; display-section panel → render a white bordered container with panel header + inner sections.

### `app/topic/[code]/page.tsx`

- Replace `groupIntoSections` import with `groupIntoPanels`.
- Replace `const sections = groupIntoSections(...)` with `const panels = groupIntoPanels(...)`.
- Pass `panels` prop to `<StudyNotes>` instead of `sections`.

---

## Rendering — Display-Section Panel

The white bordered container:

```
background:    white  — check existing CSS tokens; use var(--bg-card) if available, otherwise literal white
border:        1.5px solid var(--ink-4)
border-radius: 14px
padding:       24px
margin:        24px 0
```

Panel header (inside the container, above the inner sections):
- **Primary line**: `Section {index}: {title}` — styled as a heading
- **Secondary line**: `{description}` — smaller, muted colour (`var(--ink-3)`)

Section numbering (`n` prop on `<Section>`) is sequential across all panels — it does not reset per panel.

---

## Tests

New unit tests for `groupIntoPanels()`:

| Scenario | Expected output |
|----------|----------------|
| No `display-section` activities | Single ungrouped panel |
| `display-section` is first activity | No ungrouped panel; one display-section panel with index 1 |
| Activities before first `display-section` | One ungrouped panel + one display-section panel |
| Multiple `display-section` activities | Correct panel count; indices 1, 2, 3… |
| Consecutive `display-section` activities | Each gets its own panel; inner panel has `sections: []` |

Tests live alongside existing content tests in `tests/`.

The existing integration test in `tests/lib/content-detail.integration.test.ts` requires no logic changes — `"display-section"` in `ALLOWED_ACTIVITY_TYPES` is sufficient.

---

## Out of Scope

- Nested sections (display-section inside a display-section).
- Display-section appearing in the TOC as a collapsible/accordion.
- Dark-mode styling for the panel border.
- Any admin-side changes.
