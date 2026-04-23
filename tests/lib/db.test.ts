import { describe, it, expect, vi } from "vitest"

describe("lib/db", () => {
  it("query throws when DATABASE_URL is missing", async () => {
    vi.stubEnv("DATABASE_URL", "")
    vi.resetModules()
    const { query } = await import("@/lib/db")
    await expect(query("select 1")).rejects.toThrow(/DATABASE_URL/i)
    vi.unstubAllEnvs()
  })
})
