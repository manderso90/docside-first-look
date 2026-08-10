import { test, expect } from "@playwright/test";
import { DEV_INVITE, PARTICIPANT_NAME } from "./helpers";

/**
 * The workspace handoff interstitial (founder request 2026-08-09): with
 * APP_HANDOFF_URL configured, /workspace renders a briefing card and mints
 * ONLY when Continue is clicked. This project's server points the handoff at
 * an unreachable host, so the click exercises the full mint-failure path:
 * interstitial → Continue → calm try-again state → back to the interstitial.
 * (The happy path — a live docside in preview mode — stays covered by
 * docside's first-look-preview.spec.ts against the deployed app.)
 */

test("handoff interstitial: mint on click, calm retry on failure", async ({
  page,
}) => {
  test.setTimeout(300_000); // dev server compiles routes on first hit

  // Walk to the workspace boundary (same leg as the journey spec).
  await page.goto(DEV_INVITE);
  await expect(page).toHaveURL(/\/welcome$/);
  await expect(
    page.getByRole("heading", { name: new RegExp(`Welcome.*${PARTICIPANT_NAME}`) }),
  ).toBeVisible();
  await page.getByRole("button", { name: /My Docside Preview|Continue My Preview/ }).click();

  await expect(page).toHaveURL(/\/first-impression$/);
  await page.getByRole("button", { name: "Skip this question" }).click();

  await expect(page).toHaveURL(/\/video$/);
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page).toHaveURL(/\/scenario$/);
  await page.getByRole("button", { name: "Open the Oakview offers" }).click();

  // The interstitial: no mint has happened yet — reloading it is free.
  await expect(page).toHaveURL(/\/workspace$/);
  await expect(
    page.getByRole("heading", { name: /entering Docside itself/ }),
  ).toBeVisible();
  await expect(
    page.getByText("The banner inside Docside will bring you back here"),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: /entering Docside itself/ }),
  ).toBeVisible();

  // Continue → the mint fails against the unreachable app → try-again state.
  await page.getByRole("button", { name: "Continue to Docside" }).click();
  await expect(page).toHaveURL(/\/workspace\?retry=1$/);
  await expect(
    page.getByRole("heading", { name: /workspace didn.t connect/ }),
  ).toBeVisible();
  await expect(page.getByText("Nothing is lost")).toBeVisible();

  // Try again → back to the interstitial, still inside the mission window.
  await page.getByRole("link", { name: "Try again" }).click();
  await expect(
    page.getByRole("heading", { name: /entering Docside itself/ }),
  ).toBeVisible();
});
