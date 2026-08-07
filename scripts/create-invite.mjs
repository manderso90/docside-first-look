// Founder-run invite mint (BRIEF §9): creates a participant + invite in the
// first_look schema and prints the invite URL. This is the only place
// invite codes and participant_refs are generated.
//
//   node --env-file=.env.local scripts/create-invite.mjs \
//     "First name" "email@example.com" "Personal why-you note" [cohort]
//
// Needs SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (the shared docside
// project, first_look schema applied — docside migration 0017 — and
// exposed via PostgREST). Codes are ~20-char base64url (15 random bytes);
// participant_ref is the non-secret public reference (scheduling links);
// participant_number is the next integer ("No. 007").
//
// The invite URL is a capability — hand it only to its participant.

import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";

const [firstName, email, personalNote, cohortArg] = process.argv.slice(2);
if (!firstName || !email || !personalNote) {
  console.error(
    'usage: node --env-file=.env.local scripts/create-invite.mjs "First name" "email" "personal note" [cohort]',
  );
  process.exit(1);
}
const cohort = cohortArg ? Number(cohortArg) : 1;
if (!Number.isInteger(cohort) || cohort < 1) {
  console.error(`create-invite: cohort must be a positive integer, got "${cohortArg}"`);
  process.exit(1);
}

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error(
    "create-invite: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required (run with --env-file=.env.local)",
  );
  process.exit(1);
}

// ws transport: local founder machines may run Node 20 (no global
// WebSocket) — supabase-js constructs a RealtimeClient at init and throws
// without one. The deployed shell runs a newer runtime and doesn't need it.
const db = createClient(url, key, {
  auth: { persistSession: false },
  db: { schema: "first_look" },
  realtime: { transport: WebSocket },
});

// 15 random bytes → 20 base64url chars, the BRIEF's ~20-char high-entropy slug.
const code = randomBytes(15).toString("base64url");
const participantRef = `pr_${randomBytes(5).toString("hex")}`;

const { data: numberRows, error: numberError } = await db
  .from("participants")
  .select("participant_number")
  .order("participant_number", { ascending: false })
  .limit(1);
if (numberError) {
  console.error(`create-invite: reading participant_number failed: ${numberError.message}`);
  process.exit(1);
}
const participantNumber = (numberRows?.[0]?.participant_number ?? 0) + 1;

const { data: participant, error: participantError } = await db
  .from("participants")
  .insert({
    first_name: firstName,
    email,
    participant_number: participantNumber,
    participant_ref: participantRef,
    cohort,
  })
  .select("id")
  .single();
if (participantError) {
  console.error(`create-invite: participant insert failed: ${participantError.message}`);
  process.exit(1);
}

const { error: inviteError } = await db.from("invites").insert({
  code,
  participant_id: participant.id,
  personal_note: personalNote,
});
if (inviteError) {
  console.error(`create-invite: invite insert failed: ${inviteError.message}`);
  // Leave no half-minted participant behind.
  await db.from("participants").delete().eq("id", participant.id);
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      invite_url: `https://preview.docside.ai/${code}`,
      participant_id: participant.id,
      participant_number: participantNumber,
      participant_ref: participantRef,
      cohort,
    },
    null,
    2,
  ),
);
