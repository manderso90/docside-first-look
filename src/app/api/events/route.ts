import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getSessionContext } from "@/lib/session";
import { getStore } from "@/lib/store";
import { EVENT_PROPERTIES, eventEnvelopeSchema } from "@/lib/events";

/**
 * The single ingestion route (BRIEF §8, AD-4). Authenticated by the shell's
 * httpOnly session cookie; every event is validated against the per-event
 * property allowlist — unknown events are rejected, unknown properties are
 * dropped and the drop is logged. ts_server is stamped here; the events
 * table is append-only.
 *
 * Phase 4 cross-origin contract (the app-side beacon in docside,
 * src/lib/first-look/beacon.ts there): app.docside.ai and
 * preview.docside.ai are same-site, so the fl_session cookie rides a
 * credentialed fetch — the participant identity still comes ONLY from the
 * cookie (participant_ref is non-secret and is deliberately not auth).
 * CORS admits exactly ALLOWED_EVENT_ORIGIN with credentials; any other
 * origin gets no CORS headers and the browser blocks the read. App events
 * omit `stage` and it is derived server-side from the session row.
 */

const allowedOrigin = process.env.ALLOWED_EVENT_ORIGIN;

/** CORS headers iff the request's Origin is the single allowed origin.
 * Vary: Origin always, so caches never leak an allowed response elsewhere. */
function corsHeaders(request: NextRequest): Record<string, string> {
  const origin = request.headers.get("origin");
  if (allowedOrigin && origin === allowedOrigin) {
    return {
      "Access-Control-Allow-Origin": allowedOrigin,
      "Access-Control-Allow-Credentials": "true",
      Vary: "Origin",
    };
  }
  return { Vary: "Origin" };
}

export async function OPTIONS(request: NextRequest) {
  const cors = corsHeaders(request);
  if ("Access-Control-Allow-Origin" in cors) {
    return new NextResponse(null, {
      status: 204,
      headers: {
        ...cors,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "content-type",
        "Access-Control-Max-Age": "86400",
      },
    });
  }
  return new NextResponse(null, { status: 204, headers: cors });
}

export async function POST(request: NextRequest) {
  const cors = corsHeaders(request);
  const json = (body: unknown, status: number) =>
    NextResponse.json(body, { status, headers: cors });

  const ctx = await getSessionContext();
  if (!ctx) return json({ error: "no session" }, 401);

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return json({ error: "bad json" }, 400);
  }

  const envelope = eventEnvelopeSchema.safeParse(raw);
  if (!envelope.success) {
    return json({ error: "bad envelope" }, 400);
  }

  const schema = EVENT_PROPERTIES[envelope.data.event];
  if (!schema) {
    return json({ error: "unknown event" }, 400);
  }

  const parsed = schema.safeParse(envelope.data.properties);
  if (!parsed.success) {
    return json({ error: "bad properties" }, 400);
  }
  const sentKeys = Object.keys(envelope.data.properties);
  const keptKeys = new Set(Object.keys(parsed.data));
  const dropped = sentKeys.filter((k) => !keptKeys.has(k));
  if (dropped.length > 0) {
    console.warn(
      `[first-look] dropped off-allowlist properties on ${envelope.data.event}: ${dropped.join(", ")}`,
    );
  }

  try {
    await getStore().insertEvent({
      eventId: randomUUID(),
      participantId: ctx.participant.id,
      sessionId: ctx.session.id,
      stage: envelope.data.stage ?? ctx.session.lastStage,
      event: envelope.data.event,
      properties: parsed.data,
      tsClient: envelope.data.ts_client,
      tsServer: new Date().toISOString(),
      device: ctx.session.device,
    });
  } catch (error) {
    console.error(`[first-look] event insert failed: ${envelope.data.event}`, error);
    return json({ error: "write failed" }, 500);
  }

  return json({ ok: true }, 200);
}
