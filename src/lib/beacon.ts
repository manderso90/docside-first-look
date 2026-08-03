"use client";

import type { Stage } from "@/lib/stages";

/**
 * Client-side event beacon (BRIEF §8 / AD-4): keepalive fetch to the shell's
 * ingestion route, authenticated by the httpOnly session cookie (same-origin).
 * Fire-and-forget — telemetry never blocks or breaks the participant's flow.
 */
export function beacon(
  event: string,
  stage: Stage,
  properties: Record<string, unknown> = {},
): void {
  try {
    void fetch("/api/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        event,
        stage,
        ts_client: new Date().toISOString(),
        properties,
      }),
    });
  } catch {
    // Ignore: analytics loss is acceptable, broken flows are not.
  }
}
