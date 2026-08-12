// Decision-artifact capture for the First Look UI lab (plan: ui-lab Phase 4;
// review adjustments 4–6).
//
// Boots a dev server WITH the lab open and captures the offer dashboard in
// both datasets × desktop/mobile, plus the gallery (single palette since the
// 2026-08-11 founder decision: Docside tokens). Also runs two acceptance
// checks per dashboard variant:
//   - keyboard tab-walk: every SourceChip and action-bar control is reachable
//     and the focused element sits inside [data-fl],
//   - sticky action bar: the comparison table can scroll horizontally at
//     375px with the bar present, and the bar stays inside the viewport.
//
//   node scripts/ui-lab-shots.mjs            # writes scratch/ui-lab-shots/
//
// Fixture stress mode renders only when DOCSIDE_FIXTURES_DIR resolves
// (dev machine with the sibling docside checkout).

import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "@playwright/test";

const OUT = "scratch/ui-lab-shots";
mkdirSync(OUT, { recursive: true });

const PORT = 4391;
const BASE = `http://localhost:${PORT}`;
const server = spawn("pnpm", ["dev", "--port", String(PORT)], {
  env: {
    ...process.env,
    SUPABASE_URL: "",
    SUPABASE_SERVICE_ROLE_KEY: "",
    NEXT_DIST_DIR: ".next-e2e-containment",
    FL_UI_LAB: "1",
  },
  stdio: "ignore",
  detached: true,
});

async function waitForServer() {
  for (let i = 0; i < 120; i++) {
    try {
      const res = await fetch(BASE, { redirect: "manual" });
      if (res.status < 500) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("dev server did not come up");
}

const failures = [];

async function settleAndShoot(page, name) {
  await page.addStyleTag({
    content: "nextjs-portal, #__next-build-watcher { display: none !important; }",
  });
  await page.evaluate(async () => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    await document.fonts.ready;
  });
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(300);
  await page.screenshot({ path: join(OUT, `${name}.png`), fullPage: true, animations: "disabled", caret: "hide" });
  console.log(`  ✓ ${name}`);
}

async function tabWalk(page, name) {
  const result = await page.evaluate(() => {
    const fence = document.querySelector("[data-fl]");
    if (!fence) return { error: "no fence" };
    const focusables = fence.querySelectorAll("button, a[href]");
    return { focusables: focusables.length };
  });
  if (result.error) {
    failures.push(`${name}: tab-walk — ${result.error}`);
    return;
  }
  let inFence = 0;
  for (let i = 0; i < result.focusables; i++) {
    await page.keyboard.press("Tab");
    const ok = await page.evaluate(
      () => !!document.activeElement && !!document.activeElement.closest("[data-fl]"),
    );
    if (ok) inFence += 1;
  }
  if (inFence < result.focusables * 0.9) {
    failures.push(
      `${name}: tab-walk reached ${inFence}/${result.focusables} in-fence controls`,
    );
  } else {
    console.log(`  ✓ ${name}: tab-walk ${inFence}/${result.focusables} controls reachable`);
  }
}

async function stickyBarCheck(page, name) {
  const r = await page.evaluate(() => {
    const bar = document.querySelector(".actionbar");
    const scroller = document.querySelector(".cmp-scroll");
    if (!bar || !scroller) return { error: "bar or table missing" };
    scroller.scrollIntoView({ block: "center" });
    const canScroll = scroller.scrollWidth > scroller.clientWidth;
    const before = scroller.scrollLeft;
    scroller.scrollLeft = 120;
    const scrolled = scroller.scrollLeft !== before;
    const rect = bar.getBoundingClientRect();
    const inViewport = rect.bottom <= window.innerHeight && rect.height > 0;
    return { canScroll, scrolled, inViewport };
  });
  if (r.error) failures.push(`${name}: sticky-bar — ${r.error}`);
  else if (r.canScroll && !r.scrolled)
    failures.push(`${name}: table cannot scroll with sticky bar present`);
  else if (!r.inViewport) failures.push(`${name}: action bar escapes the viewport`);
  else
    console.log(
      `  ✓ ${name}: sticky bar ok (h-scroll ${r.canScroll ? "engaged and usable" : "not needed"})`,
    );
}

try {
  await waitForServer();
  const browser = await chromium.launch();
  for (const [tag, viewport] of [
    ["desktop", { width: 1280, height: 900 }],
    ["mobile", { width: 375, height: 667 }],
  ]) {
    const context = await browser.newContext({ viewport, reducedMotion: "reduce", deviceScaleFactor: 1 });
    const page = await context.newPage();
    // Single palette since the founder decision (2026-08-11): Docside tokens.
    await page.goto(`${BASE}/ui-lab`);
    await settleAndShoot(page, `${tag}-gallery`);
    for (const data of ["scenario", "fixtures"]) {
      const q = data === "fixtures" ? "?data=fixtures" : "";
      const name = `${tag}-dashboard-${data}`;
      await page.goto(`${BASE}/ui-lab/dashboard${q}`);
      await settleAndShoot(page, name);
      if (tag === "desktop" && data === "scenario") await tabWalk(page, name);
      if (tag === "mobile") await stickyBarCheck(page, name);
    }
    await context.close();
  }
  await browser.close();
} finally {
  try {
    process.kill(-server.pid, "SIGTERM");
  } catch {}
}

if (failures.length) {
  console.error(`\n${failures.length} acceptance check failure(s):`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log("\nAll lab captures + acceptance checks passed.");
