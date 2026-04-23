import { query } from "@/lib/db"
import { parseTopicCode } from "@/lib/topic-code"

export type TopicSection = "core" | "systems"

export type TopicSummary = {
  code: string       // parsed code (may be "")
  title: string      // parsed display title (without code prefix)
  rawTitle: string   // original lessons.title from DB (for filters / debug)
  section: TopicSection
  lessonId: string
  unitId: string
  unitTitle: string
  vocabCount: number
}

const CORE_UNIT_IDS = ["1001-CORE-1", "1003-CORE-2", "CORE-3-10"] as const
const SYSTEMS_UNIT_IDS = ["1010-SYSTEMS-1"] as const
const ALL_UNIT_IDS = [...CORE_UNIT_IDS, ...SYSTEMS_UNIT_IDS]

type Row = {
  lesson_id: string
  lesson_title: string | null
  unit_id: string
  unit_title: string | null
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
          -- count non-empty lines in the display-flashcards activity that the
          -- lesson's do-flashcards activity points to
          select count(*)::int
          from (
            select regexp_split_to_table(coalesce(df.body_data ->> 'lines', ''), E'\\n') as line
            from activities do_fc
            join activities df on df.activity_id = do_fc.body_data ->> 'flashcardActivityId'
            where do_fc.lesson_id = l.lesson_id
              and do_fc.type = 'do-flashcards'
              and df.type = 'display-flashcards'
              and coalesce(do_fc.active, true) = true
              and coalesce(df.active, true) = true
            limit 1
          ) s
          where length(trim(s.line)) > 0
        ), 0) as vocab_count
      from lessons l
      join units u on u.unit_id = l.unit_id
      where u.unit_id = any($1::text[])
        and coalesce(l.active, true) = true
        and coalesce(u.active, true) = true
        and coalesce(l.title, '') !~* 'assessment'
      order by u.unit_id, l.order_by nulls last, l.title
    `,
    [ALL_UNIT_IDS],
  )

  return rows.map((row) => {
    const parsed = parseTopicCode(row.lesson_title) ?? { code: "", title: "" }
    const section: TopicSection = row.unit_id === "1010-SYSTEMS-1" ? "systems" : "core"
    return {
      code: parsed.code,
      title: parsed.title,
      rawTitle: row.lesson_title ?? "",
      section,
      lessonId: row.lesson_id,
      unitId: row.unit_id,
      unitTitle: row.unit_title ?? "",
      vocabCount: row.vocab_count ?? 0,
    } satisfies TopicSummary
  })
}
