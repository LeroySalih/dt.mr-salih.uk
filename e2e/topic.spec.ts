import { test, expect } from "@playwright/test"

test("topic page renders StudyNotes layout", async ({ page }) => {
  // First get a topic code from the API
  const res = await page.request.get("/api/topics")
  const data = await res.json()
  const firstCoded = data.topics.find((t: { code: string }) => t.code.length > 0)
  expect(firstCoded).toBeTruthy()

  await page.goto(`/topic/${firstCoded.code}`)
  await expect(page.locator(".notes-hero")).toBeVisible()
  await expect(page.locator(".notes-toc")).toBeVisible()
  // The CTA footer with Flashcards/Quiz buttons
  await expect(page.getByRole("button", { name: /Flashcards/i })).toBeVisible()
})

test("Explain button hidden for anonymous users", async ({ page }) => {
  const res = await page.request.get("/api/topics")
  const data = await res.json()
  const firstCoded = data.topics.find((t: { code: string }) => t.code.length > 0)
  await page.goto(`/topic/${firstCoded.code}`)
  await expect(page.getByRole("button", { name: /Explain/i })).toHaveCount(0)
})
