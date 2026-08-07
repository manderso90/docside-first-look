// Founder-run invite revocation (BRIEF §10 acceptance test 5;
// ARCHITECTURE-VERIFICATION §3): sets invites.revoked_at (the exchange
// route refuses revoked codes) AND bans the participant's provisioned
// preview auth user, killing live app.docside.ai sessions — a still-live
// GoTrue access token then dies on its own ≤1h clock and no new one can
// be minted.
//
//   node --env-file=.env.local scripts/revoke-invite.mjs <invite-code>
//
// Needs SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY. Idempotent: re-running
// re-reports the existing revocation and re-applies the ban.

import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";

const [code] = process.argv.slice(2);
if (!code) {
  console.error("usage: node --env-file=.env.local scripts/revoke-invite.mjs <invite-code>");
  process.exit(1);
}

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error(
    "revoke-invite: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required (run with --env-file=.env.local)",
  );
  process.exit(1);
}

// ws transport: see create-invite.mjs — local Node 20 lacks a global
// WebSocket and supabase-js throws at construction without one.
const db = createClient(url, key, {
  auth: { persistSession: false },
  db: { schema: "first_look" },
  realtime: { transport: WebSocket },
});
const auth = createClient(url, key, {
  auth: { persistSession: false },
  realtime: { transport: WebSocket },
});

const { data: invite, error: inviteError } = await db
  .from("invites")
  .select("id, participant_id, revoked_at")
  .eq("code", code)
  .maybeSingle();
if (inviteError) {
  console.error(`revoke-invite: lookup failed: ${inviteError.message}`);
  process.exit(1);
}
if (!invite) {
  console.error("revoke-invite: no invite with that code");
  process.exit(1);
}

let revokedAt = invite.revoked_at;
if (!revokedAt) {
  revokedAt = new Date().toISOString();
  const { error } = await db
    .from("invites")
    .update({ revoked_at: revokedAt })
    .eq("id", invite.id);
  if (error) {
    console.error(`revoke-invite: revoke update failed: ${error.message}`);
    process.exit(1);
  }
}

const { data: participant, error: participantError } = await db
  .from("participants")
  .select("preview_agent_id")
  .eq("id", invite.participant_id)
  .single();
if (participantError) {
  console.error(`revoke-invite: participant lookup failed: ${participantError.message}`);
  process.exit(1);
}

let banned = false;
if (participant.preview_agent_id) {
  // ~100 years: GoTrue has no permanent flag; this is the documented ban
  // mechanism (ARCHITECTURE-VERIFICATION §3). Refresh is refused
  // immediately; the current access token expires on its own short clock.
  const { error } = await auth.auth.admin.updateUserById(
    participant.preview_agent_id,
    { ban_duration: "876600h" },
  );
  if (error) {
    console.error(`revoke-invite: ban failed: ${error.message}`);
    process.exit(1);
  }
  banned = true;
}

console.log(
  JSON.stringify(
    {
      revoked_at: revokedAt,
      preview_agent_banned: banned,
      preview_agent_id: participant.preview_agent_id ?? null,
    },
    null,
    2,
  ),
);
