"use server";

import { redirect } from "next/navigation";
import { requireSession } from "@/lib/flow";
import { mintWorkspaceHandoff } from "@/lib/preview-handoff";
import { getStore } from "@/lib/store";
import { stageIndex, stagePath } from "@/lib/stages";

/**
 * The interstitial's Continue: provision + mint + redirect into the app.
 * Minting lives here (a POST) and never at render — the magic-link token is
 * single-use and short-lived, so this is the only path that can't burn a
 * token on a refresh or a prefetch. Failure redirects to the calm try-again
 * state instead of stranding the participant.
 *
 * requireSession re-validates the invitation (revoked/expired → out), which
 * is what stops a revoked participant from provisioning a preview agent for
 * the first time here — the GoTrue ban only covers agents that already exist.
 */
export async function enterWorkspace(): Promise<void> {
  const ctx = await requireSession();
  const reached = stageIndex(ctx.session.lastStage);
  if (reached < stageIndex("mission_1") || reached > stageIndex("mission_4")) {
    redirect(stagePath(ctx.session.lastStage));
  }

  let handoffUrl: string | null = null;
  try {
    handoffUrl = await mintWorkspaceHandoff(ctx.participant);
  } catch (error) {
    // Message may carry an HTTP status, never a secret or token.
    console.error("[first-look] workspace handoff failed", error);
  }
  if (handoffUrl) redirect(handoffUrl);
  redirect("/workspace?retry=1");
}

/** Dev-only: skips the missions so the shell flow is walkable pre-Phase 4. */
export async function completeMissionsDev(): Promise<void> {
  const ctx = await requireSession();
  if (process.env.APP_HANDOFF_URL) redirect(stagePath(ctx.session.lastStage));
  await getStore().advanceStage(ctx.session.id, "debrief");
  redirect(stagePath("debrief"));
}
