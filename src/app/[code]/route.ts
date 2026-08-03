import { NextRequest, NextResponse } from "next/server";
import { stagePath } from "@/lib/stages";
import { deviceClass, SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";
import { getStore } from "@/lib/store";
import { recordEvent } from "@/lib/record-event";

/**
 * The capability-URL exchange (BRIEF §9 token flow, AD-3).
 *
 * GET /<invite-code> → validate → create a session row → set the httpOnly
 * session cookie → 307 to the participant's current stage. The redirect is
 * what scrubs the code from the address bar; all further shell navigation
 * is cookie-keyed and code-free. Invalid/revoked/expired codes land on
 * /link-inactive with no error styling and no code echoed.
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ code: string }> },
) {
  const { code } = await context.params;
  const store = getStore();

  let lookup;
  try {
    lookup = await store.lookupInvite(code);
  } catch (error) {
    console.error("[first-look] invite lookup failed", error);
    return NextResponse.redirect(new URL("/link-inactive", _request.url));
  }

  if (lookup.status !== "ok" || !lookup.invite || !lookup.participant) {
    return NextResponse.redirect(new URL("/link-inactive", _request.url));
  }

  const device = await deviceClass();
  const returning = await store.hasPriorSession(lookup.participant.id);
  const session = await store.createSession({
    participantId: lookup.participant.id,
    inviteId: lookup.invite.id,
    device,
  });

  const resumeStage = returning
    ? await store.furthestStage(lookup.participant.id)
    : "welcome";
  // Re-entry resumes; the welcome screen itself handles the "Welcome back"
  // greeting. Resume always lands on welcome first so the participant
  // re-anchors, with the button continuing at their furthest stage.
  await store.advanceStage(session.id, resumeStage);

  await recordEvent(session, "welcome", "invite_opened", {});
  if (returning) {
    await recordEvent(session, "welcome", "session_resumed", {
      resumed_stage: resumeStage,
    });
  }

  const response = NextResponse.redirect(
    new URL(stagePath("welcome"), _request.url),
    307,
  );
  response.cookies.set(SESSION_COOKIE, session.id, sessionCookieOptions());
  return response;
}
