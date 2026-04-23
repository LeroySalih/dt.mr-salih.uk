import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { hashPassword } from "@/lib/auth"
import { query } from "@/lib/db"
import { authenticate } from "@/lib/sign-in"

const TEST_EMAIL = `dt-test-${Date.now()}@example.invalid`
const TEST_PASSWORD = "hunter2-strong-password"
let userId: string

beforeAll(async () => {
  const hash = await hashPassword(TEST_PASSWORD)
  const { rows } = await query<{ user_id: string }>(
    `insert into profiles (user_id, email, password_hash, is_teacher)
     values (gen_random_uuid()::text, $1, $2, false)
     returning user_id`,
    [TEST_EMAIL, hash],
  )
  userId = rows[0].user_id
})

afterAll(async () => {
  // Cleanup
  await query(`delete from profiles where email = $1`, [TEST_EMAIL])
})

describe("authenticate", () => {
  it("returns success and the user id when credentials match", async () => {
    const result = await authenticate(TEST_EMAIL, TEST_PASSWORD)
    expect(result.success).toBe(true)
    if (result.success) expect(result.userId).toBe(userId)
  })

  it("fails with wrong password", async () => {
    const result = await authenticate(TEST_EMAIL, "not-the-password")
    expect(result.success).toBe(false)
  })

  it("fails with unknown email", async () => {
    const result = await authenticate(`nobody-${Date.now()}@example.invalid`, "x")
    expect(result.success).toBe(false)
  })

  it("email is case-insensitive", async () => {
    const result = await authenticate(TEST_EMAIL.toUpperCase(), TEST_PASSWORD)
    expect(result.success).toBe(true)
  })
})
