import "server-only";
import { cookies, headers } from "next/headers";
import { getStore } from "@/lib/store";
import type { Participant, Session } from "@/lib/store/types";

/**
 * The shell session rides an httpOnly cookie (BRIEF §9 token flow).
 * The invite code itself never persists client-side beyond the exchange
 * redirect; all shell navigation is cookie-keyed and code-free.
 */

export const SESSION_COOKIE = "fl_session";

/** ~2h idle bound is enforced by shell semantics, not cookie lifetime;
 * the cookie itself lives longer so re-entry can resume gracefully. */
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 14;

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  };
}

export interface SessionContext {
  session: Session;
  participant: Participant;
}

/** Read + validate the session cookie. Null means "send them to link-inactive". */
export async function getSessionContext(): Promise<SessionContext | null> {
  const jar = await cookies();
  const sessionId = jar.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;
  try {
    const store = getStore();
    const session = await store.getSession(sessionId);
    if (!session) return null;
    const participant = await store.getParticipant(session.participantId);
    if (!participant) return null;
    return { session, participant };
  } catch (error) {
    // Store unavailable: treat as no session (screens redirect to
    // /link-inactive) rather than a 500.
    console.error("[first-look] session lookup failed", error);
    return null;
  }
}

/** Rough device class from the UA — analytics color, not gospel (BRIEF §8). */
export async function deviceClass(): Promise<"desktop" | "mobile" | "tablet"> {
  const ua = ((await headers()).get("user-agent") ?? "").toLowerCase();
  if (/ipad|tablet/.test(ua)) return "tablet";
  if (/mobi|iphone|android/.test(ua)) return "mobile";
  return "desktop";
}
