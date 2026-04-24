import { NextResponse } from "next/server"
import { z } from "zod"
import { query } from "@/lib/db"
import { getAuthenticatedProfile } from "@/lib/auth"

const Body = z.object({
  term: z.string(),
  definition: z.string(),
  chosenDefinition: z.string(),
  isCorrect: z.boolean(),
  attemptNumber: z.number().int().min(1),
})

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const profile = await getAuthenticatedProfile()
  if (!profile) return NextResponse.json({ error: "unauthenticated" }, { status: 401 })
  const { id: sessionId } = await context.params

  const parsed = Body.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "invalid-payload" }, { status: 400 })

  // Ownership check
  const { rows } = await query<{ pupil_id: string }>(
    `select pupil_id from flashcard_sessions where session_id = $1`,
    [sessionId],
  )
  if (!rows[0] || rows[0].pupil_id !== profile.userId) {
    return NextResponse.json({ error: "not-found" }, { status: 404 })
  }

  await query(
    `insert into flashcard_attempts (session_id, term, definition, chosen_definition, is_correct, attempt_number)
     values ($1, $2, $3, $4, $5, $6)`,
    [sessionId, parsed.data.term, parsed.data.definition, parsed.data.chosenDefinition, parsed.data.isCorrect, parsed.data.attemptNumber],
  )
  return NextResponse.json({ ok: true })
}
