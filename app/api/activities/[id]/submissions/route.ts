import { NextResponse } from "next/server"
import { z } from "zod"
import { query } from "@/lib/db"
import { getAuthenticatedProfile } from "@/lib/auth"
import { insertSubmission } from "@/lib/submissions"

const Body = z.object({
  type: z.enum(["multiple-choice-question", "short-text-question"]),
  body: z.record(z.string(), z.unknown()),
})

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const profile = await getAuthenticatedProfile()
  if (!profile) {
    return NextResponse.json({ success: false, error: "Sign in required." }, { status: 401 })
  }

  const { id: activityId } = await context.params
  const parsed = Body.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid payload." }, { status: 400 })
  }

  const { rows } = await query<{ type: string | null }>(
    `select type from activities where activity_id = $1`,
    [activityId],
  )
  if (!rows[0] || rows[0].type !== parsed.data.type) {
    return NextResponse.json({ success: false, error: "Activity type mismatch." }, { status: 400 })
  }

  const submissionId = await insertSubmission({
    activityId,
    userId: profile.userId,
    body: parsed.data.body,
  })

  return NextResponse.json({ success: true, submissionId })
}
