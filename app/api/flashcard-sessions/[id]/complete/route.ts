import { NextResponse } from "next/server"
import { z } from "zod"
import { query } from "@/lib/db"
import { getAuthenticatedProfile } from "@/lib/auth"

const Body = z.object({ correctCount: z.number().int().min(0) })

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const profile = await getAuthenticatedProfile()
  if (!profile) return NextResponse.json({ error: "unauthenticated" }, { status: 401 })
  const { id: sessionId } = await context.params

  const parsed = Body.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "invalid-payload" }, { status: 400 })

  const { rowCount } = await query(
    `update flashcard_sessions
     set status = 'completed', completed_at = now(), correct_count = $1
     where session_id = $2 and pupil_id = $3 and status = 'in_progress'`,
    [parsed.data.correctCount, sessionId, profile.userId],
  )
  return NextResponse.json({ ok: true, updated: rowCount })
}
