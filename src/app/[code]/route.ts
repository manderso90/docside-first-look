import { NextRequest, NextResponse } from "next/server";
import { stagePath } from "@/lib/stages";
import {
  LINK_INACTIVE_PATH,
  SESSION_COOKIE,
  deviceClass,
  expireSessionCookie,
  resolveSession,
  sessionCookieOptions,
} from "@/lib/session";
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
  request: NextRequest,
  context: { params: Promise<{ code: string }> },
) {
  const { code } = await context.params;
  const to = (path: string) =>
    NextResponse.redirect(new URL(path, request.url), 307);

  let store;
  let lookup;
  try {
    store = getStore();
    lookup = await store.lookupInvite(code);
  } catch (error) {
    // Store unavailable (e.g. deployed before Phase 5 Supabase wiring) or
    // lookup failure: degrade to the calm inactive page, never a 500. A
    // transient failure says nothing about any cookie the browser holds, so
    // it is left alone.
    console.error("[first-look] invite lookup failed", error);
    const response = to(LINK_INACTIVE_PATH);
    response.headers.set("Cache-Control", "no-store");
    return response;
  }

  if (lookup.status !== "ok" || !lookup.invite || !lookup.participant) {
    return denyCode(to(LINK_INACTIVE_PATH));
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

  const response = to(stagePath("welcome"));
  response.cookies.set(SESSION_COOKIE, session.id, sessionCookieOptions());
  return response;
}

/**
 * An invalid, revoked or expired CODE says nothing on its own about the
 * COOKIE the browser already holds — that may be a different participant's
 * perfectly valid session, and a stale link in an inbox must not sign them
 * out. So the existing cookie is resolved on its own merits and expired only
 * when that resolution is itself a definitive denial: malformed, unknown, or
 * an invitation that is revoked/expired/mismatched (which covers "this cookie
 * belongs to the very invitation that was just refused"). A valid session,
 * no cookie, or a transient store error leaves the cookie untouched.
 */
async function denyCode(response: NextResponse): Promise<NextResponse> {
  response.headers.set("Cache-Control", "no-store");
  const current = await resolveSession();
  if (!current.ok && current.clearCookie) expireSessionCookie(response);
  return response;
}
