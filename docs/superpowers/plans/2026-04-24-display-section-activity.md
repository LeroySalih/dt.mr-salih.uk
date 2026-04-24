# Display-Section Activity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render `display-section` activities as named, indexed, white-bordered panels that group all following activities until the next `display-section`.

**Architecture:** A new `groupIntoPanels()` pre-pass splits the flat activity list into `ActivityPanel[]` — either "ungrouped" (activities before the first display-section) or "display-section" panels. `groupIntoSections()` runs per-panel on inner activities. `StudyNotes` maps over panels, rendering display-section panels inside a white bordered container.

**Tech Stack:** Next.js (App Router), React (server components), TypeScript, Vitest for tests.

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `lib/content.ts` | Modify | Register `"display-section"` in `ActivityType` union and `ALLOWED_ACTIVITY_TYPES` |
| `components/notes/StudyNotes.tsx` | Modify | Add `ActivityPanel` type, `groupIntoPanels()`, update props and rendering |
| `app/topic/[code]/page.tsx` | Modify | Swap `groupIntoSections` → `groupIntoPanels`, pass `panels` prop |
| `tests/lib/group-into-panels.test.ts` | Create | Unit tests for `groupIntoPanels()` |

---

## Task 1: Register `display-section` in `lib/content.ts`

**Files:**
- Modify: `lib/content.ts`

- [ ] **Step 1: Add `"display-section"` to the `ActivityType` union**

In `lib/content.ts`, lines 137–148, add `"display-section"` to the union:

```ts
export type ActivityType =
  | "text"
  | "display-key-terms"
  | "display-image"
  | "show-video"
  | "multiple-choice-question"
  | "short-text-question"
  | "do-flashcards"
  | "display-flashcards"
  | "file-download"
  | "upload-file"
  | "text-question"
  | "display-section"
```

- [ ] **Step 2: Add `"display-section"` to `ALLOWED_ACTIVITY_TYPES`**

In `lib/content.ts`, lines 150–162, add to the array:

```ts
export const ALLOWED_ACTIVITY_TYPES: readonly ActivityType[] = [
  "text",
  "display-key-terms",
  "display-image",
  "show-video",
  "multiple-choice-question",
  "short-text-question",
  "do-flashcards",
  "display-flashcards",
  "file-download",
  "upload-file",
  "text-question",
  "display-section",
]
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add lib/content.ts
git commit -m "feat(content): register display-section activity type"
```

---

## Task 2: Write failing tests for `groupIntoPanels`

**Files:**
- Create: `tests/lib/group-into-panels.test.ts`

The function doesn't exist yet — these tests must fail.

- [ ] **Step 1: Create the test file**

```ts
import { describe, it, expect } from "vitest"
import { groupIntoPanels } from "@/components/notes/StudyNotes"
import type { Activity } from "@/lib/content"

function makeActivity(overrides: Partial<Activity> & { type: Activity["type"] }): Activity {
  return {
    activityId: overrides.activityId ?? crypto.randomUUID(),
    type: overrides.type,
    title: overrides.title ?? null,
    orderBy: overrides.orderBy ?? 0,
    bodyData: overrides.bodyData ?? null,
  }
}

describe("groupIntoPanels", () => {
  it("returns a single ungrouped panel when there are no display-section activities", () => {
    const activities: Activity[] = [
      makeActivity({ type: "text", title: "Intro" }),
      makeActivity({ type: "display-image" }),
    ]
    const panels = groupIntoPanels(activities)
    expect(panels).toHaveLength(1)
    expect(panels[0].type).toBe("ungrouped")
    expect(panels[0].sections.length).toBeGreaterThan(0)
  })

  it("produces no ungrouped panel when display-section is the first activity", () => {
    const activities: Activity[] = [
      makeActivity({ type: "display-section", title: "Starter", bodyData: { description: "Do now" } }),
      makeActivity({ type: "text", title: "Some text" }),
    ]
    const panels = groupIntoPanels(activities)
    expect(panels).toHaveLength(1)
    expect(panels[0].type).toBe("display-section")
    if (panels[0].type === "display-section") {
      expect(panels[0].index).toBe(1)
      expect(panels[0].title).toBe("Starter")
      expect(panels[0].description).toBe("Do now")
      expect(panels[0].sections).toHaveLength(1)
    }
  })

  it("produces an ungrouped panel followed by a display-section panel when activities precede the first display-section", () => {
    const activities: Activity[] = [
      makeActivity({ type: "text", title: "Before" }),
      makeActivity({ type: "display-section", title: "Main", bodyData: { description: "Main task" } }),
      makeActivity({ type: "text", title: "Inside" }),
    ]
    const panels = groupIntoPanels(activities)
    expect(panels).toHaveLength(2)
    expect(panels[0].type).toBe("ungrouped")
    expect(panels[1].type).toBe("display-section")
    if (panels[1].type === "display-section") {
      expect(panels[1].index).toBe(1)
    }
  })

  it("assigns sequential 1-based indices to display-section panels", () => {
    const activities: Activity[] = [
      makeActivity({ type: "display-section", title: "A", bodyData: { description: "" } }),
      makeActivity({ type: "text", title: "In A" }),
      makeActivity({ type: "display-section", title: "B", bodyData: { description: "" } }),
      makeActivity({ type: "text", title: "In B" }),
      makeActivity({ type: "display-section", title: "C", bodyData: { description: "" } }),
    ]
    const panels = groupIntoPanels(activities)
    expect(panels).toHaveLength(3)
    const indices = panels.map((p) => (p.type === "display-section" ? p.index : null))
    expect(indices).toEqual([1, 2, 3])
  })

  it("produces an empty sections array for a display-section with no following activities", () => {
    const activities: Activity[] = [
      makeActivity({ type: "display-section", title: "Empty", bodyData: { description: "" } }),
    ]
    const panels = groupIntoPanels(activities)
    expect(panels).toHaveLength(1)
    if (panels[0].type === "display-section") {
      expect(panels[0].sections).toHaveLength(0)
    }
  })

  it("handles consecutive display-section activities (nothing between them)", () => {
    const activities: Activity[] = [
      makeActivity({ type: "display-section", title: "First", bodyData: { description: "" } }),
      makeActivity({ type: "display-section", title: "Second", bodyData: { description: "" } }),
      makeActivity({ type: "text", title: "Only in second" }),
    ]
    const panels = groupIntoPanels(activities)
    expect(panels).toHaveLength(2)
    if (panels[0].type === "display-section") expect(panels[0].sections).toHaveLength(0)
    if (panels[1].type === "display-section") expect(panels[1].sections).toHaveLength(1)
  })

  it("returns an empty array for an empty activity list", () => {
    expect(groupIntoPanels([])).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Run the tests to confirm they fail**

```bash
npm test -- tests/lib/group-into-panels.test.ts
```

Expected: FAIL — `groupIntoPanels is not exported from '@/components/notes/StudyNotes'`.

---

## Task 3: Implement `ActivityPanel` type and `groupIntoPanels` in `StudyNotes.tsx`

**Files:**
- Modify: `components/notes/StudyNotes.tsx`

- [ ] **Step 1: Add `DisplaySectionBody` type and `ActivityPanel` type after line 22 (after `NotesSection`)**

Add immediately after the closing brace of the `NotesSection` type definition:

```ts
type DisplaySectionBody = { description?: string }

export type ActivityPanel =
  | { type: "ungrouped"; sections: NotesSection[] }
  | {
      type: "display-section"
      index: number
      title: string
      description: string
      activityId: string
      sections: NotesSection[]
    }
```

- [ ] **Step 2: Add `groupIntoPanels` function after `groupIntoSections`**

Add after the closing brace of `groupIntoSections` (after line 62):

```ts
export function groupIntoPanels(activities: Activity[]): ActivityPanel[] {
  const panels: ActivityPanel[] = []
  let pendingInner: Activity[] = []
  let currentPanel: (ActivityPanel & { type: "display-section" }) | null = null
  let sectionIndex = 0

  const flushUngrouped = () => {
    if (pendingInner.length === 0) return
    panels.push({ type: "ungrouped", sections: groupIntoSections(pendingInner) })
    pendingInner = []
  }

  const flushDisplaySection = () => {
    if (!currentPanel) return
    currentPanel.sections = groupIntoSections(pendingInner)
    panels.push(currentPanel)
    currentPanel = null
    pendingInner = []
  }

  for (const a of activities) {
    if (a.type === "display-section") {
      if (currentPanel) {
        flushDisplaySection()
      } else {
        flushUngrouped()
      }
      sectionIndex++
      const body = (a.bodyData ?? {}) as DisplaySectionBody
      currentPanel = {
        type: "display-section",
        index: sectionIndex,
        title: a.title ?? "",
        description: body.description ?? "",
        activityId: a.activityId,
        sections: [],
      }
    } else {
      pendingInner.push(a)
    }
  }

  if (currentPanel) {
    flushDisplaySection()
  } else {
    flushUngrouped()
  }

  return panels
}
```

- [ ] **Step 3: Run the tests — they should now pass**

```bash
npm test -- tests/lib/group-into-panels.test.ts
```

Expected: All 7 tests PASS.

- [ ] **Step 4: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add components/notes/StudyNotes.tsx tests/lib/group-into-panels.test.ts
git commit -m "feat(notes): add ActivityPanel type and groupIntoPanels function"
```

---

## Task 4: Update `StudyNotes` component props and rendering

**Files:**
- Modify: `components/notes/StudyNotes.tsx`

This task updates the `StudyNotes` component to accept `panels: ActivityPanel[]` and render display-section panels inside white bordered containers.

- [ ] **Step 1: Add the `SectionPanel` async component before the `Props` type**

Add this function after the existing `Section` component (after line 141):

```tsx
async function DisplaySectionPanel({
  panel,
  startN,
}: {
  panel: ActivityPanel & { type: "display-section" }
  startN: number
}) {
  const innerNodes = await Promise.all(
    panel.sections.map((s, i) => Section({ section: s, n: startN + i + 1 })),
  )
  return (
    <div
      id={`panel-${panel.activityId}`}
      style={{
        background: "#fff",
        border: "1.5px solid var(--ink-4)",
        borderRadius: 14,
        padding: 24,
        margin: "24px 0",
      }}
    >
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 20, color: "var(--ink)" }}>
          Section {panel.index}: {panel.title}
        </h2>
        {panel.description && (
          <p style={{ margin: "4px 0 0", color: "var(--ink-3)", fontSize: 14 }}>
            {panel.description}
          </p>
        )}
      </div>
      {innerNodes}
    </div>
  )
}
```

- [ ] **Step 2: Update the `Props` type**

Replace lines 143–148:

```ts
type Props = {
  topic: { code: string; title: string; section: "core" | "systems"; activityCount: number }
  panels: ActivityPanel[]
  tint: string
  launcher: React.ReactNode
}
```

- [ ] **Step 3: Update the `StudyNotes` function signature and body**

Replace the entire `StudyNotes` export (lines 150–215) with:

```tsx
export async function StudyNotes({ topic, panels, tint, launcher }: Props) {
  // Pre-compute per-panel section start offsets for sequential numbering
  let offset = 0
  const panelOffsets = panels.map((panel) => {
    const start = offset
    offset += panel.sections.length
    return start
  })

  // Render all panels
  const panelNodes = await Promise.all(
    panels.map(async (panel, pi) => {
      const startN = panelOffsets[pi]
      if (panel.type === "ungrouped") {
        const nodes = await Promise.all(
          panel.sections.map((s, i) => Section({ section: s, n: startN + i + 1 })),
        )
        return nodes.map((node, i) => (
          <React.Fragment key={panel.sections[i].id}>{node}</React.Fragment>
        ))
      }
      return [
        <DisplaySectionPanel key={panel.activityId} panel={panel} startN={startN} />,
      ]
    }),
  )

  // Flatten the nested arrays
  const allNodes = panelNodes.flat()

  // Build TOC entries
  const tocEntries = panels.flatMap((panel) => {
    if (panel.type === "ungrouped") {
      return panel.sections.map((s) => ({
        id: `sec-${s.id}`,
        label: s.title || "Section",
      }))
    }
    return [{ id: `panel-${panel.activityId}`, label: panel.title || "Section" }]
  })

  const tintVars: Record<string, { tint: string; deep: string }> = {
    mint:  { tint: "var(--mint)",  deep: "var(--mint-deep)"  },
    peach: { tint: "var(--peach)", deep: "var(--peach-deep)" },
    sky:   { tint: "var(--sky)",   deep: "var(--sky-deep)"   },
    lilac: { tint: "var(--lilac)", deep: "var(--lilac-deep)" },
    lemon: { tint: "var(--lemon)", deep: "var(--lemon-deep)" },
    coral: { tint: "var(--coral)", deep: "var(--coral-deep)" },
    teal:  { tint: "var(--teal)",  deep: "var(--teal-deep)"  },
  }
  const vars = tintVars[tint] ?? tintVars.peach
  const style = { "--card-tint": vars.tint, "--card-deep": vars.deep } as React.CSSProperties

  return (
    <div className="notes-overlay" style={{ ...style, position: "static", background: "var(--bg)" }}>
      <div className="notes-bar">
        <a href="/" className="btn btn-small" style={{ padding: "6px 14px", fontSize: 13 }}>← All topics</a>
        {topic.code && <span className="card-code">{topic.code}</span>}
        <span className="notes-bar-title">{topic.title}</span>
      </div>

      <div className="notes-layout">
        <aside className="notes-toc">
          <div className="notes-toc-label">In this topic</div>
          <ol>
            {tocEntries.map((entry) => (
              <li key={entry.id}>
                <a href={`#${entry.id}`}>{entry.label}</a>
              </li>
            ))}
          </ol>
        </aside>

        <main className="notes-main">
          <div className="notes-hero">
            <span className="notes-hero-tag">{topic.section === "systems" ? "Systems" : "Core"} · Topic {topic.code || "—"}</span>
            {topic.code && <div className="notes-hero-number">{topic.code}</div>}
            <h1 className="notes-hero-title">{topic.title}</h1>
            <p className="notes-hero-intro">{topic.activityCount} activities to work through.</p>
          </div>

          {allNodes.length === 0 ? (
            <div className="empty">
              <h3 className="empty-title">No notes yet</h3>
              <p>This topic doesn&apos;t have study notes populated. Try flashcards or quiz.</p>
            </div>
          ) : (
            allNodes
          )}

          <div className="notes-cta">
            <h4>Ready to test yourself?</h4>
            <p>Lock it in with flashcards, a quick quiz, or an explain-it prompt.</p>
            {launcher}
          </div>
        </main>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: No errors. If you see an error about `sections` being passed to `StudyNotes`, that's fixed in Task 5.

- [ ] **Step 5: Run the full test suite**

```bash
npm test
```

Expected: All existing tests pass (the page-level test may fail if it uses `sections` — fix that in Task 5).

---

## Task 5: Update `app/topic/[code]/page.tsx`

**Files:**
- Modify: `app/topic/[code]/page.tsx`

- [ ] **Step 1: Update the import**

Replace line 9:
```ts
import { StudyNotes, groupIntoSections } from "@/components/notes/StudyNotes"
```
With:
```ts
import { StudyNotes, groupIntoPanels } from "@/components/notes/StudyNotes"
```

- [ ] **Step 2: Replace `groupIntoSections` call with `groupIntoPanels`**

Replace line 84:
```ts
const sections = groupIntoSections(topic.activities)
```
With:
```ts
const panels = groupIntoPanels(topic.activities)
```

- [ ] **Step 3: Update the `StudyNotes` JSX prop**

Replace in the `return` statement:
```tsx
<StudyNotes
  topic={{
    code: topic.code,
    title: topic.title || topic.rawTitle,
    section: topic.section,
    activityCount: topic.activities.length,
  }}
  sections={sections}
  tint={tint}
  launcher={launcher}
/>
```
With:
```tsx
<StudyNotes
  topic={{
    code: topic.code,
    title: topic.title || topic.rawTitle,
    section: topic.section,
    activityCount: topic.activities.length,
  }}
  panels={panels}
  tint={tint}
  launcher={launcher}
/>
```

- [ ] **Step 4: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 5: Run the full test suite**

```bash
npm test
```

Expected: All tests pass.

- [ ] **Step 6: Start the dev server and verify visually**

```bash
npm run dev
```

Open a topic that has `display-section` activities in the browser. Verify:
- White bordered panel appears with correct "Section N: Title" heading
- Description renders below the heading in muted text
- Inner activities render inside the panel
- Activities before the first display-section render normally (no panel wrapper)
- Multiple display-section panels each get the correct sequential index
- TOC sidebar shows panel titles for display-section panels, inner section titles for ungrouped activities

- [ ] **Step 7: Commit**

```bash
git add app/topic/\[code\]/page.tsx components/notes/StudyNotes.tsx
git commit -m "feat(notes): render display-section activities as bordered panels"
```
