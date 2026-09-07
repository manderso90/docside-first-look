import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";

/**
 * The cookie-clearing hop for page denials.
 *
 * Server Components cannot modify cookies, so when a page's session
 * resolution is a DEFINITIVE denial (revoked, expired, unknown, malformed,
 * mismatched — see src/lib/session.ts) it redirects here, and this handler
 * expires `fl_session` and lands on the existing /link-inactive surface.
 *
 * Deliberately self-contained: no store, no lookup, no reason, no
 * identifier — it does exactly one thing to exactly one cookie, so it keeps
 * working even when the store does not, and it can never loop
 * (/link-inactive is static and unauthenticated). As a static segment it
 * takes precedence over the /[code] exchange route. Never cached.
 *
 * Clearing is hygiene, not the security boundary: a cookie that survives
 * (or is replayed) is still refused server-side on every protected request.
 */
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(
    new URL("/link-inactive", request.url),
    307,
  );
  response.headers.set("Cache-Control", "no-store");
  // Same name / path / attributes as the exchange set, maxAge 0.
  response.cookies.set(SESSION_COOKIE, "", {
    ...sessionCookieOptions(),
    maxAge: 0,
  });
  return response;
}
