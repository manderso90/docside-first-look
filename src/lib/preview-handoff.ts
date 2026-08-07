import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getStore } from "@/lib/store";
import type { Participant } from "@/lib/store/types";

/**
 * The Phase 4 workspace handoff (ARCHITECTURE-VERIFICATION §3, amended
 * flow): participant → docside preview agent + cloned Oakview workspace →
 * a real GoTrue session on app.docside.ai.
 *
 *   1. PROVISION — POST docside's service-authenticated
 *      /api/first-look/provision (the founder-approved seam, 2026-08-07:
 *      the single clone implementation lives in docside next to its
 *      isolation tests). Idempotent: re-launch returns the same agent and
 *      workspace (AD-1); a TTL-reaped agent re-provisions cleanly.
 *   2. MINT — admin.auth.admin.generateLink({ type: "magiclink" }) against
 *      the shared Supabase project. No email is ever sent; only the
 *      hashed_token leaves this function, embedded in the redirect.
 *   3. HAND OFF — the app's existing /auth/confirm verifyOtp route
 *      (live-verified since docside PR #47) exchanges token_hash for a
 *      session cookie and lands on next=/review (founder decision
 *      2026-08-07 — the mission entry screen with the preview
 *      continuation card).
 *
 * Leak posture (AD-3): the token_hash rides the redirect URL exactly once
 * and verifyOtp consumes it single-use; every shell page already sends
 * Referrer-Policy: no-referrer, and nothing here is logged. The magiclink
 * token GoTrue mints expires on its own short clock — the "~2h idle"
 * bound stays shell-enforced.
 */

/** Mission entry inside the app (founder decision 2026-08-07). */
const APP_ENTRY_PATH = "/review";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`preview-handoff: ${name} must be set`);
  }
  return value;
}

interface ProvisionResponse {
  agentUserId: string;
  email: string;
  propertyId: string;
  reused: boolean;
}

async function provisionParticipant(
  participant: Participant,
): Promise<ProvisionResponse> {
  const appUrl = requireEnv("APP_HANDOFF_URL");
  const secret = requireEnv("FIRST_LOOK_PROVISION_SECRET");

  const response = await fetch(
    new URL("/api/first-look/provision", appUrl),
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({
        participantRef: participant.participantRef,
        // Wrapper personalization only: the participant plays themselves as
        // the listing agent, so their first name is the display name.
        displayName: participant.firstName,
      }),
      cache: "no-store",
    },
  );
  if (!response.ok) {
    // Body is a machine error code ({error}), never a secret.
    const detail = await response.text().catch(() => "");
    throw new Error(
      `preview-handoff: provision failed (${response.status}) ${detail}`.trim(),
    );
  }
  return (await response.json()) as ProvisionResponse;
}

async function mintTokenHash(email: string): Promise<string> {
  const admin = createClient(
    requireEnv("SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false } },
  );
  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  if (error || !data?.properties?.hashed_token) {
    throw new Error(
      `preview-handoff: generateLink failed${error ? `: ${error.message}` : ""}`,
    );
  }
  return data.properties.hashed_token;
}

/**
 * Provision (idempotent) + mint + build the app redirect URL. Throws on
 * any failure — the caller owns the participant-facing error state.
 */
export async function mintWorkspaceHandoff(
  participant: Participant,
): Promise<string> {
  const provisioned = await provisionParticipant(participant);

  if (participant.previewAgentId !== provisioned.agentUserId) {
    await getStore().setPreviewAgent(participant.id, provisioned.agentUserId);
  }

  const tokenHash = await mintTokenHash(provisioned.email);

  const url = new URL("/auth/confirm", requireEnv("APP_HANDOFF_URL"));
  url.searchParams.set("token_hash", tokenHash);
  url.searchParams.set("type", "magiclink");
  url.searchParams.set("next", APP_ENTRY_PATH);
  return url.toString();
}
