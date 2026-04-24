import { test, expect } from "@playwright/test"

test("sign-in page renders", async ({ page }) => {
  await page.goto("/sign-in")
  await expect(page.locator(".signin-card")).toBeVisible()
  await expect(page.getByPlaceholder("you@school.org")).toBeVisible()
})

test("profile page redirects anonymous users to sign-in", async ({ page }) => {
  await page.goto("/profile")
  await expect(page).toHaveURL(/\/sign-in/)
})

test("floating auth button shows Sign in when anonymous", async ({ page }) => {
  await page.goto("/")
  await expect(page.locator(".fab-signed-out")).toBeVisible()
})

test("/api/auth/me returns signedIn:false when anonymous", async ({ page }) => {
  const res = await page.request.get("/api/auth/me")
  expect(res.status()).toBe(200)
  const data = await res.json()
  expect(data.signedIn).toBe(false)
})
