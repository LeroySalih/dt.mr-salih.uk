import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getAuthenticatedProfile } from "@/lib/auth"

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const profile = await getAuthenticatedProfile()
  if (!profile) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 })
  }
  const { id: activityId } = await context.params

  const { rows } = await query<{
    feedback_text: string | null
    score: number | null
    source: string
    created_at: string
  }>(
    `
      select feedback_text, score, source, created_at
      from pupil_activity_feedback
      where activity_id = $1 and pupil_id = $2
      order by
        case source
          when 'teacher' then 0
          when 'ai' then 1
          when 'auto' then 2
          else 3
        end,
        created_at desc
      limit 1
    `,
    [activityId, profile.userId],
  )

  const row = rows[0]
  if (!row) {
    return NextResponse.json({ status: "pending" })
  }
  return NextResponse.json({
    status: "ready",
    source: row.source,
    feedback: row.feedback_text,
    score: row.score,
  })
}
