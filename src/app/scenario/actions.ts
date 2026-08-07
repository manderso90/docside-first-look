"use server";

import { redirect } from "next/navigation";
import { requireStage } from "@/lib/flow";
import { recordEvent } from "@/lib/record-event";
import { getStore } from "@/lib/store";

/**
 * The redirect boundary (BRIEF §5.4, AD-2). Launch always lands on
 * /workspace, which owns the actual handoff: with APP_HANDOFF_URL
 * configured it provisions + mints the app session and redirects to
 * app.docside.ai; without it, it renders the dev placeholder. Centralizing
 * the mint there means first launch, mid-mission re-entry (mission stages
 * all resolve to /workspace), and post-failure retry share one path.
 *
 * workspace_launched is written server-side before the redirect — no
 * keepalive race (the BRIEF's keepalive note covers client-fired beacons;
 * a server action write is strictly stronger).
 */
export async function launchWorkspace(): Promise<void> {
  const ctx = await requireStage("scenario");
  await recordEvent(ctx.session, "scenario", "workspace_launched", {});
  await getStore().advanceStage(ctx.session.id, "mission_1");
  redirect("/workspace");
}
