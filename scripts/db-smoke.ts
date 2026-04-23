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
