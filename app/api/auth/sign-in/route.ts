import { NextResponse } from "next/server"
import { z } from "zod"
import { authenticate } from "@/lib/sign-in"
import { createSession } from "@/lib/auth"

const Body = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST(request: Request) {
  const json = await request.json().catch(() => null)
  const parsed = Body.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid payload." }, { status: 400 })
  }

  const result = await authenticate(parsed.data.email, parsed.data.password)
  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 401 })
  }

  await createSession(result.userId)
  return NextResponse.json({ success: true })
}
