import {
  test,
  expect,
  type APIRequestContext,
  type APIResponse,
  type BrowserContext,
  type Page,
} from "@playwright/test";
import { randomUUID } from "crypto";
import {
  DEV_INVITE,
  EXPIRED_INVITE,
  EXPIRING_INVITE,
  PARTICIPANT_NAME,
  REVOCABLE_INVITE,
  REVOKED_INVITE,
  SECOND_PARTICIPANT_NAME,
  SESSION_COOKIE,
} from "./helpers";

/**
 * Resumed-session invitation revalidation (security release, 2026-09-06).
 *
 * Before this release the shell authorized a resumed request on the mere
 * existence of the session row: `invites.revoked_at` / `expires_at` were
 * only ever read at the /[code] exchange, so a browser holding `fl_session`
 * kept full access for the cookie's 14-day life after the founder revoked
 * the invitation. Every case here drives the real HTTP surface of the
 * `revocation` server (memory store + the dev-gated fixture hook), never the
 * shared journey participant. Assertions wait on conditions, never on time.
 *
 * Denial vocabulary (src/lib/session.ts): a DEFINITIVE denial (revoked,
 * expired, unknown, malformed, mismatched) lands on /link-inactive with the
 * cookie expired — pages via the lookup-free /session-ended hop, route
 * handlers directly. A TRANSIENT denial (store outage) also lands on
 * /link-inactive but keeps the cookie so the participant recovers unaided.
 */

const HOOK = "/api/e2e-hooks";
const NOOR = SECOND_PARTICIPANT_NAME;
const INACTIVE_HEADING = "This preview link is no longer active.";
const PROTECTED_PAGES = [
  "/welcome",
  "/first-impression",
  "/video",
  "/scenario",
  "/workspace",
  "/debrief",
  "/thank-you",
];

async function hook(api: APIRequestContext, action: string) {
  const res = await api.post(HOOK, { data: { action } });
  expect(res.status(), `fixture hook "${action}"`).toBe(200);
  expect(await res.json()).toEqual({ ok: true });
}

async function sessionCookie(context: BrowserContext) {
  return (await context.cookies()).find((c) => c.name === SESSION_COOKIE);
}

/** Exchange an invite and prove the welcome rendered for the right person. */
async function redeem(page: Page, invitePath: string, firstName: string) {
  await page.goto(invitePath);
  await expect(page).toHaveURL(/\/welcome$/);
  await expect(
    page.getByRole("heading", { name: new RegExp(`^Welcome.*${firstName}\\.$`) }),
  ).toBeVisible();
  const cookie = await sessionCookie(page.context());
  expect(cookie, "the exchange sets fl_session").toBeDefined();
  return cookie!;
}

async function expectInactive(page: Page) {
  await expect(page).toHaveURL(/\/link-inactive$/);
  await expect(
    page.getByRole("heading", { name: INACTIVE_HEADING }),
  ).toBeVisible();
}

/** Denied, nothing about the participant on the page, and the cookie is gone. */
async function expectSignedOut(page: Page, firstName: string) {
  await expectInactive(page);
  await expect(page.locator("body")).not.toContainText(firstName);
  expect(await sessionCookie(page.context())).toBeUndefined();
}

function setCookieHeaders(res: APIResponse): string[] {
  return res
    .headersArray()
    .filter((h) => h.name.toLowerCase() === "set-cookie")
    .map((h) => h.value);
}

function sessionSetCookie(res: APIResponse): string | undefined {
  return setCookieHeaders(res).find((v) => v.startsWith(`${SESSION_COOKIE}=`));
}

/** The response expires fl_session with the same path/attributes it was set with. */
function expectExpiredCookie(res: APIResponse) {
  const clearing = sessionSetCookie(res);
  expect(clearing, "response must expire fl_session").toBeDefined();
  expect(clearing).toMatch(/max-age=0/i);
  expect(clearing).toMatch(/path=\//i);
  expect(clearing).toMatch(/httponly/i);
}

function locationPath(res: APIResponse, baseURL: string): string {
  return new URL(res.headers()["location"], baseURL).pathname;
}

test.beforeEach(async ({ request }) => {
  test.setTimeout(180_000); // dev server compiles routes on first hit
  await hook(request, "reset");
});

// ── Baseline: the legitimate paths still work ─────────────────────────────

test("active invitation: first redemption creates a session and lands on welcome", async ({
  page,
}) => {
  await redeem(page, REVOCABLE_INVITE, NOOR);
  // The personal note now comes from the invitation the resolution loaded.
  await expect(page.getByText("Synthetic revocation fixture.")).toBeVisible();
});

test("active invitation: cookie-only resumption keeps working", async ({
  page,
  browser,
}) => {
  const cookie = await redeem(page, REVOCABLE_INVITE, NOOR);

  // Direct, code-free navigation on the cookie alone.
  await page.goto("/welcome");
  await expect(
    page.getByRole("heading", { name: new RegExp(`^Welcome, ${NOOR}\\.$`) }),
  ).toBeVisible();

  // The legitimate "same device, later" case: a fresh browser carrying only
  // the cookie resumes too.
  const later = await browser.newContext();
  await later.addCookies([cookie]);
  const laterPage = await later.newPage();
  await laterPage.goto("/welcome");
  await expect(
    laterPage.getByRole("heading", { name: new RegExp(`^Welcome, ${NOOR}\\.$`) }),
  ).toBeVisible();
  await later.close();
});

test("revoked invitation: first redemption is denied and sets no cookie", async ({
  page,
}) => {
  await page.goto(REVOKED_INVITE);
  await expectInactive(page);
  expect(await sessionCookie(page.context())).toBeUndefined();
});

// ── The bypass this release closes ────────────────────────────────────────

test("revocation after redemption: the next refresh is denied and the cookie is cleared", async ({
  page,
}) => {
  await redeem(page, REVOCABLE_INVITE, NOOR);
  await hook(page.request, "revoke");
  await page.reload();
  await expectSignedOut(page, NOOR);
});

test("revocation: direct navigation to every protected page is denied", async ({
  page,
}) => {
  const cookie = await redeem(page, REVOCABLE_INVITE, NOOR);
  await hook(page.request, "revoke");
  for (const path of PROTECTED_PAGES) {
    // Re-present the revoked cookie each time so every page is proven to
    // deny THE REVOKED SESSION, not merely a cookieless visitor.
    await page.context().addCookies([cookie]);
    await page.goto(path);
    await expectSignedOut(page, NOOR);
  }
});

test("revocation: /missions-complete, /api/events and /api/audio are denied and expire the cookie", async ({
  page,
  baseURL,
}) => {
  const cookie = await redeem(page, REVOCABLE_INVITE, NOOR);
  await hook(page.request, "revoke");

  // Route handler: straight to /link-inactive, cookie expired on the response
  // itself (no hop needed), never cached.
  const missions = await page.request.get("/missions-complete", {
    maxRedirects: 0,
  });
  expect(missions.status()).toBe(307);
  expect(locationPath(missions, baseURL!)).toBe("/link-inactive");
  expectExpiredCookie(missions);
  expect(missions.headers()["cache-control"]).toContain("no-store");

  // API denials keep their established shape and status.
  await page.context().addCookies([cookie]);
  const events = await page.request.post("/api/events", {
    data: {
      event: "first_click",
      ts_client: new Date().toISOString(),
      properties: { element_id: "e", region: "r" },
    },
  });
  expect(events.status()).toBe(401);
  expect(await events.json()).toEqual({ error: "no session" });
  expectExpiredCookie(events);

  await page.context().addCookies([cookie]);
  const audio = await page.request.post("/api/audio", {
    headers: { "content-type": "audio/webm" },
    data: Buffer.from("not really audio"),
  });
  expect(audio.status()).toBe(401);
  expect(await audio.json()).toEqual({ error: "no session" });
  expectExpiredCookie(audio);
});

test("revocation: a fresh browser context carrying the revoked cookie is denied", async ({
  page,
  browser,
}) => {
  const cookie = await redeem(page, REVOCABLE_INVITE, NOOR);
  await hook(page.request, "revoke");

  const replay = await browser.newContext();
  await replay.addCookies([cookie]);
  const replayPage = await replay.newPage();
  await replayPage.goto("/welcome");
  await expectSignedOut(replayPage, NOOR);
  await replay.close();
});

test("revocation: two sessions minted from the same invitation are both denied", async ({
  browser,
}) => {
  const a = await browser.newContext();
  const b = await browser.newContext();
  const pageA = await a.newPage();
  const pageB = await b.newPage();

  const cookieA = await redeem(pageA, REVOCABLE_INVITE, NOOR);
  const cookieB = await redeem(pageB, REVOCABLE_INVITE, NOOR);
  expect(cookieA.value, "two redemptions → two session rows").not.toBe(cookieB.value);

  await hook(pageA.request, "revoke");
  await pageA.goto("/welcome");
  await expectSignedOut(pageA, NOOR);
  await pageB.goto("/welcome");
  await expectSignedOut(pageB, NOOR);

  await a.close();
  await b.close();
});

test("revocation: an unaffected second participant keeps access", async ({
  browser,
}) => {
  const angela = await browser.newContext();
  const noor = await browser.newContext();
  const angelaPage = await angela.newPage();
  const noorPage = await noor.newPage();

  await redeem(angelaPage, DEV_INVITE, PARTICIPANT_NAME);
  await redeem(noorPage, REVOCABLE_INVITE, NOOR);

  await hook(noorPage.request, "revoke");
  await noorPage.goto("/welcome");
  await expectSignedOut(noorPage, NOOR);

  await angelaPage.goto("/welcome");
  await expect(
    angelaPage.getByRole("heading", {
      name: new RegExp(`^Welcome, ${PARTICIPANT_NAME}\\.$`),
    }),
  ).toBeVisible();
  const events = await angelaPage.request.post("/api/events", {
    data: {
      event: "first_click",
      ts_client: new Date().toISOString(),
      properties: { element_id: "e", region: "r" },
    },
  });
  expect(events.status()).toBe(200);

  await angela.close();
  await noor.close();
});

test("a server action after revocation is denied and clears the cookie", async ({
  page,
}) => {
  await redeem(page, REVOCABLE_INVITE, NOOR);
  await hook(page.request, "revoke");
  // The welcome screen is still in the tab (rendered before revocation); its
  // button posts the beginPreview server action, which re-resolves the session.
  await page.getByRole("button", { name: "Begin My Docside Preview" }).click();
  await expectSignedOut(page, NOOR);
});

// ── Expiry ────────────────────────────────────────────────────────────────

test("expiry: an expired invitation is denied at the exchange, no cookie set", async ({
  page,
}) => {
  await page.goto(EXPIRED_INVITE);
  await expectInactive(page);
  expect(await sessionCookie(page.context())).toBeUndefined();
});

test("expiry: an invitation that expires after redemption is denied on resume, cookie cleared", async ({
  page,
}) => {
  await redeem(page, EXPIRING_INVITE, NOOR);
  await hook(page.request, "expire");
  await page.goto("/welcome");
  await expectSignedOut(page, NOOR);
});

// ── Cookie integrity ──────────────────────────────────────────────────────

test("a malformed (non-UUID) cookie is denied without a store lookup and cleared", async ({
  page,
  request,
  baseURL,
}) => {
  // With the store faulted, any lookup would surface as a TRANSIENT denial
  // that keeps the cookie. A definitive, cookie-clearing denial therefore
  // proves the malformed value never reached the store.
  await hook(request, "fault-on");
  await page.context().addCookies([
    { name: SESSION_COOKIE, value: "not-a-uuid", url: baseURL! },
  ]);
  const res = await page.request.get("/welcome", { maxRedirects: 0 });
  expect(res.status()).toBe(307);
  expect(locationPath(res, baseURL!)).toBe("/session-ended");

  await page.goto("/welcome");
  await expectInactive(page);
  expect(await sessionCookie(page.context())).toBeUndefined();
  await hook(request, "fault-off");
});

test("an unknown but well-formed UUID cookie is denied and cleared", async ({
  page,
  baseURL,
}) => {
  await page.context().addCookies([
    { name: SESSION_COOKIE, value: randomUUID(), url: baseURL! },
  ]);
  await page.goto("/welcome");
  await expectInactive(page);
  expect(await sessionCookie(page.context())).toBeUndefined();
});

test("a participant/invitation mismatch is denied and cleared", async ({
  page,
}) => {
  await redeem(page, REVOCABLE_INVITE, NOOR);
  await hook(page.request, "corrupt-session");
  await page.goto("/welcome");
  await expectSignedOut(page, NOOR);
  await expect(page.locator("body")).not.toContainText(PARTICIPANT_NAME);
});

test("a session whose invitation is missing is denied and cleared", async ({
  page,
}) => {
  await redeem(page, REVOCABLE_INVITE, NOOR);
  await hook(page.request, "orphan-session");
  await page.goto("/welcome");
  await expectSignedOut(page, NOOR);
});

// ── Transient failure ─────────────────────────────────────────────────────

test("a transient store failure denies the request, keeps the cookie, and recovers", async ({
  page,
  request,
  baseURL,
}) => {
  const cookie = await redeem(page, REVOCABLE_INVITE, NOOR);

  await hook(request, "fault-on");
  const res = await page.request.get("/welcome", { maxRedirects: 0 });
  expect(res.status()).toBe(307);
  // Straight to the inactive page — no clearing hop, no Set-Cookie.
  expect(locationPath(res, baseURL!)).toBe("/link-inactive");
  expect(sessionSetCookie(res)).toBeUndefined();
  await page.goto("/welcome");
  await expectInactive(page);
  expect((await sessionCookie(page.context()))?.value).toBe(cookie.value);

  await hook(request, "fault-off");
  await page.goto("/welcome");
  await expect(
    page.getByRole("heading", { name: new RegExp(`^Welcome, ${NOOR}\\.$`) }),
  ).toBeVisible();
  expect((await sessionCookie(page.context()))?.value).toBe(cookie.value);
});

// ── Denial mechanics ──────────────────────────────────────────────────────

test("definitive denial: exactly two hops, cookie expired on the hop, nothing leaked, no loop", async ({
  page,
  request,
  baseURL,
}) => {
  const cookie = await redeem(page, REVOCABLE_INVITE, NOOR);
  await hook(page.request, "revoke");

  // Hop 1: the page's own redirect (Server Components cannot touch cookies).
  const first = await page.request.get("/welcome", { maxRedirects: 0 });
  expect(first.status()).toBe(307);
  expect(locationPath(first, baseURL!)).toBe("/session-ended");
  expect(sessionSetCookie(first)).toBeUndefined();
  expect(await first.text()).not.toContain(NOOR);

  // Hop 2: the lookup-free clearing route.
  const second = await page.request.get("/session-ended", { maxRedirects: 0 });
  expect(second.status()).toBe(307);
  expect(locationPath(second, baseURL!)).toBe("/link-inactive");
  expectExpiredCookie(second);
  expect(second.headers()["cache-control"]).toBe("no-store");
  expect(await second.text()).not.toContain(NOOR);
  expect(await sessionCookie(page.context())).toBeUndefined();

  // Terminal: static, unauthenticated, no further redirect.
  const third = await page.request.get("/link-inactive", { maxRedirects: 0 });
  expect(third.status()).toBe(200);
  expect(await third.text()).not.toContain(NOOR);

  // No loop in either direction: the inactive page never bounces a revoked
  // cookie, and the hop without any cookie still lands in one step.
  await page.context().addCookies([cookie]);
  const inactive = await page.request.get("/link-inactive", { maxRedirects: 0 });
  expect(inactive.status()).toBe(200);
  const bareHop = await request.get("/session-ended", { maxRedirects: 0 });
  expect(bareHop.status()).toBe(307);
  expect(locationPath(bareHop, baseURL!)).toBe("/link-inactive");
});

test("/session-ended is a static route: precedes /[code], never caches, needs no store", async ({
  page,
  request,
  baseURL,
}) => {
  await redeem(page, REVOCABLE_INVITE, NOOR); // a VALID session

  // If /session-ended fell through to the /[code] exchange, this valid
  // cookie would be preserved (and with the store faulted the lookup itself
  // would fail → transient → preserved). Observing the expiry proves the
  // static handler answered, and that it did so without any store access.
  await hook(request, "fault-on");
  const res = await page.request.get("/session-ended", { maxRedirects: 0 });
  expect(res.status()).toBe(307);
  expect(locationPath(res, baseURL!)).toBe("/link-inactive");
  expectExpiredCookie(res);
  expect(res.headers()["cache-control"]).toBe("no-store");
  expect(await res.text()).not.toContain(NOOR);
  await hook(request, "fault-off");
});

// ── The /[code] refinement ────────────────────────────────────────────────

test("an unrelated invalid, revoked or expired code does not clear a valid current session", async ({
  page,
  baseURL,
}) => {
  const cookie = await redeem(page, DEV_INVITE, PARTICIPANT_NAME);

  for (const badCode of ["/this-code-does-not-exist", REVOKED_INVITE, EXPIRED_INVITE]) {
    const res = await page.request.get(badCode, { maxRedirects: 0 });
    expect(res.status(), badCode).toBe(307);
    expect(locationPath(res, baseURL!), badCode).toBe("/link-inactive");
    expect(sessionSetCookie(res), `${badCode} must not touch the cookie`).toBeUndefined();

    await page.goto(badCode);
    await expectInactive(page);
    expect((await sessionCookie(page.context()))?.value, badCode).toBe(cookie.value);

    await page.goto("/welcome");
    await expect(
      page.getByRole("heading", {
        name: new RegExp(`^Welcome.*${PARTICIPANT_NAME}\\.$`),
      }),
      `${badCode} must leave the unrelated session intact`,
    ).toBeVisible();
  }
});

test("visiting the code of the very invitation that was revoked clears its own dead cookie", async ({
  page,
  baseURL,
}) => {
  await redeem(page, REVOCABLE_INVITE, NOOR);
  await hook(page.request, "revoke");
  const res = await page.request.get(REVOCABLE_INVITE, { maxRedirects: 0 });
  expect(res.status()).toBe(307);
  expect(locationPath(res, baseURL!)).toBe("/link-inactive");
  expectExpiredCookie(res);
  expect(await sessionCookie(page.context())).toBeUndefined();
});
