import { describe, it, expect } from "vitest"
import { hashPassword, verifyPassword } from "@/lib/auth"

describe("lib/auth password helpers", () => {
  it("hashPassword produces a bcrypt hash that verifyPassword accepts", async () => {
    const hash = await hashPassword("correct horse battery staple")
    expect(hash).toMatch(/^\$2[aby]?\$/)
    expect(await verifyPassword("correct horse battery staple", hash)).toBe(true)
    expect(await verifyPassword("wrong password", hash)).toBe(false)
  })
})
