import "server-only";
import { cookies, headers } from "next/headers";
import type { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import {
  inviteExpired,
  type Invite,
  type Participant,
  type Session,
} from "@/lib/store/types";

/**
 * The shell session rides an httpOnly cookie (BRIEF §9 token flow).
 * The invite code itself never persists client-side beyond the exchange
 * redirect; all shell navigation is cookie-keyed and code-free.
 *
 * The cookie value is a bare `sessions.id` — a bearer identifier whose only
 * validation is the server-side resolution below. The security boundary is
 * that resolution, never the browser's possession (or deletion) of the cookie.
 */

export const SESSION_COOKIE = "fl_session";

/** Where every denied request lands: the calm, static, unauthenticated page. */
export const LINK_INACTIVE_PATH = "/link-inactive";
/** Lookup-free route handler that expires the cookie, then lands on
 * LINK_INACTIVE_PATH (Server Components cannot modify cookies themselves). */
export const SESSION_ENDED_PATH = "/session-ended";

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

/** The same name, path and attributes with `maxAge: 0` — the only shape a
 * browser matches against the host-only, Path=/ cookie the exchange set. */
export function expiredSessionCookieOptions() {
  return { ...sessionCookieOptions(), maxAge: 0 };
}

/** Expire the session cookie on a route-handler response. */
export function expireSessionCookie(response: NextResponse): void {
  response.cookies.set(SESSION_COOKIE, "", expiredSessionCookieOptions());
}

export interface SessionContext {
  session: Session;
  participant: Participant;
  /** The invitation the session was minted from — verified active on every
   * resolution. Pages may read it (e.g. the welcome note) without a second
   * lookup. */
  invite: Invite;
}

/**
 * Why a request was denied. `clearCookie` separates DEFINITIVE denials
 * (the cookie can never become valid again — expire it) from TRANSIENT ones
 * (no cookie, or the store was unreachable — keep it so a later request can
 * recover once the store is back; the invite link is re-entrant either way).
 */
export type SessionDenialReason =
  | "no_cookie"
  | "malformed"
  | "unknown_session"
  | "unknown_participant"
  | "unknown_invite"
  | "mismatch"
  | "revoked"
  | "expired"
  | "store_error";

export type SessionDenial = {
  ok: false;
  reason: SessionDenialReason;
  clearCookie: boolean;
};

export type SessionResolution = { ok: true; ctx: SessionContext } | SessionDenial;

/** Hyphenated RFC 4122 text form — what `sessions.id` always looks like
 * (`gen_random_uuid()` / `randomUUID()`). Anything else never reaches the
 * store: no lookup, no Postgres 22P02 noise, definitive denial. */
const UUID_SHAPE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function deny(reason: SessionDenialReason, clearCookie: boolean): SessionDenial {
  // Reason codes only — never the cookie value, a code, or participant data.
  if (reason !== "no_cookie") {
    console.warn(`[first-look] session denied: ${reason}`);
  }
  return { ok: false, reason, clearCookie };
}

/**
 * Resolve the session cookie into an authorized context, or a denial.
 *
 * Order: cookie shape → session row → participant row + invitation row (in
 * parallel) → the invitation must belong to the session's participant, must
 * not be revoked, and must not be expired (same rule as the exchange path:
 * `inviteExpired`). Revocation and expiry are modelled on the INVITATION
 * (scripts/revoke-invite.mjs sets `invites.revoked_at`), so a session row's
 * mere existence grants nothing — every protected request re-checks the
 * invitation, which is what makes revocation take effect on the next request
 * for every session minted from that invite, in every browser.
 *
 * Store failures fail closed for this request without clearing the cookie.
 */
export async function resolveSession(): Promise<SessionResolution> {
  const raw = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!raw) return deny("no_cookie", false);
  if (!UUID_SHAPE.test(raw)) return deny("malformed", true);

  try {
    const store = getStore();
    const session = await store.getSession(raw);
    if (!session) return deny("unknown_session", true);

    const [participant, invite] = await Promise.all([
      store.getParticipant(session.participantId),
      store.getInviteById(session.inviteId),
    ]);
    if (!participant) return deny("unknown_participant", true);
    if (!invite) return deny("unknown_invite", true);
    if (invite.participantId !== session.participantId) {
      return deny("mismatch", true);
    }
    if (invite.revokedAt) return deny("revoked", true);
    if (inviteExpired(invite)) return deny("expired", true);

    return { ok: true, ctx: { session, participant, invite } };
  } catch (error) {
    // Store unavailable: deny this request (screens redirect to
    // /link-inactive) rather than a 500, and keep the cookie so the
    // participant recovers on their own once the store is back.
    console.error(
      "[first-look] session resolution failed:",
      error instanceof Error ? error.message : "unknown error",
    );
    return deny("store_error", false);
  }
}

/** Compatibility wrapper: the authorized context or null. Callers that need
 * to act on the denial (expire the cookie) use resolveSession() directly. */
export async function getSessionContext(): Promise<SessionContext | null> {
  const resolved = await resolveSession();
  return resolved.ok ? resolved.ctx : null;
}

/** Rough device class from the UA — analytics color, not gospel (BRIEF §8). */
export async function deviceClass(): Promise<"desktop" | "mobile" | "tablet"> {
  const ua = ((await headers()).get("user-agent") ?? "").toLowerCase();
  if (/ipad|tablet/.test(ua)) return "tablet";
  if (/mobi|iphone|android/.test(ua)) return "mobile";
  return "desktop";
}
