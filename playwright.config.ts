import { defineConfig, devices } from "@playwright/test";

/**
 * E2E for the First Look shell (docside pre-deploy discipline: pnpm test:e2e).
 *
 * Unlike docside, these tests drive LOCAL dev servers, not a deployment:
 * prod invite links stay intentionally inactive until Phase 5 wiring, and
 * dev is where the memory store's /dev-preview-morris invite exists.
 *
 * Two servers, one per project, because the memory store is per-instance
 * and the journey mutates the single dev participant's state:
 *  - desktop (4381): FOUNDER_VIDEO_URL stripped → deterministic, offline-safe
 *    fallback assertions (the BRIEF §5.3 "never dead-ends" AC).
 *  - mobile-375 (4382): env inherited → real player; also writes the 375px
 *    visual-pass screenshots to test-results/screens-375/.
 *  - handoff-interstitial (4383): APP_HANDOFF_URL points nowhere on purpose.
 *  - events-store (4384): OPT-IN, and the only one on a real database — see
 *    the storage-project block below.
 */

/**
 * Opt-in storage project (events-store.spec.ts). Every other server here
 * forces the per-instance memory store, which can accept an event but cannot
 * prove it was written. Set both vars — pointing at a LOCAL Supabase, never
 * the production project — and the fourth server boots on the real
 * SupabaseStore so the write path can be asserted against real Postgres:
 *
 *   FIRST_LOOK_LOCAL_SUPABASE_URL=http://127.0.0.1:54321 \
 *   FIRST_LOOK_LOCAL_SUPABASE_SERVICE_ROLE_KEY=<local demo key> \
 *     pnpm test:e2e --project=events-store
 *
 * Unset (the default), neither the project nor its server exists, so the
 * suite runs exactly as it did before.
 */
const STORE_URL = process.env.FIRST_LOOK_LOCAL_SUPABASE_URL;
const STORE_KEY = process.env.FIRST_LOOK_LOCAL_SUPABASE_SERVICE_ROLE_KEY;
const storeProjectEnabled = Boolean(STORE_URL && STORE_KEY);

/** Specs that belong to a dedicated project, never to desktop/mobile. */
const DEDICATED_SPECS = /(workspace-interstitial|events-store)\.spec\.ts/;

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: /.*\.spec\.ts/,
  timeout: 90_000,
  expect: { timeout: 10_000 },
  // One worker — tests walk a shared per-server participant state in order.
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? "list" : [["list"], ["html", { open: "never" }]],
  use: {
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "desktop",
      testIgnore: DEDICATED_SPECS,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "http://localhost:4381",
        // Mic permission NOT granted: getUserMedia rejects deterministically,
        // exercising Part 8's quiet no-mic fallback (the happy recording path
        // needs a real mic and stays a manual check — headless shell has no
        // media stack, so it can't be automated honestly here).
      },
    },
    {
      name: "mobile-375",
      testIgnore: DEDICATED_SPECS,
      use: {
        browserName: "chromium",
        viewport: { width: 375, height: 667 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
        baseURL: "http://localhost:4382",
      },
    },
    {
      // The handoff interstitial needs APP_HANDOFF_URL set — its server
      // points at an unreachable host so the mint-failure path is the one
      // under test (see workspace-interstitial.spec.ts).
      name: "handoff-interstitial",
      testMatch: /workspace-interstitial\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "http://localhost:4383",
      },
    },
    // Opt-in only (see STORE_URL above): the real SupabaseStore against a
    // local Supabase, so the event's storage can be asserted rather than
    // inferred from a 200.
    ...(storeProjectEnabled
      ? [
          {
            name: "events-store",
            testMatch: /events-store\.spec\.ts/,
            use: {
              ...devices["Desktop Chrome"],
              baseURL: "http://localhost:4384",
            },
          },
        ]
      : []),
  ],
  webServer: [
    {
      command: "pnpm dev --port 4381",
      url: "http://localhost:4381",
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        // Force the memory store: .env.local now carries Supabase creds
        // (Phase 4 S1), but this suite is DESIGNED for the per-instance
        // memory store and its /dev-preview-morris invite.
        SUPABASE_URL: "",
        SUPABASE_SERVICE_ROLE_KEY: "",
        NEXT_DIST_DIR: ".next-e2e-desktop",
        FOUNDER_VIDEO_URL: "",
        FOUNDER_VIDEO_CAPTIONS_URL: "",
        SCHEDULE_URL: "https://schedule.example.invalid/morris",
        // events-api.spec.ts exercises the Phase 4 CORS contract against
        // this server; the value is the prod app origin's stand-in.
        ALLOWED_EVENT_ORIGIN: "https://app.docside.ai",
      },
    },
    {
      command: "pnpm dev --port 4382",
      url: "http://localhost:4382",
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        // Force the memory store: .env.local now carries Supabase creds
        // (Phase 4 S1), but this suite is DESIGNED for the per-instance
        // memory store and its /dev-preview-morris invite.
        SUPABASE_URL: "",
        SUPABASE_SERVICE_ROLE_KEY: "",
        NEXT_DIST_DIR: ".next-e2e-mobile",
        SCHEDULE_URL: "https://schedule.example.invalid/morris",
      },
    },
    {
      command: "pnpm dev --port 4383",
      url: "http://localhost:4383",
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        // Force the memory store: .env.local now carries Supabase creds
        // (Phase 4 S1), but this suite is DESIGNED for the per-instance
        // memory store and its /dev-preview-morris invite.
        SUPABASE_URL: "",
        SUPABASE_SERVICE_ROLE_KEY: "",
        NEXT_DIST_DIR: ".next-e2e-handoff",
        FOUNDER_VIDEO_URL: "",
        FOUNDER_VIDEO_CAPTIONS_URL: "",
        SCHEDULE_URL: "https://schedule.example.invalid/morris",
        // Unreachable by design: provision fails on Continue, so the
        // interstitial's mint-failure path is exercised with no real app.
        APP_HANDOFF_URL: "http://127.0.0.1:9",
        FIRST_LOOK_PROVISION_SECRET: "e2e-synthetic-secret",
      },
    },
    ...(storeProjectEnabled
      ? [
          {
            command: "pnpm dev --port 4384",
            url: "http://localhost:4384",
            reuseExistingServer: false,
            timeout: 120_000,
            env: {
              // The ONLY server here that runs the production store class.
              // events-store.spec.ts refuses a non-loopback URL.
              SUPABASE_URL: STORE_URL!,
              SUPABASE_SERVICE_ROLE_KEY: STORE_KEY!,
              NEXT_DIST_DIR: ".next-e2e-store",
              FOUNDER_VIDEO_URL: "",
              FOUNDER_VIDEO_CAPTIONS_URL: "",
              SCHEDULE_URL: "https://schedule.example.invalid/morris",
              ALLOWED_EVENT_ORIGIN: "https://app.docside.ai",
            },
          },
        ]
      : []),
  ],
});
