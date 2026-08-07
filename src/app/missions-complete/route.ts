import { NextRequest, NextResponse } from "next/server";
import { getSessionContext } from "@/lib/session";
import { getStore } from "@/lib/store";
import { stageIndex, stagePath } from "@/lib/stages";

/**
 * The AD-2 return leg: the app's preview banner links here after the
 * missions ("Finished? Continue to the debrief" — docside's
 * NEXT_PUBLIC_FIRST_LOOK_RETURN_URL). A plain same-site navigation
 * authenticated by the fl_session cookie; nothing else is carried.
 *
 * Advancing to `debrief` here is what breaks the /workspace re-mint loop:
 * mission stages all resolve to /workspace, which hands off to the app
 * again — without this route a participant could never leave. Mission
 * completion is deliberately not verified (behavior is tracked via the
 * event stream, not gated); the debrief itself asks what they did.
 *
 * Forward-only semantics hold: below mission_1 this is a no-op redirect
 * back to the participant's frontier, and at/after debrief it just lands
 * on the frontier (advanceStage never moves backwards).
 */
export async function GET(request: NextRequest) {
  const to = (path: string) =>
    NextResponse.redirect(new URL(path, request.url));

  const ctx = await getSessionContext();
  if (!ctx) return to("/link-inactive");

  const reached = stageIndex(ctx.session.lastStage);
  if (reached < stageIndex("mission_1")) {
    return to(stagePath(ctx.session.lastStage));
  }
  if (reached < stageIndex("debrief")) {
    await getStore().advanceStage(ctx.session.id, "debrief");
    return to(stagePath("debrief"));
  }
  return to(stagePath(ctx.session.lastStage));
}
