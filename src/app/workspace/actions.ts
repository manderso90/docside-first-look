"use server";

import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/session";
import { getStore } from "@/lib/store";
import { stagePath } from "@/lib/stages";

/** Dev-only: skips the missions so the shell flow is walkable pre-Phase 4. */
export async function completeMissionsDev(): Promise<void> {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/link-inactive");
  if (process.env.APP_HANDOFF_URL) redirect(stagePath(ctx.session.lastStage));
  await getStore().advanceStage(ctx.session.id, "debrief");
  redirect(stagePath("debrief"));
}
