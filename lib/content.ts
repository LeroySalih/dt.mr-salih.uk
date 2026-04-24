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

function parseIds(raw: string | undefined): string[] {
  if (!raw) return []
  return raw.split(",").map((s) => s.trim()).filter((s) => s.length > 0)
}

function coreUnitIds(): string[] {
  return parseIds(process.env.CORE_UNIT_IDS)
}

function systemsUnitIds(): string[] {
  return parseIds(process.env.SYSTEMS_UNIT_IDS)
}

function allUnitIds(): string[] {
  return [...coreUnitIds(), ...systemsUnitIds()]
}

type Row = {
  lesson_id: string
  lesson_title: string | null
  unit_id: string
  unit_title: string | null
  vocab_count: number
}

/**
 * Return the unit_ids a given pupil has been assigned via any of their groups.
 * Intersected at call sites with the env-configured allowlist so a pupil only
 * ever sees units that are both (a) assigned to them and (b) part of the site's
 * configured CORE/SYSTEMS universe.
 */
export async function assignedUnitIdsForPupil(pupilId: string): Promise<string[]> {
  const { rows } = await query<{ unit_id: string }>(
    `
      select distinct a.unit_id
      from assignments a
      join group_membership gm on gm.group_id = a.group_id
      where gm.user_id = $1
        and coalesce(a.active, true) = true
    `,
    [pupilId],
  )
  return rows.map((r) => r.unit_id)
}

/**
 * Topics visible on the site.
 *
 * - Anonymous (pupilId omitted): all lessons under the env-configured
 *   CORE_UNIT_IDS + SYSTEMS_UNIT_IDS units.
 * - Signed-in (pupilId given): lessons under the intersection of the env list
 *   AND the units assigned to the pupil via group_membership + assignments.
 *   If the pupil has no matching assignments, returns an empty array.
 *
 * Lessons whose title matches /assessment/i are excluded either way.
 */
export async function listTopics(pupilId?: string): Promise<TopicSummary[]> {
  const envAll = allUnitIds()
  if (envAll.length === 0) return []

  let effectiveUnitIds = envAll
  if (pupilId) {
    const assigned = new Set(await assignedUnitIdsForPupil(pupilId))
    effectiveUnitIds = envAll.filter((id) => assigned.has(id))
    if (effectiveUnitIds.length === 0) return []
  }

  const systemsSet = new Set(systemsUnitIds())

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
    [effectiveUnitIds],
  )

  return rows.map((row) => {
    const parsed = parseTopicCode(row.lesson_title) ?? { code: "", title: "" }
    const section: TopicSection = systemsSet.has(row.unit_id) ? "systems" : "core"
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
]

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

export async function getTopicByCode(code: string, pupilId?: string): Promise<TopicDetail | null> {
  const topics = await listTopics(pupilId)
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
        and type = any($2::text[])
      order by order_by asc, activity_id asc
    `,
    [summary.lessonId, ALLOWED_ACTIVITY_TYPES as unknown as string[]],
  )

  const activities: Activity[] = rows
    .filter((r): r is typeof r & { type: ActivityType } =>
      r.type !== null && (ALLOWED_ACTIVITY_TYPES as readonly string[]).includes(r.type),
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
