import { expect, type Page, type TestInfo } from "@playwright/test";
import { mkdirSync } from "fs";
import { join } from "path";

/** Dev invite seeded by the memory store (src/lib/store/memory.ts). */
export const DEV_INVITE = "/dev-preview-morris";
export const REVOKED_INVITE = "/dev-revoked";
export const PARTICIPANT_NAME = "Angela";

/**
 * The 375px acceptance rule: no screen may scroll horizontally. A 1px
 * tolerance absorbs scrollbar rounding differences across platforms.
 */
export async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const el = document.documentElement;
    return el.scrollWidth - el.clientWidth;
  });
  expect(overflow, "page should not scroll horizontally").toBeLessThanOrEqual(1);
}

const SCREENS_DIR = join("test-results", "screens-375");

/**
 * Visual-pass capture: on the mobile project, save a full-page screenshot
 * per screen to test-results/screens-375/ for founder review. Every call
 * also asserts the no-horizontal-scroll rule on both projects.
 */
export async function checkpoint(
  page: Page,
  testInfo: TestInfo,
  name: string,
) {
  await expectNoHorizontalOverflow(page);
  if (testInfo.project.name === "mobile-375") {
    mkdirSync(SCREENS_DIR, { recursive: true });
    await page.screenshot({
      path: join(SCREENS_DIR, `${name}.png`),
      fullPage: true,
    });
  }
}
