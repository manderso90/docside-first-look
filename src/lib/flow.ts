import "server-only";
import { redirect } from "next/navigation";
import { stageIndex, stagePath, type Stage } from "@/lib/stages";
import { getSessionContext, type SessionContext } from "@/lib/session";

/**
 * Flow guard (BRIEF §4/§5): the experience is forward-only. A screen renders
 * only when it is the participant's current frontier (or welcome, which
 * always re-anchors). Anything else redirects to where they actually are.
 * First-impression must always precede the video, in all paths including
 * resume — this guard is what enforces that guardrail.
 */
export async function requireStage(stage: Stage): Promise<SessionContext> {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/link-inactive");

  const current = ctx.session.lastStage;
  if (stage === "welcome") return ctx;

  const target = stageIndex(stage);
  const reached = stageIndex(current);

  // Can't skip ahead: the furthest reachable screen is the frontier + 1.
  if (target > reached + 1) redirect(stagePath(current));
  // Forward-only: screens already passed are not revisitable.
  if (target < reached) redirect(stagePath(current));

  return ctx;
}
