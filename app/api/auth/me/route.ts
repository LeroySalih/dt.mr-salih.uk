import { NextResponse } from "next/server"
import { getAuthenticatedProfile } from "@/lib/auth"

export async function GET() {
  const p = await getAuthenticatedProfile()
  if (!p) return NextResponse.json({ signedIn: false })
  return NextResponse.json({
    signedIn: true,
    firstName: p.firstName,
    lastName: p.lastName,
    email: p.email,
  })
}
