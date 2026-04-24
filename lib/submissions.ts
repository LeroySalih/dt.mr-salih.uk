import { query } from "@/lib/db"

export async function insertSubmission(params: {
  activityId: string
  userId: string
  body: Record<string, unknown>
}): Promise<string> {
  const { rows } = await query<{ submission_id: string }>(
    `insert into submissions (activity_id, user_id, body, submitted_at)
     values ($1, $2, $3::jsonb, now())
     returning submission_id`,
    [params.activityId, params.userId, JSON.stringify(params.body)],
  )
  return rows[0].submission_id
}
