# Architecture Verification — BRIEF §10 vs the `docside` codebase

> **Date:** 2026-08-03 · Resolves BRIEF §13 Q4. Two explorers swept `~/Projects-clean/docside` (schema/RLS/auth/pipeline; share/outbound/layout). Verdict per architecture decision below. File references are into the `docside` repo.

## Summary

| Decision | Verdict |
|---|---|
| AD-1 Preview tenancy (flagged rows, cloned golden workspace) | **Confirmed, with one structural amendment** — the tenancy unit is the *agent*, not a "workspace" |
| AD-2 Composition (redirect, app-rendered mission chrome) | **Confirmed** — a documented banner slot exists in the app shell; no middleware needed |
| AD-3 Invite tokens (hand-minted Supabase JWT with custom claims) | **Amended** — mint a real Supabase session via the admin API instead of hand-signing JWTs |
| AD-4 Telemetry (`first_look` schema, single ingestion route) | **Confirmed as written** |
| Outbound stub | **Mostly pre-emptive** — share delivery is not yet built; the guard rail is placed now so the future worker can't regress it |

Two genuine gaps need a founder decision before Cohort 1 (§6 below).

## 1. AD-1 amendment: the tenancy unit is the agent

`docside` has **no workspace entity**. Every table roots at `agents.id`, whose PK is an FK to `auth.users(id)` (`0001_init.sql:112-119`), and all 24 RLS policies key on `auth.uid()` directly or via the property chain (`0002_rls.sql`) — zero policies read JWT claims.

**Amended model:** each participant gets a **preview agent** — a real `auth.users` row created server-side via `admin.auth.admin.createUser` (no email is sent; the existing `handle_new_user` trigger in `0006_auth_trigger.sql` auto-provisions the `agents` row). Add one migration: `agents.is_preview boolean not null default false`. Consequences:

- **Every existing RLS policy works unchanged.** No claim-based policy branches, no rewrite of 24 policies. Isolation between participants is the same isolation the product already enforces between agents.
- "Real users never see preview rows" needs only the product-metrics side (exclude `is_preview` agents from aggregates); cross-agent reads are already impossible.
- The `first_look: true` JWT claim from AD-3 becomes the `agents.is_preview` column — server code reads it after `getUser()`.

**Clone recipe** (per participant, from the golden seed; order matters):

1. `properties` (regenerate `intake_email_local` + `intake_token_hash` — both unique)
2. `documents` → `document_pages` (incl. `tokens_jsonb`, `checkboxes_jsonb`)
3. `offers` (preserve the document↔offer pairing invariant; reset `verified_by`/`verified_at`)
4. `offer_fields` — **provenance columns (`original_value_jsonb`, `original_citation_jsonb`) must be written in the same INSERT**; the `offer_fields_protect_provenance` BEFORE UPDATE trigger forbids backfill
5. `offer_sub_scores` — one row per offer; this row is the **inclusion gate** for the comparison view (`src/lib/scoring/offers-from-db.ts:85-99`)
6. Storage: either copy `<propertyId>/<documentId>.pdf` + the `ocr.json` handoff per clone, or point clones at shared golden paths (`documents.storage_path` is a plain text column — sharing is allowed but must be a deliberate choice; copying is safer and the bytes are small)

`shares`/`share_views`/`audit_log` are not cloned — participants create those live. A worked reference for the whole recipe already exists: `tests/e2e/helpers.ts` (`seedAgent`, `seedProperty`, `seedComparisonOffer`) handles the provenance-same-INSERT rule and the sub-scores gate.

**Golden seed feasibility: confirmed.** Both Inngest functions are deliberately decoupled from `inngest.createFunction` for direct invocation (`ingest-document.ts:88`, `extract-offer.ts:74`), so a seed script can run the three synthetic PDFs through the **real** OCR + extraction pipeline with a fake step runner and the admin client — no Inngest dev server. Live-path precedent: `tests/extract.test.ts` behind `RUN_LIVE_EXTRACT=1`. Synthetic fixtures are exempt from the ZDR gate per `docside/CLAUDE.md`.

**TTL cleanup is net-new:** no retention/cron worker exists anywhere in `docside` (despite `documents.expires_at` + index), so the ~30-day preview reaper must be built, not configured.

## 2. AD-2 confirmed

- The app shell is `src/app/(app)/layout.tsx`; the mission bar slots between `</header>` (line 51) and `<main>` (line 52). A comment block at lines 8–16 documents shell-level conditional banners as the intended pattern.
- There is **no middleware** in the app (by design); mode detection is per-layout/server-component, matching the repo's env-flag idiom (`rpa626Enabled()`-style, read at call time; the fail-closed `AGENT_PLATFORM_ZDR_CONFIRMED` guard is the precedent for a fail-closed preview flag).
- Mission 4 works with zero sends **today**: the app's only `create_share` caller passes `p_to_email: null`, the outbox insert branch is dead, and the seller page at `/share/[token]` needs nothing but the URL. The share token appears only in a client-side copy card.
- The `/share/[token]` route has no group layout — the Mission 4 preview banner is added on that surface directly (preview detection via the share's owning agent's `is_preview`).

## 3. AD-3 amendment: real Supabase sessions, not hand-minted JWTs

Hand-signing a Supabase-compatible HS256 JWT is technically possible (a test helper does it locally: `tests/helpers/test-db.ts:81-98`) but wrong for production, for four verified reasons:

1. The cloud project's JWT secret is not wired into any runtime env (only the local-dev demo secret in `.env.test`), and the project may be on asymmetric signing keys — the repo cannot confirm which mode.
2. `@supabase/ssr` cookie sessions assume GoTrue-issued tokens with a refresh path; a hand-minted JWT would need header injection on a per-request client, a seam `src/lib/supabase/server.ts` does not have.
3. RLS keys on `auth.uid()`, so custom claims buy nothing once AD-1's preview-agent model is adopted.
4. The custom access token hook is not configured (`config.toml:301-304` commented out).

**Amended flow:** invite code → shell validates + sets httpOnly cookie (unchanged) → at launch, the shell server calls `admin.auth.admin.generateLink({ type: 'magiclink' })` for the participant's preview agent — **generateLink returns the link server-side and sends no email** — extracts the `token_hash`, and hands off to the app's existing `/auth/confirm` verifyOtp exchange (`src/app/auth/confirm/route.ts`). Result: a genuine GoTrue session cookie on `app.docside.ai`, standard expiry/refresh, zero new token machinery.

- **Session bounding:** GoTrue `jwt_expiry` is 3600s with refresh; the brief's "~2h idle pause" is enforced by the shell (session row `last_seen`) rather than token lifetime.
- **Revocation:** `invites.revoked_at` (blocks re-entry, unchanged) **plus** banning the preview auth user (`admin.auth.admin.updateUserById` ban) to kill live app sessions.
- AD-3's leak-prevention rules (history scrub, `Referrer-Policy: no-referrer`, no third-party scripts, fragment/POST handoff, `participant_ref` for third parties) carry over unchanged — they now protect the invite code and the one-time `token_hash`.

## 4. AD-4 confirmed

The dedicated `first_look` schema + single server write path stands as written. Verified context: `docside`'s `audit_event` is a **closed Postgres enum** — First Look's own tables sidestep it entirely (no docside migration needed for telemetry). The `log_share_view` RPC (anon-callable, silently no-ops on bad tokens, dual-writes metrics + audit) is the in-repo analogue for the beacon shape. No third-party analytics exist in the app; nothing conflicts.

## 5. Outbound-send inventory & the stub

Verified: **share email delivery does not exist yet.** The `share_outbox` table has no worker, no Resend/Postmark-send/Twilio SDK is installed, and no SMS path exists anywhere. The only live outbound emails are Supabase Auth's (magic link / signup confirmation) — which preview agents never trigger, since sessions come from `generateLink` (no send).

Guard rails to place now, so the future outbox worker cannot regress preview isolation:

- In `create_share`: when the calling agent `is_preview`, force `p_to_email := null` (or raise) — the outbox insert at `0005_rpcs.sql:278` is the single producer of outbox rows.
- The future outbox worker must re-check `is_preview` before any send (defense in depth).
- Note: `tests/integration/rpc-create-share.test.ts` asserts outbox side effects and will need a preview-case extension when the guard lands.

The BRIEF §10 security acceptance tests remain the release gate; add one case: *GIVEN a preview agent, WHEN `create_share` is called with a `to_email`, THEN no outbox row is created.*

## 6. Gaps requiring a founder decision (new — surfaced by verification)

1. **The click-to-source pane does not exist yet.** The verify workspace is built and shows every field with dual confidence, `match_kind`, and citations — but citations render as text (page/clause/excerpt). There is no PDF viewer component, no `createSignedUrl` call anywhere, and the `pages` image bucket is unused. The Mission 1 acceptance criterion ("contract pane scrolls to and highlights the cited paragraph within 400ms") — **the moment to protect** — exceeds the app as built. Options: (a) build the source-document pane in `docside` before Cohort 1 (it is the central trust moment; the mockup spec exists), or (b) soften Mission 1 to the citation-excerpt experience that exists today. This is the single most consequential open item.
2. **Seller-view narrative summaries don't render.** Nothing writes `offer_summaries`, so the share page shows tiers/cards/attestation but no plain-English "What this means" sections. Mission 4 asks agents to critique "the summary you might share" — as built, the critique target is thinner than the worked specimen. Options: implement summary generation before Cohort 1, or run Mission 4 against the share view as-built and treat "what's missing" as research signal.

## 7. Revised docside-side change list (the one preview module)

All of it still covered by the recorded §17 sentence (*"Docside gains a preview mode: a flagged, RLS-isolated, per-participant clone of one seeded workspace, entered by signed token, with outbound actions stubbed"*), now with verified mechanics:

1. Migration: `agents.is_preview` column (+ column grant per the repo's column-grant convention).
2. `create_share` preview guard (outbox suppression).
3. Golden-seed script (direct-invoke the decoupled pipeline functions on the three synthetic PDFs).
4. Clone routine (the §1 recipe; modeled on `tests/e2e/helpers.ts`).
5. Mission chrome (banner in `(app)/layout.tsx` + `/share/[token]` preview banner) + the telemetry beacon helper posting to the shell's ingestion route.
6. TTL reaper for preview agents/rows/storage (net-new; no existing cron to extend).
