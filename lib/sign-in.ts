import { query } from "@/lib/db"
import { verifyPassword } from "@/lib/auth"

export type AuthResult =
  | { success: true; userId: string }
  | { success: false; userId: null; error: string }

export async function authenticate(rawEmail: string, password: string): Promise<AuthResult> {
  const email = rawEmail.trim().toLowerCase()
  if (!email || !password) {
    return { success: false, userId: null, error: "Email and password are required." }
  }

  const { rows } = await query<{ user_id: string; password_hash: string | null }>(
    `select user_id, password_hash from profiles where lower(email) = lower($1) limit 1`,
    [email],
  )
  const profile = rows[0]
  if (!profile?.password_hash) {
    return { success: false, userId: null, error: "Invalid email or password." }
  }

  const ok = await verifyPassword(password, profile.password_hash)
  if (!ok) {
    return { success: false, userId: null, error: "Invalid email or password." }
  }
  return { success: true, userId: profile.user_id }
}
