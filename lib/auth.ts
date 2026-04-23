import { randomBytes, randomUUID } from "node:crypto"
import { cookies, headers } from "next/headers"
import bcrypt from "bcryptjs"
import { query } from "@/lib/db"

const SESSION_COOKIE = "dt_session"
const SESSION_TTL_MS = 60 * 60 * 1000 // 1 hour rolling
const BCRYPT_COST = 10

export type Profile = {
  userId: string
  email: string | null
  firstName: string | null
  lastName: string | null
  isTeacher: boolean
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, BCRYPT_COST)
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}

function cookieSecure() {
  return process.env.NODE_ENV === "production"
}

function cookieDomain() {
  const d = process.env.COOKIE_DOMAIN
  return d && d.length > 0 ? d : undefined
}

async function setSessionCookie(sessionId: string, token: string, expiresAt: Date) {
  const store = await cookies()
  store.set({
    name: SESSION_COOKIE,
    value: `${sessionId}.${token}`,
    httpOnly: true,
    sameSite: "lax",
    secure: cookieSecure(),
    domain: cookieDomain(),
    path: "/",
    expires: expiresAt,
  })
}

async function clearSessionCookie() {
  try {
    const store = await cookies()
    store.set({
      name: SESSION_COOKIE,
      value: "",
      httpOnly: true,
      sameSite: "lax",
      secure: cookieSecure(),
      domain: cookieDomain(),
      path: "/",
      maxAge: 0,
    })
  } catch {
    // Mutation may be disallowed in RSC; best-effort.
  }
}

function parseSessionCookie(raw: string | undefined | null) {
  if (!raw) return null
  const [sessionId, token] = raw.split(".")
  if (!sessionId || !token) return null
  return { sessionId, token }
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url")
  const tokenHash = await bcrypt.hash(token, BCRYPT_COST)
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS)
  const headerList = await headers()
  const ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null
  const userAgent = headerList.get("user-agent") ?? null

  const sessionId = randomUUID()
  await query(
    `insert into auth_sessions (session_id, user_id, token_hash, expires_at, ip, user_agent)
     values ($1, $2, $3, $4, $5, $6)`,
    [sessionId, userId, tokenHash, expiresAt.toISOString(), ip, userAgent],
  )

  await setSessionCookie(sessionId, token, expiresAt)
}

export async function endSession() {
  const store = await cookies()
  const parsed = parseSessionCookie(store.get(SESSION_COOKIE)?.value ?? null)
  if (parsed?.sessionId) {
    await query("delete from auth_sessions where session_id = $1", [parsed.sessionId])
  }
  await clearSessionCookie()
}

export async function getAuthenticatedProfile(): Promise<Profile | null> {
  const store = await cookies()
  const parsed = parseSessionCookie(store.get(SESSION_COOKIE)?.value ?? null)
  if (!parsed) return null

  const { rows } = await query<{
    session_id: string
    user_id: string
    token_hash: string
    expires_at: string
  }>(
    `select session_id, user_id, token_hash, expires_at from auth_sessions where session_id = $1 limit 1`,
    [parsed.sessionId],
  )
  const session = rows[0]
  if (!session) {
    await clearSessionCookie()
    return null
  }

  const expiresAt = new Date(session.expires_at)
  if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) {
    await query("delete from auth_sessions where session_id = $1", [parsed.sessionId])
    await clearSessionCookie()
    return null
  }

  const matches = await bcrypt.compare(parsed.token, session.token_hash)
  if (!matches) {
    await query("delete from auth_sessions where session_id = $1", [parsed.sessionId])
    await clearSessionCookie()
    return null
  }

  const { rows: profileRows } = await query<{
    user_id: string
    email: string | null
    is_teacher: boolean | null
    first_name: string | null
    last_name: string | null
  }>(
    `select user_id, email, is_teacher, first_name, last_name from profiles where user_id = $1 limit 1`,
    [session.user_id],
  )
  const p = profileRows[0]
  if (!p) return null

  return {
    userId: p.user_id,
    email: p.email,
    firstName: p.first_name,
    lastName: p.last_name,
    isTeacher: Boolean(p.is_teacher),
  }
}
