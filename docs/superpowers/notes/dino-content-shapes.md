# Dino Content Shapes — Live DB Reference

_Generated: 2026-04-23 by Task 1.2 inspect script against the live dino PostgreSQL database._

---

## Spec Discrepancies

**IMPORTANT — Unit titles do not match the spec's assumptions.**

The spec (§11) assumed four units named exactly `Core 1`, `Core 2`, `Core 3`, `Systems`. The live DB has these four DT units but with different titles:

| Spec title | Actual DB title     | unit_id         |
|------------|---------------------|-----------------|
| Core 1     | `1001-Core 1`       | `1001-CORE-1`   |
| Core 2     | `1003 - Core 2`     | `1003-CORE-2`   |
| Core 3     | `Core 3`            | `CORE-3-10`     |
| Systems    | `Systems 1`         | `1010-SYSTEMS-1`|

**Consequence:** Any SQL that filters by title `in ('Core 1','Core 2','Core 3','Systems')` will only match `Core 3`. All content-loader queries must filter by `unit_id` instead of `title`. The canonical unit IDs to use are:

```ts
const UNIT_IDS = ["1001-CORE-1", "1003-CORE-2", "CORE-3-10", "1010-SYSTEMS-1"]
```

**Lesson count discrepancy:** The spec expected 25 lessons (17 + 8). The live DB contains **46 lessons** across the four units. Lesson structure is more granular than assumed (see §6 below).

**Activity type naming discrepancy:** The spec referred to `flashcard` and `display-text` activity types. The live DB uses `display-flashcards` / `do-flashcards` (not `flashcard`) and `text` (not `display-text`).

---

## Resolved Open Items

### 1. Activity ordering column

- **Column name:** `order_by`
- **Data type:** `integer`
- **Confirmed from:** `information_schema.columns` for table `activities`

Full `activities` table columns:

| column_name    | data_type |
|----------------|-----------|
| activity_id    | text      |
| lesson_id      | text      |
| title          | text      |
| type           | text      |
| body_data      | jsonb     |
| order_by       | integer   |
| active         | boolean   |
| is_summative   | boolean   |
| notes          | text      |

### 2. Flashcard activity `body_data` shape

The spec assumed a `flashcard` type with `{ cards: [{ term, def }] }`. The live DB has **two separate types**:

**`display-flashcards`** — contains the card content as a fill-in-the-blank text format using `**bold**` markdown to mark the answers:

```json
{
  "body_data": {
    "lines": "A process that removes material is called **subtractive**.\nA process that changes material is called **transformative**.\n..."
  }
}
```

- Format: a single multiline string where `**bold**` words are the fill-in blanks.
- NOT `{ cards: [{ term, def }] }` as the spec assumed.

**`do-flashcards`** — references a `display-flashcards` activity by ID:

```json
{
  "body_data": {
    "flashcardActivityId": "daf29b00-7370-4111-88f6-ac613e24c6c9"
  }
}
```

### 3. Display-text activity `body_data` shape

The spec called this `display-text`. The live DB type is `text`. Body is raw HTML (not markdown):

```json
{
  "body_data": {
    "text": "<div><span style=\"color: rgb(0, 0, 0); ...\">\nhttps://app.formative.com/formatives/654b992faa22efb200fe4d59\n</span></div>"
  }
}
```

- Key: `body_data.text`
- Content: HTML string with inline styles, not markdown.
- In practice the sample found is a bare URL — `text` activities appear to be catch-all rich text.

There is also a separate `display-key-terms` type which uses markdown:

```json
{
  "body_data": {
    "markdown": "| Term | Definition |\n| --- | --- |\n| Conductive inks | ... |"
  }
}
```

### 4. `ai_marking_queue.assignment_id` FK constraint

- **Result:** NO foreign key constraint exists on `assignment_id`.
- `assignment_id` is a plain `text` column — free-text.
- **Consequence for later tasks:** a sentinel string is acceptable; no real `assignments` row lookup is needed.

Full `ai_marking_queue` schema:

| column_name   | data_type                |
|---------------|--------------------------|
| queue_id      | uuid                     |
| submission_id | text                     |
| assignment_id | text                     |
| status        | text                     |
| attempts      | integer                  |
| last_error    | text                     |
| created_at    | timestamp with time zone |
| updated_at    | timestamp with time zone |
| process_after | timestamp with time zone |

### 5. Exact unit titles

**DISCREPANCY — see top of document.** The spec assumed `Core 1`, `Core 2`, `Core 3`, `Systems`. Actual titles differ. Filter by `unit_id`, not `title`.

---

## Additional Findings

### 6. Lesson counts per unit

Total: **46 lessons** across the four units (spec expected 25).

| Unit            | unit_id         | Lesson count |
|-----------------|-----------------|--------------|
| 1001-Core 1     | `1001-CORE-1`   | 14           |
| 1003 - Core 2   | `1003-CORE-2`   | 11           |
| Systems 1       | `1010-SYSTEMS-1`| 17           |
| Core 3          | `CORE-3-10`     | 4            |
| **Total**       |                 | **46**       |

Full lesson list (ordered by unit_id, then order_by):

**1001-Core 1:**
- (order=0) 1.1.1Technology Impact
- (order=1) 1.1.2 Production Scales
- (order=2) 1.2.1 Evaluating Impact of New Technology
- (order=3) 1.2.2 Emerging Technology
- (order=4) 1.3 Energy Generation and Comparison
- (order=5) 1.4 Smart & Composite materials and technical textiles - Overview.
- (order=6) 1.4.1 Smart Materials
- (order=7) 1.4.2 Composite Matererials
- (order=8) 1.4.3 Technical Textiles
- (order=9) Energy Generation Assessment
- (order=10) Emerging Technology Assessment
- (order=11) Evaluating Technology
- (order=12) Assessment 1
- (order=13) SCT - Assessment

**1003 - Core 2:**
- (order=0) Overview
- (order=1) 1.5.1 Types of Movement
- (order=2) 1.5.2 Types of Levers
- (order=3) 1.5.3 Linkages
- (order=4) 1.5.4 Cams and Followers
- (order=5) 1.5.5 Cranks and Sliders
- (order=6) 1.5.6 Gears
- (order=7) Power Metrics & Formula
- (order=8) 1.6 Electronic Systems
- (order=9) 1.7 Programmable Components
- (order=10) Assessment

**Systems 1:**
- (order=0) 5.2.1 What are components?
- (order=1) 5.2.2 Electrical Components
- (order=2) 5.2.3 Resistors
- (order=3) 5.3 Selection of Components
- (order=4) 5.3 Selection of Material Properties and Origins
- (order=5) Output Components
- (order=5) 5.4.1 Impact of Forces and Stresses on Objects _(duplicate order_by=5)_
- (order=6) 5.4.2 Mitigating the Effects of Forces
- (order=7) 5.6 Manufacturing Processes
- (order=8) 5.6.1 Production Scales
- (order=9) 5.6.2 Techniques for making one-off and prototypes
- (order=10) 5.6.3 Techniques for High Quantity Production
- (order=11) 5.7 Processes for Prototypes
- (order=11) 5.7.1 Process for Manufacturing - Hand Tools _(duplicate order_by=11)_
- (order=12) 5.7.2 Processes for Prototypes - Machinery
- (order=13) 5.8 Surface Finishes
- (order=14) Sustainability & Social Footprint

**Core 3:**
- (order=92) 1.13 Context Informs  Outcomes
- (order=93) 1.14 Challenges to consider in design
- (order=94) 1.16 Design Strategies
- (order=95) 1.17 Communication Techniques

_Note: Core 3 order_by values start at 92 (likely global ordering from a shared lesson sequence), not 0._
_Note: Systems 1 has two pairs of duplicate order_by values (5 and 11) — tie-break order is undefined._

### 7. Activity type counts under the four units

| type                     | count |
|--------------------------|-------|
| short-text-question      | 90    |
| display-image            | 56    |
| display-key-terms        | 29    |
| text                     | 21    |
| show-video               | 14    |
| multiple-choice-question | 9     |
| display-flashcards       | 3     |
| do-flashcards            | 3     |
| file-download            | 1     |
| upload-file              | 1     |
| text-question            | 1     |

### 8. Sample MCQ `body_data`

```json
{
  "body_data": {
    "question": "Vacuum Forming is an example of\u00a0",
    "options": [
      { "id": "option-a", "text": "Subtractive",       "imageUrl": null },
      { "id": "option-b", "text": "Additive",           "imageUrl": null },
      { "id": "option-c", "text": "Transformative",     "imageUrl": null },
      { "id": "option-d", "text": "None of the above.", "imageUrl": null }
    ],
    "correctOptionId": "option-c",
    "imageUrl": null,
    "imageAlt": null,
    "imageFile": null
  }
}
```

### 9. Sample `short-text-question` `body_data`

```json
{
  "body_data": {
    "question": "A man-made stone formed when cement binds sand and aggregate, often strengthened with steel rebar:",
    "modelAnswer": "concrete"
  }
}
```

### 10. Sample `display-image` `body_data`

```json
{
  "body_data": {
    "size": 240775,
    "fileUrl": "Slide2.jpeg",
    "imageUrl": null,
    "mimeType": "image/jpeg",
    "imageFile": "Slide2.jpeg"
  }
}
```

### 11. Sample `show-video` `body_data`

```json
{
  "body_data": {
    "fileUrl": "https://youtu.be/KpCrWP8J_vY?si=w7LA1XXbxPChYL0X"
  }
}
```

### 12. Sample `display-key-terms` `body_data`

```json
{
  "body_data": {
    "markdown": "| Term | Definition |\n| --- | --- |\n| Conductive inks | Inks containing pigments... |"
  }
}
```

---

## Summary for Content-Loader Code

1. **Always filter by `unit_id`**, never by title. Use `const UNIT_IDS = ["1001-CORE-1", "1003-CORE-2", "CORE-3-10", "1010-SYSTEMS-1"]`.
2. **Activity ordering** uses column `order_by` (integer). Beware of duplicate order_by values in Systems 1.
3. **Flashcard type** is `display-flashcards` (content) + `do-flashcards` (interactive reference). Content format is `body_data.lines` — a newline-separated string where `**bold**` marks blanks. Not cards array.
4. **Text/display type** is `text` (HTML in `body_data.text`) and `display-key-terms` (markdown in `body_data.markdown`).
5. **`assignment_id`** is free-text — no FK constraint. Sentinel strings are fine.
6. **46 lessons** exist, not 25. All content-loader pagination/counting logic must be sized accordingly.
