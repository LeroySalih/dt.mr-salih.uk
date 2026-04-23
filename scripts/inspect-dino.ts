import { query } from "@/lib/db"

async function main() {
  // 1. activities columns
  const cols = await query<{ column_name: string; data_type: string }>(
    `select column_name, data_type from information_schema.columns where table_name = 'activities' order by ordinal_position`,
  )
  console.log("activities columns:")
  cols.rows.forEach((r) => console.log(`  - ${r.column_name}: ${r.data_type}`))

  // 2. Do the 4 expected units exist?
  // NOTE: spec assumed titles 'Core 1','Core 2','Core 3','Systems' but actual titles differ.
  // Only 'Core 3' matches by title. Use unit_id filter for reliable results.
  const units = await query<{ unit_id: string; title: string; subject: string | null }>(
    `select unit_id, title, subject from units where title in ('Core 1','Core 2','Core 3','Systems') order by title`,
  )
  console.log(`\nMatching units by spec titles (expect 4, actual may differ): ${units.rows.length}`)
  units.rows.forEach((u) => console.log(`  - ${u.title} (subject=${u.subject ?? "null"}, id=${u.unit_id})`))

  // 2b. Correct unit lookup by ID (canonical IDs confirmed from live DB)
  const unitIds = ["1001-CORE-1", "1003-CORE-2", "CORE-3-10", "1010-SYSTEMS-1"]
  const unitsById = await query<{ unit_id: string; title: string; subject: string | null }>(
    `select unit_id, title, subject from units where unit_id = any($1) order by unit_id`,
    [unitIds],
  )
  console.log(`\nActual DT scope units by unit_id (${unitsById.rows.length}):`)
  unitsById.rows.forEach((u) => console.log(`  - "${u.title}" (subject=${u.subject ?? "null"}, id=${u.unit_id})`))

  // 3. Lesson titles under those units — confirm code prefix convention
  const lessons = await query<{ title: string; unit_title: string }>(
    `select l.title, u.title as unit_title from lessons l join units u on u.unit_id = l.unit_id where l.unit_id = any($1) order by l.unit_id, l.order_by`,
    [unitIds],
  )
  console.log(`\nLessons in those units: ${lessons.rows.length}`)
  lessons.rows.slice(0, 5).forEach((l) => console.log(`  - [${l.unit_title}] ${l.title}`))
  if (lessons.rows.length > 5) console.log(`  … (${lessons.rows.length - 5} more)`)

  // 4. Distinct activity types present under those units
  const types = await query<{ type: string | null; n: number }>(
    `select a.type, count(*)::int as n from activities a join lessons l on l.lesson_id = a.lesson_id where l.unit_id = any($1) group by a.type order by n desc`,
    [unitIds],
  )
  console.log(`\nActivity types in those units:`)
  types.rows.forEach((t) => console.log(`  - ${t.type ?? "null"}: ${t.n}`))

  // 5. Sample flashcard activity body_data shape
  // NOTE: live DB uses 'display-flashcards' not 'flashcard'
  const fc = await query<{ activity_id: string; lesson_id: string | null; body_data: unknown }>(
    `select a.activity_id, a.lesson_id, a.body_data from activities a join lessons l on l.lesson_id = a.lesson_id where l.unit_id = any($1) and a.type = 'display-flashcards' limit 1`,
    [unitIds],
  )
  console.log(`\nSample display-flashcards body_data (if any):`)
  console.log(JSON.stringify(fc.rows[0] ?? null, null, 2))

  // 6. Sample display-text body_data
  // NOTE: live DB uses 'text' not 'display-text'
  const dt = await query<{ activity_id: string; body_data: unknown }>(
    `select a.activity_id, a.body_data from activities a join lessons l on l.lesson_id = a.lesson_id where l.unit_id = any($1) and a.type = 'text' limit 1`,
    [unitIds],
  )
  console.log(`\nSample 'text' type body_data (spec called this display-text):`)
  console.log(JSON.stringify(dt.rows[0] ?? null, null, 2))

  // 7. ai_marking_queue FK constraints on assignment_id
  const fks = await query<{ constraint_name: string; referenced_table: string; referenced_column: string }>(
    `select tc.constraint_name, ccu.table_name as referenced_table, ccu.column_name as referenced_column
     from information_schema.table_constraints tc
     join information_schema.key_column_usage kcu on tc.constraint_name = kcu.constraint_name
     join information_schema.constraint_column_usage ccu on tc.constraint_name = ccu.constraint_name
    where tc.table_name = 'ai_marking_queue' and tc.constraint_type = 'FOREIGN KEY' and kcu.column_name = 'assignment_id'`,
  )
  console.log(`\nai_marking_queue.assignment_id FKs:`)
  fks.rows.forEach((f) => console.log(`  - ${f.constraint_name} -> ${f.referenced_table}.${f.referenced_column}`))
  if (fks.rows.length === 0) console.log("  (none — assignment_id is free-text)")

  // 8. Full lesson list with ordering (all 25 expected)
  const allLessons = await query<{ title: string; unit_title: string; order_by: number | null }>(
    `select l.title, u.title as unit_title, l.order_by from lessons l join units u on u.unit_id = l.unit_id where l.unit_id = any($1) order by l.unit_id, l.order_by`,
    [unitIds],
  )
  console.log(`\nAll lessons in scope (${allLessons.rows.length}):`)
  allLessons.rows.forEach((l) => console.log(`  - [${l.unit_title}] (order=${l.order_by ?? "null"}) ${l.title}`))

  // 9. Sample MCQ body_data
  const mcq = await query<{ body_data: unknown }>(
    `select a.body_data from activities a join lessons l on l.lesson_id = a.lesson_id where l.unit_id = any($1) and a.type = 'multiple-choice-question' limit 1`,
    [unitIds],
  )
  console.log(`\nSample MCQ body_data:`)
  console.log(JSON.stringify(mcq.rows[0] ?? null, null, 2))

  // 10. Sample short-text body_data
  const st = await query<{ body_data: unknown }>(
    `select a.body_data from activities a join lessons l on l.lesson_id = a.lesson_id where l.unit_id = any($1) and a.type = 'short-text-question' limit 1`,
    [unitIds],
  )
  console.log(`\nSample short-text body_data:`)
  console.log(JSON.stringify(st.rows[0] ?? null, null, 2))

  process.exit(0)
}
main().catch((e) => { console.error(e); process.exit(1) })
