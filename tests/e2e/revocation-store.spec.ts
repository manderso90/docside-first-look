import {
  test,
  expect,
  type APIResponse,
  type BrowserContext,
  type Page,
} from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import WebSocket from "ws";
import { SESSION_COOKIE } from "./helpers";

/**
 * Resumed-session revocation through the PRODUCTION store class.
 *
 * revocation.spec.ts proves the authorization logic on the memory store.
 * This file drives the same HTTP surface against the real SupabaseStore —
 * the production query path, the production column mapping, real Postgres —
 * pointed at a LOCAL Supabase, and flips `invites.revoked_at` /
 * `invites.expires_at` / `sessions.participant_id` directly in that
 * database, exactly the way the founder's revoke-invite.mjs and time do in
 * production.
 *
 * OPT-IN and loopback-only, like events-store.spec.ts:
 *
 *   FIRST_LOOK_LOCAL_SUPABASE_URL=http://127.0.0.1:54321 \
 *   FIRST_LOOK_LOCAL_SUPABASE_SERVICE_ROLE_KEY=<local demo service key> \
 *     pnpm test:e2e --project=events-store
 *
 * It writes participant, invite and session rows, so a non-loopback URL is
 * refused outright (below, and again in playwright.config.ts before any
 * server boots). Nothing here can reach the cloud project.
 */

const SUPABASE_URL = process.env.FIRST_LOOK_LOCAL_SUPABASE_URL ?? "";
const SERVICE_KEY = process.env.FIRST_LOOK_LOCAL_SUPABASE_SERVICE_ROLE_KEY ?? "";
const IS_LOCAL = /^https?:\/\/(127\.0\.0\.1|localhost|\[::1\])(:|\/|$)/.test(
  SUPABASE_URL,
);

if (SUPABASE_URL && !IS_LOCAL) {
  throw new Error(
    "revocation-store.spec: FIRST_LOOK_LOCAL_SUPABASE_URL must be a loopback address — refusing to run against a remote database",
  );
}
test.skip(
  !SUPABASE_URL || !SERVICE_KEY,
  "needs FIRST_LOOK_LOCAL_SUPABASE_URL (loopback) + _SERVICE_ROLE_KEY",
);

const db = () =>
  createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
    db: { schema: "first_look" },
    // Node 20 has no global WebSocket; see events-store.spec.ts.
    realtime: { transport: WebSocket as unknown as typeof globalThis.WebSocket },
  });

const INACTIVE_HEADING = "This preview link is no longer active.";

// Two synthetic participants: A is revoked/expired/mismatched, B is the
// control who must keep working throughout.
const A = { id: randomUUID(), firstName: "Storerevoke", number: 9002 };
const B = { id: randomUUID(), firstName: "Storeother", number: 9003 };
const codeRevocable = `e2e-rev-${randomUUID().slice(0, 12)}`;
const codeExpiring = `e2e-exp-${randomUUID().slice(0, 12)}`;
const codeControl = `e2e-ctl-${randomUUID().slice(0, 12)}`;
let inviteRevocableId = "";
let inviteExpiringId = "";

test.beforeAll(async () => {
  expect(IS_LOCAL, "writes only ever go to a loopback Supabase").toBe(true);
  const supabase = db();
  for (const p of [A, B]) {
    const { error } = await supabase.from("participants").insert({
      id: p.id,
      first_name: p.firstName,
      email: `store-${p.id}@example.invalid`,
      participant_number: p.number,
      participant_ref: `ref_${p.id.replace(/-/g, "").slice(0, 16)}`,
      cohort: 99,
    });
    expect(error, `seed participant: ${error?.message}`).toBeNull();
  }
  const { data: invites, error } = await supabase
    .from("invites")
    .insert([
      { code: codeRevocable, participant_id: A.id, personal_note: "synthetic revocation fixture" },
      { code: codeExpiring, participant_id: A.id, personal_note: "synthetic expiry fixture", expires_at: "2099-01-01T00:00:00Z" },
      { code: codeControl, participant_id: B.id, personal_note: "synthetic control fixture" },
    ])
    .select("id, code");
  expect(error, `seed invites: ${error?.message}`).toBeNull();
  inviteRevocableId = invites!.find((i) => i.code === codeRevocable)!.id;
  inviteExpiringId = invites!.find((i) => i.code === codeExpiring)!.id;
});

test.afterAll(async () => {
  // participants cascades to invites, sessions and events.
  await db().from("participants").delete().in("id", [A.id, B.id]);
});

async function sessionCookie(context: BrowserContext) {
  return (await context.cookies()).find((c) => c.name === SESSION_COOKIE);
}

async function redeem(page: Page, code: string, firstName: string) {
  await page.goto(`/${code}`);
  await expect(page).toHaveURL(/\/welcome$/);
  await expect(
    page.getByRole("heading", { name: new RegExp(`^Welcome.*${firstName}\\.$`) }),
  ).toBeVisible();
  const cookie = await sessionCookie(page.context());
  expect(cookie).toBeDefined();
  return cookie!;
}

async function expectWelcome(page: Page, firstName: string) {
  await page.goto("/welcome");
  await expect(
    page.getByRole("heading", { name: new RegExp(`^Welcome.*${firstName}\\.$`) }),
  ).toBeVisible();
}

async function expectSignedOut(page: Page, firstName: string) {
  await expect(page).toHaveURL(/\/link-inactive$/);
  await expect(page.getByRole("heading", { name: INACTIVE_HEADING })).toBeVisible();
  await expect(page.locator("body")).not.toContainText(firstName);
  expect(await sessionCookie(page.context())).toBeUndefined();
}

function sessionSetCookie(res: APIResponse): string | undefined {
  return res
    .headersArray()
    .filter((h) => h.name.toLowerCase() === "set-cookie")
    .map((h) => h.value)
    .find((v) => v.startsWith(`${SESSION_COOKIE}=`));
}

function locationPath(res: APIResponse, baseURL: string): string {
  return new URL(res.headers()["location"], baseURL).pathname;
}

test.beforeEach(() => {
  test.setTimeout(180_000); // dev server compiles routes on first hit
});

test("revoked after redemption: the SupabaseStore denies the resumed session and expires the cookie", async ({
  page,
  baseURL,
}) => {
  const cookie = await redeem(page, codeRevocable, A.firstName);

  // The founder's revocation, as revoke-invite.mjs performs it: one column.
  const { error } = await db()
    .from("invites")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", inviteRevocableId);
  expect(error, error?.message).toBeNull();

  // The session row itself is untouched — denial comes from the invitation.
  const { data: session } = await db()
    .from("sessions")
    .select("id")
    .eq("id", cookie.value)
    .maybeSingle();
  expect(session?.id).toBe(cookie.value);

  const first = await page.request.get("/welcome", { maxRedirects: 0 });
  expect(first.status()).toBe(307);
  expect(locationPath(first, baseURL!)).toBe("/session-ended");
  await page.goto("/welcome");
  await expectSignedOut(page, A.firstName);

  // Every other entry point, with the revoked cookie re-presented each time.
  for (const path of ["/first-impression", "/scenario", "/debrief"]) {
    await page.context().addCookies([cookie]);
    await page.goto(path);
    await expectSignedOut(page, A.firstName);
  }
  await page.context().addCookies([cookie]);
  const missions = await page.request.get("/missions-complete", { maxRedirects: 0 });
  expect(missions.status()).toBe(307);
  expect(locationPath(missions, baseURL!)).toBe("/link-inactive");
  expect(sessionSetCookie(missions)).toMatch(/max-age=0/i);

  await page.context().addCookies([cookie]);
  const events = await page.request.post("/api/events", {
    data: { event: "first_click", ts_client: new Date().toISOString(), properties: { element_id: "e", region: "r" } },
  });
  expect(events.status()).toBe(401);
  expect(await events.json()).toEqual({ error: "no session" });
  expect(sessionSetCookie(events)).toMatch(/max-age=0/i);

  // Nothing was written on the denied event POST.
  const { count } = await db()
    .from("events")
    .select("event_id", { count: "exact", head: true })
    .eq("participant_id", A.id)
    .eq("event", "first_click");
  expect(count).toBe(0);
});

test("a revoked invitation cannot be redeemed at the exchange (real store)", async ({
  page,
}) => {
  await page.goto(`/${codeRevocable}`);
  await expect(page).toHaveURL(/\/link-inactive$/);
  expect(await sessionCookie(page.context())).toBeUndefined();
});

test("expiry after redemption is denied on resume, with the exchange's boundary rule (real store)", async ({
  page,
}) => {
  const cookie = await redeem(page, codeExpiring, A.firstName);

  // Expired one minute ago → denied, cookie cleared.
  let { error } = await db()
    .from("invites")
    .update({ expires_at: new Date(Date.now() - 60_000).toISOString() })
    .eq("id", inviteExpiringId);
  expect(error, error?.message).toBeNull();
  await page.goto("/welcome");
  await expectSignedOut(page, A.firstName);

  // Not yet expired (an hour out) → the very same session row works again,
  // proving the check is live per request and `expiresAt < now` is the rule.
  ({ error } = await db()
    .from("invites")
    .update({ expires_at: new Date(Date.now() + 60 * 60_000).toISOString() })
    .eq("id", inviteExpiringId));
  expect(error, error?.message).toBeNull();
  await page.context().addCookies([cookie]);
  await expectWelcome(page, A.firstName);

  // And the exchange agrees on both sides of the boundary.
  ({ error } = await db()
    .from("invites")
    .update({ expires_at: new Date(Date.now() - 60_000).toISOString() })
    .eq("id", inviteExpiringId));
  expect(error, error?.message).toBeNull();
  const fresh = await page.context().browser()!.newContext();
  const freshPage = await fresh.newPage();
  await freshPage.goto(`/${codeExpiring}`);
  await expect(freshPage).toHaveURL(/\/link-inactive$/);
  expect(await sessionCookie(fresh)).toBeUndefined();
  await fresh.close();
});

test("a participant/invitation mismatch is denied and cleared (real store)", async ({
  page,
}) => {
  const cookie = await redeem(page, codeControl, B.firstName);
  // Re-point B's session row at participant A: the invitation no longer
  // belongs to the session's participant.
  const { error } = await db()
    .from("sessions")
    .update({ participant_id: A.id })
    .eq("id", cookie.value);
  expect(error, error?.message).toBeNull();
  await page.goto("/welcome");
  await expectSignedOut(page, B.firstName);
  await expect(page.locator("body")).not.toContainText(A.firstName);
});

test("malformed and unknown cookies are denied without a 500 and cleared (real store)", async ({
  page,
  baseURL,
}) => {
  // A non-UUID never reaches Postgres (no 22P02 "invalid input syntax for
  // type uuid" → no 500): the shape check denies it first.
  await page.context().addCookies([
    { name: SESSION_COOKIE, value: "not-a-uuid", url: baseURL! },
  ]);
  const malformed = await page.request.get("/welcome", { maxRedirects: 0 });
  expect(malformed.status()).toBe(307);
  expect(locationPath(malformed, baseURL!)).toBe("/session-ended");
  await page.goto("/welcome");
  await expectSignedOut(page, "not-a-uuid");

  await page.context().addCookies([
    { name: SESSION_COOKIE, value: randomUUID(), url: baseURL! },
  ]);
  const unknown = await page.request.get("/welcome", { maxRedirects: 0 });
  expect(unknown.status()).toBe(307);
  expect(locationPath(unknown, baseURL!)).toBe("/session-ended");
  await page.goto("/welcome");
  await expect(page).toHaveURL(/\/link-inactive$/);
  expect(await sessionCookie(page.context())).toBeUndefined();
});

test("an unrelated invalid code leaves a valid session intact (real store)", async ({
  page,
  baseURL,
}) => {
  const cookie = await redeem(page, codeControl, B.firstName);
  for (const badCode of [`/no-such-${randomUUID().slice(0, 8)}`, `/${codeRevocable}`]) {
    const res = await page.request.get(badCode, { maxRedirects: 0 });
    expect(res.status()).toBe(307);
    expect(locationPath(res, baseURL!)).toBe("/link-inactive");
    expect(sessionSetCookie(res)).toBeUndefined();
  }
  expect((await sessionCookie(page.context()))?.value).toBe(cookie.value);
  await expectWelcome(page, B.firstName);
});
