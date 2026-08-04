/**
 * Regenerate the First Look Screen 2 capture asset from the live /intro route.
 *
 * Captures the most informative first-impression state — Multiple Offer
 * Comparison selected, upload area visible — at a 16:10 canvas so nothing is
 * cropped by Screen 2's object-cover/object-top frame
 * (src/app/first-impression/page.tsx).
 *
 * Usage:
 *   1. Build + serve the app:  pnpm build && PORT=3111 pnpm start
 *   2. node scripts/capture-intro.mjs [baseUrl]
 *
 * Output: public/docside-intro-capture.png
 *
 * Playwright's browser is pre-provisioned in the cloud env at
 * $PLAYWRIGHT_BROWSERS_PATH; the global `playwright` package is resolved via
 * NODE_PATH when run there. Locally, `pnpm add -D playwright` works too.
 */
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const BASE = process.argv[2] || "http://localhost:3111";
const OUT = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "public",
  "docside-intro-capture.png",
);

// 16:10 at 2x for a crisp asset (Screen 2 frames it responsively).
const WIDTH = 1600;
const HEIGHT = 1000;

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: WIDTH, height: HEIGHT },
  deviceScaleFactor: 2,
});

await page.goto(`${BASE}/intro`, { waitUntil: "networkidle" });

// Select "Multiple Offer Comparison" and wait for its upload area to reveal.
await page.getByRole("radio", { name: /Multiple Offer Comparison/i }).click();
await page.getByText("Upload two or more purchase agreements").waitFor();

// Let the fadeIn settle before the shot.
await page.waitForTimeout(500);

await page.screenshot({ path: OUT, clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT } });
await browser.close();

console.log(`Saved ${OUT}`);
