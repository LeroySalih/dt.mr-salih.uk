import { NextResponse } from "next/server"
import { z } from "zod"
import { query } from "@/lib/db"
import { getAuthenticatedProfile } from "@/lib/auth"

const Body = z.object({
  activityId: z.string().min(1), // the display-flashcards activity id (the deck)
  totalCards: z.number().int().min(1),
  doActivityId: z.string().min(1).optional(), // the do-flashcards activity id
})

export async function POST(request: Request) {
  const profile = await getAuthenticatedProfile()
  if (!profile) return NextResponse.json({ error: "unauthenticated" }, { status: 401 })

  const parsed = Body.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "invalid-payload" }, { status: 400 })

  const { rows } = await query<{ session_id: string }>(
    `insert into flashcard_sessions (pupil_id, activity_id, total_cards, do_activity_id)
     values ($1, $2, $3, $4)
     returning session_id`,
    [profile.userId, parsed.data.activityId, parsed.data.totalCards, parsed.data.doActivityId ?? null],
  )
  return NextResponse.json({ sessionId: rows[0].session_id })
}
