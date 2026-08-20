import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import WebSocket from "ws";

/**
 * The storage half of the seller_preview_opened contract.
 *
 * events-api.spec.ts proves the ROUTE accepts the event; it runs on the
 * memory store, which cannot prove the event is durably written. This file
 * runs the same route against the real SupabaseStore — the production class,
 * the production column mapping, real Postgres — pointed at a LOCAL Supabase
 * instance. The first_look schema exists there because docside's migration
 * 0017 creates it, so this is the production write path with a different
 * host, not a re-implementation of it.
 *
 * OPT-IN, and deliberately so. Set both env vars to run it:
 *
 *   FIRST_LOOK_LOCAL_SUPABASE_URL=http://127.0.0.1:54321 \
 *   FIRST_LOOK_LOCAL_SUPABASE_SERVICE_ROLE_KEY=<local demo service key> \
 *     pnpm test:e2e --project=events-store
 *
 * Without them playwright.config.ts adds neither the project nor its server,
 * so the default suite is unchanged. The URL must be a local instance: this
 * spec writes participant, invite, session and event rows. Pointing it at the
 * production project would write to real First Look research data.
 */

const SUPABASE_URL = process.env.FIRST_LOOK_LOCAL_SUPABASE_URL ?? "";
const SERVICE_KEY = process.env.FIRST_LOOK_LOCAL_SUPABASE_SERVICE_ROLE_KEY ?? "";
const ALLOWED_ORIGIN = "https://app.docside.ai";
const EVENTS = "/api/events";

/** Refuse to run against anything that is not loopback — see the header. */
const IS_LOCAL = /^https?:\/\/(127\.0\.0\.1|localhost|\[::1\])(:|\/|$)/.test(
  SUPABASE_URL,
);

test.skip(
  !SUPABASE_URL || !SERVICE_KEY || !IS_LOCAL,
  "needs FIRST_LOOK_LOCAL_SUPABASE_URL (loopback) + _SERVICE_ROLE_KEY",
);

// Same schema binding the shell's production store uses.
const db = () =>
  createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
    db: { schema: "first_look" },
    // supabase-js constructs a Realtime client eagerly, which needs a global
    // WebSocket. Node 20 (the locked runtime) has none, so hand it `ws` —
    // the same fix docside's tests/helpers/test-db.ts applies. Nothing here
    // subscribes to Realtime; this only keeps the constructor from throwing.
    realtime: { transport: WebSocket as unknown as typeof globalThis.WebSocket },
  });

const participantId = randomUUID();
const inviteCode = `e2e-store-${randomUUID().slice(0, 12)}`;

test.beforeAll(async () => {
  const supabase = db();
  const { error: pErr } = await supabase.from("participants").insert({
    id: participantId,
    first_name: "Storetest",
    email: `store-${participantId}@example.invalid`,
    participant_number: 9001,
    participant_ref: `ref_${participantId.replace(/-/g, "").slice(0, 16)}`,
  });
  expect(pErr, `seed participant: ${pErr?.message}`).toBeNull();

  const { error: iErr } = await supabase.from("invites").insert({
    code: inviteCode,
    participant_id: participantId,
    personal_note: "synthetic storage-path fixture",
  });
  expect(iErr, `seed invite: ${iErr?.message}`).toBeNull();
});

test.afterAll(async () => {
  // participants cascades to invites, sessions and events.
  await db().from("participants").delete().eq("id", participantId);
});

test("seller_preview_opened is stored through the production write path", async ({
  request,
}) => {
  // Enter through the real capability URL so a real session row exists and
  // the request context carries the httpOnly fl_session cookie.
  const enter = await request.get(`/${inviteCode}`);
  expect(enter.ok()).toBe(true);

  const tsClient = new Date().toISOString();
  const res = await request.post(EVENTS, {
    headers: { origin: ALLOWED_ORIGIN },
    // Exactly the app beacon's shape: no stage, empty properties.
    data: {
      event: "seller_preview_opened",
      ts_client: tsClient,
      properties: {},
    },
  });
  expect(res.status()).toBe(200);
  expect(await res.json()).toEqual({ ok: true });

  const { data: rows, error } = await db()
    .from("events")
    .select("*")
    .eq("participant_id", participantId)
    .eq("event", "seller_preview_opened");
  expect(error, error?.message).toBeNull();
  expect(rows, "the event must be readable back out of first_look.events")
    .toHaveLength(1);

  const row = rows![0];
  // Empty payload: a seller preview carries no identifiers, by design.
  expect(row.properties).toEqual({});
  // Stage is SERVER-derived — the beacon never sent one.
  expect(row.stage).toBe("welcome");
  expect(row.device).toBeTruthy();
  expect(row.event_id).toBeTruthy();
  expect(row.session_id).toBeTruthy();
  expect(new Date(row.ts_client).toISOString()).toBe(tsClient);
  // Stamped server-side at ingestion, not trusted from the client.
  expect(Date.parse(row.ts_server)).toBeGreaterThan(0);

  // The session it was attributed to is this participant's real session row.
  const { data: session } = await db()
    .from("sessions")
    .select("id, participant_id")
    .eq("id", row.session_id)
    .single();
  expect(session?.participant_id).toBe(participantId);
});

test("an off-allowlist property never reaches the database", async ({
  request,
}) => {
  // seller_preview_opened declares an EMPTY property schema, so zod strips
  // unknown keys rather than rejecting the event (the route then logs the
  // drop). That is the right failure mode for a privacy allowlist: a future
  // app change that mistakenly attaches a property id still gets its event
  // recorded, and the identifier is discarded before the insert. This test
  // exists to prove the discard is real at the storage layer, not just at
  // the parse layer.
  const enter = await request.get(`/${inviteCode}`);
  expect(enter.ok()).toBe(true);

  const res = await request.post(EVENTS, {
    headers: { origin: ALLOWED_ORIGIN },
    data: {
      event: "seller_preview_opened",
      ts_client: new Date().toISOString(),
      properties: {
        property_id: "11111111-1111-1111-1111-111111111111",
        agent_email: "agent@example.invalid",
      },
    },
  });
  expect(res.status()).toBe(200);

  const { data: rows } = await db()
    .from("events")
    .select("properties")
    .eq("participant_id", participantId)
    .eq("event", "seller_preview_opened");
  // Two events now (this one and the previous test's); NEITHER may carry an
  // identifier.
  expect(rows!.length).toBeGreaterThanOrEqual(2);
  for (const r of rows!) {
    expect(r.properties).toEqual({});
  }
});

test("a malformed seller_preview_opened envelope is rejected and stores nothing", async ({
  request,
}) => {
  const enter = await request.get(`/${inviteCode}`);
  expect(enter.ok()).toBe(true);

  const { count: before } = await db()
    .from("events")
    .select("event_id", { count: "exact", head: true })
    .eq("participant_id", participantId);

  // `properties` must be an object; a string fails the envelope schema.
  const res = await request.post(EVENTS, {
    headers: { origin: ALLOWED_ORIGIN },
    data: {
      event: "seller_preview_opened",
      ts_client: new Date().toISOString(),
      properties: "not-an-object",
    },
  });
  expect(res.status()).toBe(400);

  const { count: after } = await db()
    .from("events")
    .select("event_id", { count: "exact", head: true })
    .eq("participant_id", participantId);
  // The rejected POST wrote nothing. (The invite GET above records its own
  // invite_opened/session_resumed rows, so compare against a count taken
  // after that navigation, not before it.)
  expect(after).toBe(before);
});

test("an unknown event is still rejected on the Supabase store", async ({
  request,
}) => {
  const enter = await request.get(`/${inviteCode}`);
  expect(enter.ok()).toBe(true);

  const res = await request.post(EVENTS, {
    data: {
      event: "totally_made_up",
      ts_client: new Date().toISOString(),
      properties: {},
    },
  });
  expect(res.status()).toBe(400);

  const { count } = await db()
    .from("events")
    .select("event_id", { count: "exact", head: true })
    .eq("participant_id", participantId)
    .eq("event", "totally_made_up");
  expect(count).toBe(0);
});

test("an existing event type still stores unchanged", async ({ request }) => {
  // Regression guard on the allowlist edit itself: adding an entry must not
  // disturb the events that were already flowing.
  const enter = await request.get(`/${inviteCode}`);
  expect(enter.ok()).toBe(true);

  const res = await request.post(EVENTS, {
    headers: { origin: ALLOWED_ORIGIN },
    data: {
      event: "first_click",
      ts_client: new Date().toISOString(),
      properties: { element_id: "offer-card-price", region: "review" },
    },
  });
  expect(res.status()).toBe(200);

  const { data: rows } = await db()
    .from("events")
    .select("properties")
    .eq("participant_id", participantId)
    .eq("event", "first_click");
  expect(rows).toHaveLength(1);
  expect(rows![0].properties).toEqual({
    element_id: "offer-card-price",
    region: "review",
  });
});
