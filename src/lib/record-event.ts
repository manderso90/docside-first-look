import "server-only";
import { randomUUID } from "crypto";
import { getStore } from "@/lib/store";
import type { Stage } from "@/lib/stages";
import type { Session } from "@/lib/store/types";

/** Server-originated event write (shell pages/actions). Client-originated
 * events go through /api/events, which validates against the allowlist. */
export async function recordEvent(
  session: Session,
  stage: Stage,
  event: string,
  properties: Record<string, unknown> = {},
): Promise<void> {
  const now = new Date().toISOString();
  try {
    await getStore().insertEvent({
      eventId: randomUUID(),
      participantId: session.participantId,
      sessionId: session.id,
      stage,
      event,
      properties,
      tsClient: now,
      tsServer: now,
      device: session.device,
    });
  } catch (error) {
    // Telemetry must never break the participant's flow.
    console.error(`[first-look] event write failed: ${event}`, error);
  }
}
