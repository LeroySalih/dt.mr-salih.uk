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

  // 1. flashcardsDone — any completed flashcard_session whose activity is this lesson's do-flashcards
  const { rows: fcRows } = await query<{ lesson_id: string }>(
    `
      select distinct a.lesson_id
      from flashcard_sessions fs
      join activities a on a.activity_id = fs.activity_id
      where fs.pupil_id = $1
        and a.lesson_id = any($2::text[])
        and a.type = 'do-flashcards'
        and fs.status = 'completed'
    `,
    [pupilId, lessonIds],
  )
  const flashcardsDoneSet = new Set(fcRows.map((r) => r.lesson_id))

  // 2. mcqPassed — mean score across MCQ activities' latest submissions ≥ 0.8
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

  // 3. explainDone — every short-text-question in the lesson has submission AND feedback
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
          where exists (
            select 1 from submissions s where s.activity_id = ea.activity_id and s.user_id = $1
          )
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
