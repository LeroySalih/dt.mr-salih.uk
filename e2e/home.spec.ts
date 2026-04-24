import { test, expect } from "@playwright/test"

test("landing page renders topic cards from dino", async ({ page }) => {
  await page.goto("/")
  // Hero text
  await expect(page.locator("h1")).toContainText(/smash|GCSE revision/i)
  // At least 10 topic cards (live DB has ~39)
  const cards = page.locator(".card")
  await expect.poll(async () => await cards.count(), { timeout: 15_000 }).toBeGreaterThan(10)
})

test("search filters the grid", async ({ page }) => {
  await page.goto("/")
  // Wait for cards to load first
  await expect.poll(async () => await page.locator(".card").count(), { timeout: 15_000 }).toBeGreaterThan(10)
  const initial = await page.locator(".card").count()
  await page.getByPlaceholder(/search topics/i).fill("technology")
  // Fewer cards after filtering
  await expect.poll(async () => await page.locator(".card").count(), { timeout: 10_000 }).toBeLessThan(initial)
})

test("filter chip Systems narrows to systems band only", async ({ page }) => {
  await page.goto("/")
  // Wait for cards to load first
  await expect.poll(async () => await page.locator(".card").count(), { timeout: 15_000 }).toBeGreaterThan(10)
  await page.getByRole("button", { name: "Systems" }).click()
  const tags = await page.locator(".section-tag").allTextContents()
  for (const t of tags) {
    expect(t.toLowerCase()).not.toContain("core")
  }
})
