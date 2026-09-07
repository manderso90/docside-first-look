import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { stageIndex, stagePath, type Stage } from "@/lib/stages";
import {
  LINK_INACTIVE_PATH,
  SESSION_COOKIE,
  SESSION_ENDED_PATH,
  expiredSessionCookieOptions,
  resolveSession,
  type SessionContext,
  type SessionDenial,
} from "@/lib/session";

/**
 * Expire the cookie right here when the framework allows it. Server Actions
 * may modify cookies; Server Components may not — there `cookies().set`
 * throws (documented: "Cookies can only be modified in a Server Action or
 * Route Handler"), and the caller falls back to the lookup-free hop.
 */
async function tryExpireSessionCookie(): Promise<boolean> {
  try {
    (await cookies()).set(SESSION_COOKIE, "", expiredSessionCookieOptions());
    return true;
  } catch {
    return false;
  }
}

/**
 * Where a denied page or server action sends the participant. Definitive
 * denials expire the cookie — on the action response itself when this runs
 * in a Server Action, otherwise via the /session-ended hop — and land on the
 * inactive page. Transient denials (no cookie, store outage) land there
 * directly and leave the cookie alone.
 */
async function denialPath(denial: SessionDenial): Promise<string> {
  if (!denial.clearCookie) return LINK_INACTIVE_PATH;
  return (await tryExpireSessionCookie()) ? LINK_INACTIVE_PATH : SESSION_ENDED_PATH;
}

/** Authorized context or a redirect out of the flow. Pages and server
 * actions that do not use the stage guard (the workspace boundary) call
 * this directly. */
export async function requireSession(): Promise<SessionContext> {
  const resolved = await resolveSession();
  if (!resolved.ok) redirect(await denialPath(resolved));
  return resolved.ctx;
}

/**
 * Flow guard (BRIEF §4/§5): the experience is forward-only. A screen renders
 * only when it is the participant's current frontier (or welcome, which
 * always re-anchors). Anything else redirects to where they actually are.
 * First-impression must always precede the video, in all paths including
 * resume — this guard is what enforces that guardrail.
 */
export async function requireStage(stage: Stage): Promise<SessionContext> {
  const ctx = await requireSession();

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
