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
 * Phase 4 note: app-originated (app.docside.ai) events will authenticate via
 * the preview session's bearer token and CORS-allowlisting — that arrives
 * with the handoff; shell-originated events are same-origin only for now.
 */
export async function POST(request: NextRequest) {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: "no session" }, { status: 401 });

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const envelope = eventEnvelopeSchema.safeParse(raw);
  if (!envelope.success) {
    return NextResponse.json({ error: "bad envelope" }, { status: 400 });
  }

  const schema = EVENT_PROPERTIES[envelope.data.event];
  if (!schema) {
    return NextResponse.json({ error: "unknown event" }, { status: 400 });
  }

  const parsed = schema.safeParse(envelope.data.properties);
  if (!parsed.success) {
    return NextResponse.json({ error: "bad properties" }, { status: 400 });
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
      stage: envelope.data.stage,
      event: envelope.data.event,
      properties: parsed.data,
      tsClient: envelope.data.ts_client,
      tsServer: new Date().toISOString(),
      device: ctx.session.device,
    });
  } catch (error) {
    console.error(`[first-look] event insert failed: ${envelope.data.event}`, error);
    return NextResponse.json({ error: "write failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
