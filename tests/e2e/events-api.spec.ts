import { test, expect } from "@playwright/test";
import { DEV_INVITE } from "./helpers";

/**
 * Phase 4 ingestion-route contract (/api/events): cookie auth, the
 * cross-origin CORS admit for the app beacon, server-derived stage, and
 * the §10-test-4 rejections. Runs against the desktop server only — that
 * server sets ALLOWED_EVENT_ORIGIN (playwright.config.ts).
 */

const ALLOWED_ORIGIN = "https://app.docside.ai";
const EVENTS = "/api/events";

test.skip(
  ({ baseURL }) => baseURL !== "http://localhost:4381",
  "CORS env only configured on the desktop server (port 4381)",
);

test("preflight from the allowed app origin gets a credentialed CORS admit", async ({
  request,
}) => {
  const res = await request.fetch(EVENTS, {
    method: "OPTIONS",
    headers: { origin: ALLOWED_ORIGIN },
  });
  expect(res.status()).toBe(204);
  expect(res.headers()["access-control-allow-origin"]).toBe(ALLOWED_ORIGIN);
  expect(res.headers()["access-control-allow-credentials"]).toBe("true");
  expect(res.headers()["access-control-allow-methods"]).toContain("POST");
});

test("preflight from any other origin gets no CORS admit", async ({
  request,
}) => {
  const res = await request.fetch(EVENTS, {
    method: "OPTIONS",
    headers: { origin: "https://evil.example.invalid" },
  });
  expect(res.status()).toBe(204);
  expect(res.headers()["access-control-allow-origin"]).toBeUndefined();
  expect(res.headers()["access-control-allow-credentials"]).toBeUndefined();
});

test("cookieless POST is rejected (§10 test 4)", async ({ request }) => {
  const res = await request.post(EVENTS, {
    data: {
      event: "first_click",
      ts_client: new Date().toISOString(),
      properties: { element_id: "e", region: "r" },
    },
  });
  expect(res.status()).toBe(401);
});

test("app-shaped event: cookie auth, no stage (server-derived), CORS on the response", async ({
  request,
}) => {
  // Enter via the dev invite so the request context holds the fl_session
  // cookie — the same jar then authenticates the beacon-shaped POST.
  const enter = await request.get(DEV_INVITE);
  expect(enter.ok()).toBe(true);

  const res = await request.post(EVENTS, {
    headers: { origin: ALLOWED_ORIGIN },
    data: {
      // App-side beacon shape (docside src/lib/first-look/beacon.ts):
      // event + ts_client + allowlisted properties, NO stage.
      event: "first_click",
      ts_client: new Date().toISOString(),
      properties: { element_id: "offer-card-price", region: "review" },
    },
  });
  expect(res.status()).toBe(200);
  expect(await res.json()).toEqual({ ok: true });
  expect(res.headers()["access-control-allow-origin"]).toBe(ALLOWED_ORIGIN);
  expect(res.headers()["access-control-allow-credentials"]).toBe("true");
});

test("seller_preview_opened is accepted from the app beacon (2026-08-20)", async ({
  request,
}) => {
  // The Docside app posts this when the agent opens "Preview what the seller
  // will see" and the report renders. Without this allowlist entry the route
  // returns 400 and the beacon — fire-and-forget by design — drops it
  // silently, so the corrected journey would look like nobody previewed.
  const enter = await request.get(DEV_INVITE);
  expect(enter.ok()).toBe(true);

  const res = await request.post(EVENTS, {
    headers: { origin: ALLOWED_ORIGIN },
    data: {
      // Beacon shape: no stage (the route derives it from the session row),
      // and an empty payload — a seller preview carries no identifiers.
      event: "seller_preview_opened",
      ts_client: new Date().toISOString(),
      properties: {},
    },
  });
  expect(res.status()).toBe(200);
  expect(await res.json()).toEqual({ ok: true });
});

test("unknown event and off-allowlist shape are rejected (§10 test 4)", async ({
  request,
}) => {
  const enter = await request.get(DEV_INVITE);
  expect(enter.ok()).toBe(true);

  const unknown = await request.post(EVENTS, {
    data: {
      event: "totally_made_up",
      ts_client: new Date().toISOString(),
      properties: {},
    },
  });
  expect(unknown.status()).toBe(400);

  const badProps = await request.post(EVENTS, {
    data: {
      event: "video_quartile",
      ts_client: new Date().toISOString(),
      properties: { quartile: 33 },
    },
  });
  expect(badProps.status()).toBe(400);
});
