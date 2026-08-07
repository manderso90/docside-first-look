import { test, expect, type Page } from "@playwright/test";
import { DEV_INVITE, PARTICIPANT_NAME, checkpoint } from "./helpers";

/**
 * The seven-screen participant journey (BRIEF §4/§5) against the dev
 * memory store. One long test: the session rides an httpOnly cookie and
 * Playwright gives each test a fresh context, so the walk must not split.
 * The resume/guard tests after it intentionally use fresh contexts.
 */

async function fillDebriefText(page: Page, text: string) {
  await page.locator('textarea[name="text"]').fill(text);
}

async function expectPart(page: Page, n: number) {
  await expect(page.getByText(`${n} of 8`)).toBeVisible();
}

test("full participant journey: invite → seven screens → thank-you", async ({ page }, testInfo) => {
  test.setTimeout(300_000); // dev servers compile routes on first hit

  // ── Invite exchange (BRIEF §9): code exchanged, URL scrubbed ──
  await page.goto(DEV_INVITE);
  await expect(page).toHaveURL(/\/welcome$/);

  // ── Screen 1: personalized welcome ──
  await expect(
    page.getByRole("heading", { name: `Welcome, ${PARTICIPANT_NAME}.` }),
  ).toBeVisible();
  await expect(page.getByText("Morris invited you to privately preview")).toBeVisible();
  await expect(page.getByText("You were invited because of your experience")).toBeVisible();
  await expect(page.getByText("About 12 minutes")).toBeVisible();
  await expect(page.getByText("No preparation required")).toBeVisible();
  await expect(page.getByText("Honest criticism is encouraged")).toBeVisible();
  await checkpoint(page, testInfo, "10-welcome");
  await page.getByRole("button", { name: "Begin My Docside Preview" }).click();

  // ── Screen 2: first impression BEFORE any explanation ──
  await expect(page).toHaveURL(/\/first-impression$/);
  await expect(
    page.getByRole("heading", {
      name: "Based on what you see, what do you believe Docside does?",
    }),
  ).toBeVisible();
  const fiContinue = page.getByRole("button", { name: "Continue" });
  await expect(fiContinue).toBeDisabled();
  await expect(page.getByRole("button", { name: "Skip this question" })).toBeVisible();
  await checkpoint(page, testInfo, "11-first-impression");
  await page
    .locator('textarea[name="answer"]')
    .fill("It looks like it reads offer documents and shows the key terms.");
  await expect(fiContinue).toBeEnabled();
  await fiContinue.click();

  // ── Screen 3: founder video (or its no-dead-end fallback) ──
  await expect(page).toHaveURL(/\/video$/);
  await expect(page.getByText("A short note from Morris")).toBeVisible();
  if (testInfo.project.name === "desktop") {
    // Desktop server strips FOUNDER_VIDEO_URL: the four-beat text summary
    // must render and the flow must continue (BRIEF §5.3 states AC).
    await expect(page.getByText("early working version")).toBeVisible();
    await expect(page.locator("video")).toHaveCount(0);
  } else {
    await expect(page.locator("video")).toHaveCount(1);
  }
  await checkpoint(page, testInfo, "12-video");
  await page.getByRole("button", { name: "Continue" }).click();

  // ── Screen 4: the Oakview scenario briefing ──
  await expect(page).toHaveURL(/\/scenario$/);
  await expect(page.getByRole("heading", { name: "1248 Oakview Drive" })).toBeVisible();
  for (const buyer of ["Chen", "Reyes", "Okafor"]) {
    await expect(page.getByText(`Offer · ${buyer}`)).toBeVisible();
  }
  await expect(page.getByText("Your Preview: 1 of 4")).toBeVisible();
  // Early-version framing, verbatim (CLAUDE.md hard rule).
  await expect(
    page.getByText(
      "This is an early working version. Some portions are incomplete.",
    ),
  ).toBeVisible();
  await expect(page.getByText("nothing will actually be sent")).toBeVisible();
  await checkpoint(page, testInfo, "13-scenario");

  // ── Forward-only guard, mid-journey ──
  await page.goto("/debrief"); // can't skip ahead
  await expect(page).toHaveURL(/\/scenario$/);
  await page.goto("/first-impression"); // can't go back
  await expect(page).toHaveURL(/\/scenario$/);
  await page.goto("/welcome"); // welcome always re-anchors
  await expect(
    page.getByRole("heading", { name: `Welcome back, ${PARTICIPANT_NAME}.` }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Continue My Preview" }).click();
  await expect(page).toHaveURL(/\/scenario$/);

  // ── Screen 5 stand-in: workspace placeholder (pre-Phase 4) ──
  await page.getByRole("button", { name: "Open the Oakview offers" }).click();
  await expect(page).toHaveURL(/\/workspace$/);
  await expect(
    page.getByRole("heading", { name: "The missions run inside Docside itself." }),
  ).toBeVisible();
  await checkpoint(page, testInfo, "14-workspace");
  await page.getByRole("button", { name: "Continue to the debrief (dev only)" }).click();

  // ── Screen 6: the eight-part debrief (§7 wording is FINAL) ──
  await expect(page).toHaveURL(/\/debrief$/);
  await expect(page.getByText("Eight short questions.")).toBeVisible();

  // Part 1 — Understanding (open text)
  await expectPart(page, 1);
  await expect(
    page.getByText("how would you describe Docside to another real estate agent?"),
  ).toBeVisible();
  await checkpoint(page, testInfo, "15-debrief-p1");
  await fillDebriefText(page, "It reads the offers and lets me check every term.");
  await page.getByRole("button", { name: "Continue" }).click();

  // Part 2 — Value (single choice); Back must not strand the participant
  await expectPart(page, 2);
  await expect(page.getByRole("button", { name: "Back" })).toBeVisible();
  await page.getByRole("button", { name: "Back" }).click();
  await expectPart(page, 1);
  // Prior answer preserved (per-part save, latest wins)
  await expect(page.locator('textarea[name="text"]')).toHaveValue(
    "It reads the offers and lets me check every term.",
  );
  await fillDebriefText(page, "It reads the offers and lets me verify every term.");
  await page.getByRole("button", { name: "Continue" }).click();
  await expectPart(page, 2); // re-saving an answered part still advances
  await page.getByRole("radio", { name: "Comparing multiple offers" }).check();
  await checkpoint(page, testInfo, "16-debrief-p2");
  await page.getByRole("button", { name: "Continue" }).click();

  // Part 3 — Trust (open text; the non-leading wording)
  await expectPart(page, 3);
  await expect(
    page.getByText("Was there anything you saw that you would hesitate to rely upon?"),
  ).toBeVisible();
  await fillDebriefText(page, "The deposit figure on one offer.");
  await page.getByRole("button", { name: "Continue" }).click();

  // Part 4 — Workflow fit (single choice)
  await expectPart(page, 4);
  await page.getByRole("radio", { name: "Before presenting to the seller" }).check();
  await page.getByRole("button", { name: "Continue" }).click();

  // Part 5 — Friction (open; honestly empty is allowed — blunt silence is data)
  await expectPart(page, 5);
  await page.getByRole("button", { name: "Continue" }).click();

  // Part 6 — Missing capability
  await expectPart(page, 6);
  await fillDebriefText(page, "Counteroffer tracking.");
  await page.getByRole("button", { name: "Continue" }).click();

  // Part 7 — Commitment (single choice)
  await expectPart(page, 7);
  await page.getByRole("radio", { name: "Yes, after certain improvements" }).check();
  await page.getByRole("button", { name: "Continue" }).click();

  // Part 8 — Open response: type · record audio · schedule
  await expectPart(page, 8);
  const scheduleLink = page.getByRole("link", {
    name: "schedule a short conversation with Morris",
  });
  await expect(scheduleLink).toHaveAttribute(
    "href",
    "https://schedule.example.invalid/morris?ref=pr_dev0000",
  );
  await expect(
    page.getByText("Recording starts only when you press the button"),
  ).toBeVisible();
  if (testInfo.project.name === "desktop") {
    // No mic permission in this project: getUserMedia rejects, and the audio
    // option must disappear quietly — no error tone, typing still available
    // (BRIEF §7 Part 8 graceful degradation).
    await page.getByRole("button", { name: "Record an audio response" }).click();
    await expect(
      page.getByRole("button", { name: "Record an audio response" }),
    ).toHaveCount(0);
    await expect(page.locator('textarea[name="text"]')).toBeVisible();
    await expect(page.getByText(/error|denied|failed/i)).toHaveCount(0);
  }
  await checkpoint(page, testInfo, "17-debrief-p8");
  await fillDebriefText(page, "Good start. I would try it on a live listing.");
  await page.getByRole("button", { name: "Finish" }).click();

  // ── Screen 7: thank-you — true counts, no confetti ──
  await expect(page).toHaveURL(/\/thank-you$/);
  await expect(
    page.getByRole("heading", {
      name: `Thank you, ${PARTICIPANT_NAME}. You helped shape Docside.`,
    }),
  ).toBeVisible();
  await expect(page.getByText("Feedback submitted")).toBeVisible();
  await expect(page.getByText("Founding Preview Participant")).toBeVisible();
  await expect(page.getByText("Participant No. 007")).toBeVisible();
  await checkpoint(page, testInfo, "18-thank-you");
});

test("re-entry resumes: welcome re-anchors, then continues at the frontier", async ({ page }) => {
  await page.goto(DEV_INVITE);
  await expect(page).toHaveURL(/\/welcome$/);
  await expect(
    page.getByRole("heading", { name: `Welcome back, ${PARTICIPANT_NAME}.` }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Continue My Preview" }).click();
  await expect(page).toHaveURL(/\/thank-you$/);
});

test("completed participants cannot re-enter earlier screens", async ({ page }) => {
  await page.goto(DEV_INVITE);
  await page.getByRole("button", { name: "Continue My Preview" }).click();
  await expect(page).toHaveURL(/\/thank-you$/);
  for (const path of ["/first-impression", "/video", "/scenario", "/debrief"]) {
    await page.goto(path);
    await expect(page, `${path} is behind the frontier`).toHaveURL(/\/thank-you$/);
  }
});
