import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";
import { getStore } from "@/lib/store";
import { MemoryStore, devFixtures } from "@/lib/store/memory";

/**
 * E2E-only fixture mutation hook for the revocation suite
 * (tests/e2e/revocation.spec.ts; the `revocation` Playwright project boots
 * its dev server with FL_E2E_HOOKS=1).
 *
 * Unavailable in every production build, whatever the environment holds:
 * BOTH conditions below must hold, and `process.env.NODE_ENV` is inlined by
 * the compiler at build time, so under `next build` the first operand is the
 * literal `false`, the `&&` folds away, and the enabled branch is dead code —
 * FL_E2E_HOOKS is not even read (verified against the built route chunk).
 * When disabled the route answers 404 before touching the store. When
 * enabled it still only operates on the dev memory store.
 *
 * Bodies carry an action name only; responses carry {ok} only. The session
 * to mutate for corrupt/orphan is taken from the request's own cookie, so no
 * session, participant or invite identifier ever crosses this boundary.
 */
export const dynamic = "force-dynamic";

function hooksEnabled(): boolean {
  return (
    process.env.NODE_ENV !== "production" && process.env.FL_E2E_HOOKS === "1"
  );
}

const notFound = () => new NextResponse(null, { status: 404 });

async function handler(request: NextRequest) {
  if (request.method !== "POST" || !hooksEnabled()) return notFound();
  if (!(getStore() instanceof MemoryStore)) return notFound();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }
  const action =
    typeof body === "object" && body !== null && "action" in body
      ? (body as { action: unknown }).action
      : undefined;
  const sessionId = request.cookies.get(SESSION_COOKIE)?.value;

  let ok: boolean;
  switch (action) {
    case "reset":
      devFixtures.reset();
      ok = true;
      break;
    case "revoke":
      ok = devFixtures.revokeInvite("dev-revocable");
      break;
    case "expire":
      ok = devFixtures.expireInvite("dev-expiring");
      break;
    case "corrupt-session":
      ok = !!sessionId && devFixtures.corruptSession(sessionId);
      break;
    case "orphan-session":
      ok = !!sessionId && devFixtures.orphanSession(sessionId);
      break;
    case "fault-on":
      devFixtures.setFault(true);
      ok = true;
      break;
    case "fault-off":
      devFixtures.setFault(false);
      ok = true;
      break;
    default:
      return NextResponse.json({ error: "unknown action" }, { status: 400 });
  }
  return NextResponse.json({ ok }, { status: ok ? 200 : 409 });
}

// Every method funnels through the same gate so a disabled deployment
// answers 404 uniformly (no 405 hinting that the route exists).
export {
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as PATCH,
  handler as DELETE,
  handler as HEAD,
  handler as OPTIONS,
};
