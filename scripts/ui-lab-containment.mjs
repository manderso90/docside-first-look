// Containment capture for the First Look UI lab (plan: ui-lab; review adj. 2).
//
// Proves "no existing screen changed" as a script/artifact check — no
// committed baselines. Boots a hermetic memory-store dev server, walks the
// participant journey with the same interactions as tests/e2e/journey.spec.ts,
// and saves DETERMINISTIC full-page screenshots (reduced motion, animations
// disabled, caret hidden, fonts settled) for every existing screen, plus the
// 404 page and /ui-lab — which must render as that same 404 while the
// FL_UI_LAB gate is closed.
//
//   node scripts/ui-lab-containment.mjs scratch/ui-lab-baseline   # before
//   node scripts/ui-lab-containment.mjs scratch/ui-lab-after      # after
//   diff -rq -x '*03-ui-lab-gate*' scratch/ui-lab-baseline scratch/ui-lab-after
//
// The 03-ui-lab-gate frame is the ONE expected difference and is excluded
// from the identical-set: before the lab existed, /ui-lab fell through to the
// [code] invite catch-all (invalid code → /link-inactive); now it is a gated
// 404. No agent ever reaches /ui-lab (URLs come only from invite links), so
// the only behavioral delta is that the literal token "ui-lab" stopped being
// an invalid invite code. Eyeball the frame instead: closed-lab notice (dev)
// / not-found (prod).
//
// Each viewport gets a fresh server (the memory store's single participant
// walks forward only). Wall time ~2–3 min.

import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "@playwright/test";

const OUT = process.argv[2];
if (!OUT) {
  console.error("usage: node scripts/ui-lab-containment.mjs <outDir>");
  process.exit(1);
}
mkdirSync(OUT, { recursive: true });

const PORT = 4390;
const BASE = `http://localhost:${PORT}`;
const SERVER_ENV = {
  ...process.env,
  // Memory store, like the e2e servers — .env.local's Supabase creds would
  // silently flip the store otherwise.
  SUPABASE_URL: "",
  SUPABASE_SERVICE_ROLE_KEY: "",
  NEXT_DIST_DIR: ".next-e2e-containment",
  FOUNDER_VIDEO_URL: "",
  FOUNDER_VIDEO_CAPTIONS_URL: "",
  SCHEDULE_URL: "https://schedule.example.invalid/morris",
  APP_HANDOFF_URL: "",
  // The point of the exercise: existing screens as agents see them — gate closed.
  FL_UI_LAB: "",
  DOCSIDE_FIXTURES_DIR: "",
};

function startServer() {
  const child = spawn("pnpm", ["dev", "--port", String(PORT)], {
    env: SERVER_ENV,
    stdio: "ignore",
    detached: true,
  });
  return child;
}
function stopServer(child) {
  try {
    process.kill(-child.pid, "SIGTERM");
  } catch {
    /* already gone */
  }
}
async function waitForServer() {
  for (let i = 0; i < 120; i++) {
    try {
      const res = await fetch(BASE, { redirect: "manual" });
      if (res.status < 500) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("dev server did not come up on " + BASE);
}

async function settle(page) {
  // The Next.js dev-tools indicator (bottom-left) animates with compile
  // activity — hide it, it is not product UI. Re-added per navigation.
  await page.addStyleTag({
    content: "nextjs-portal, #__next-build-watcher { display: none !important; }",
  });
  await page.evaluate(async () => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    await document.fonts.ready;
  });
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(300);
}
async function shot(page, name, tag) {
  await settle(page);
  await page.screenshot({
    path: join(OUT, `${tag}-${name}.png`),
    fullPage: true,
    animations: "disabled",
    caret: "hide",
  });
  console.log(`  ✓ ${tag}-${name}`);
}

async function walk(viewport, tag) {
  const server = startServer();
  try {
    await waitForServer();
    const browser = await chromium.launch();
    const context = await browser.newContext({
      viewport,
      reducedMotion: "reduce",
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();

    // Public / out-of-flow surfaces
    await page.goto(`${BASE}/`);
    await shot(page, "00-root", tag);
    await page.goto(`${BASE}/link-inactive`);
    await shot(page, "01-link-inactive", tag);
    await page.goto(`${BASE}/definitely-not-a-route-xyz`);
    await shot(page, "02-not-found", tag);
    // Gate: while FL_UI_LAB is unset this must be pixel-identical to 02.
    await page.goto(`${BASE}/ui-lab`);
    await shot(page, "03-ui-lab-gate", tag);

    // Journey (same interactions as tests/e2e/journey.spec.ts)
    await page.goto(`${BASE}/dev-preview-morris`);
    await page.waitForURL(/\/welcome$/);
    await shot(page, "10-welcome", tag);
    await page.getByRole("button", { name: /Begin My Docside Preview|Continue My Preview/ }).click();

    await page.waitForURL(/\/first-impression$/);
    await shot(page, "11-first-impression", tag);
    await page
      .locator('textarea[name="answer"]')
      .fill("It looks like it reads offer documents and shows the key terms.");
    await page.getByRole("button", { name: "Continue" }).click();

    await page.waitForURL(/\/video$/);
    await shot(page, "12-video", tag);
    await page.getByRole("button", { name: "Continue" }).click();

    await page.waitForURL(/\/scenario$/);
    await shot(page, "13-scenario", tag);
    await page.getByRole("button", { name: "Open the Oakview offers" }).click();

    await page.waitForURL(/\/workspace$/);
    await shot(page, "14-workspace", tag);
    await page.goto(`${BASE}/missions-complete`);

    await page.waitForURL(/\/debrief$/);
    const part = (n) => page.getByText(`${n} of 8`).waitFor();
    await part(1);
    await shot(page, "15-debrief-p1", tag);
    await page.locator('textarea[name="text"]').fill("It reads the offers.");
    await page.getByRole("button", { name: "Continue" }).click();
    await part(2);
    await page.getByRole("radio", { name: "Comparing multiple offers" }).check();
    await shot(page, "16-debrief-p2", tag);
    await page.getByRole("button", { name: "Continue" }).click();
    await part(3);
    await page.locator('textarea[name="text"]').fill("Nothing yet.");
    await page.getByRole("button", { name: "Continue" }).click();
    await part(4);
    await page.getByRole("radio", { name: "Before presenting to the seller" }).check();
    await page.getByRole("button", { name: "Continue" }).click();
    await part(5);
    await page.getByRole("button", { name: "Continue" }).click(); // p5 empty ok
    await part(6);
    await page.locator('textarea[name="text"]').fill("Counteroffer tracking.");
    await page.getByRole("button", { name: "Continue" }).click();
    await part(7);
    await page.getByRole("radio", { name: "Yes, after certain improvements" }).check();
    await page.getByRole("button", { name: "Continue" }).click();
    await part(8);
    await shot(page, "17-debrief-p8", tag);
    await page.locator('textarea[name="text"]').fill("Good start.");
    await page.getByRole("button", { name: "Finish" }).click();

    await page.waitForURL(/\/thank-you$/);
    await shot(page, "18-thank-you", tag);

    await browser.close();
  } finally {
    stopServer(server);
    // give the port a moment to free before the next walk
    await new Promise((r) => setTimeout(r, 2000));
  }
}

console.log(`Capturing to ${OUT} …`);
await walk({ width: 1280, height: 900 }, "desktop");
await walk({ width: 375, height: 667 }, "mobile");
console.log("Done.");
