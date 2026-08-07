import { test, expect } from "@playwright/test";
import { REVOKED_INVITE, checkpoint } from "./helpers";

/**
 * Access control (BRIEF §5.1 revoked state, §9 token flow, AD-3).
 * These run before the journey spec (alphabetical order, one worker) and
 * create no sessions, so they leave the memory store untouched.
 */

test("root page is a quiet front door with no product pitch", async ({ page }, testInfo) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Docside First Look" }),
  ).toBeVisible();
  await expect(page.getByText("use the personal link")).toBeVisible();
  // No begin/signup affordance — participants only arrive via invite links.
  // (Scoped by name: Next dev injects its own devtools overlay button.)
  await expect(
    page.getByRole("button", { name: /begin|continue|start|sign|log/i }),
  ).toHaveCount(0);
  await expect(page.getByRole("link")).toHaveCount(0);
  await checkpoint(page, testInfo, "00-root");
});

test("unknown invite code lands on the calm inactive page, code not echoed", async ({ page }, testInfo) => {
  await page.goto("/this-code-does-not-exist");
  await expect(page).toHaveURL(/\/link-inactive$/);
  await expect(
    page.getByRole("heading", { name: "This preview link is no longer active." }),
  ).toBeVisible();
  await expect(page.locator("body")).not.toContainText("this-code-does-not-exist");
  await checkpoint(page, testInfo, "01-link-inactive");
});

test("revoked invite lands on the inactive page with no error styling", async ({ page }) => {
  await page.goto(REVOKED_INVITE);
  await expect(page).toHaveURL(/\/link-inactive$/);
  await expect(
    page.getByRole("heading", { name: "This preview link is no longer active." }),
  ).toBeVisible();
});

test("shell screens without a session redirect to link-inactive", async ({ page }) => {
  for (const path of ["/welcome", "/first-impression", "/video", "/scenario", "/workspace", "/debrief", "/thank-you"]) {
    await page.goto(path);
    await expect(page, `${path} should bounce cookieless visitors`).toHaveURL(
      /\/link-inactive$/,
    );
  }
});

test("responses carry the no-referrer and noindex headers", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.headers()["referrer-policy"]).toBe("no-referrer");
  expect(response?.headers()["x-robots-tag"]).toContain("noindex");
});
