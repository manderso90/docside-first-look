"use server";

import { redirect } from "next/navigation";
import { requireStage } from "@/lib/flow";
import { recordEvent } from "@/lib/record-event";
import { getStore } from "@/lib/store";

/**
 * The redirect boundary (BRIEF §5.4, AD-2). With APP_HANDOFF_URL configured
 * (Phase 4), this mints the app handoff and navigates to app.docside.ai.
 * Until then it lands on the local /workspace placeholder so the shell flow
 * stays walkable end to end.
 *
 * workspace_launched is written server-side before the redirect — no
 * keepalive race (the BRIEF's keepalive note covers client-fired beacons;
 * a server action write is strictly stronger).
 */
export async function launchWorkspace(): Promise<void> {
  const ctx = await requireStage("scenario");
  await recordEvent(ctx.session, "scenario", "workspace_launched", {});
  await getStore().advanceStage(ctx.session.id, "mission_1");

  const handoff = process.env.APP_HANDOFF_URL;
  redirect(handoff || "/workspace");
}
