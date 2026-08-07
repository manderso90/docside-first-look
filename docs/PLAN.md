# Docside First Look — Build Plan

> **Status:** v0.2 — 2026-08-03. Phases 0–2 complete: the product brief is `docs/BRIEF.md`, with the Phase 2 architecture decisions folded into its §10. Phase 3 (build) is next, pending founder review of the brief.

## Phase 0 — Repo foundation ✅

- `CLAUDE.md` (operating context + inherited constraints)
- `README.md`
- `docs/VISION.md` (founding brief imported from Google Doc)
- `docs/PLAN.md` (this file)
- `.gitignore`, git init, connect to `github.com/manderso90/docside-first-look`, initial push

## Phase 1 — The product brief (docs, no code) ✅

Delivered as `docs/BRIEF.md` (2026-08-03). It defines every screen, interaction, data point, feedback question, and acceptance criterion:

- **The seven screens** (welcome → first-impression → founder video → scenario → four-mission workspace → debrief → thank-you), acceptance criteria each
- **The four missions** with per-mission micro-questions (e.g., the 1–5 verification-confidence question after Mission 1)
- **The debrief instrument** — the eight parts from VISION.md, worded to avoid leading questions
- **The seed dataset spec** — 1248 Oakview Drive; three fictional offers with meaningful differences in price, financing, contingencies, deposit, closing date; at least one easily-overlooked provision. Constraint: fixtures must be *synthetic* purchase agreements (CAR forms are copyrighted) that still exercise the real extraction pipeline
- **Telemetry events** — the automatic-capture list (video watched, first click, per-mission timing, source-link opens, corrections attempted, hints, skips, drop-off point, device, return visits, own-documents volunteering)
- **Invite/personalization model** — per-agent tokens, first name, personal note, participant number; no auth

**Design cue:** the comparison-view mockup family in `docside-experience/07-screen-design/` (`comparison-view-mockup.html`, `-v2`, `-v3`) is the founder-preferred visual reference for First Look surfaces.

## Phase 2 — Architecture decisions (before building) ✅

Decided in `docs/BRIEF.md` §10 (AD-1…AD-5); details and rejected alternatives there:

- **AD-1 Preview tenancy:** flagged, RLS-isolated preview workspaces in the existing Supabase project, cloned per participant from one golden seed; outbound actions stubbed; TTL cleanup. §17 sentence recorded in the brief.
- **AD-2 Composition:** full redirect to `app.docside.ai`; the main app renders First Look mission chrome in preview mode, then returns to the shell for the debrief. (No iframe.)
- **AD-3 Invite tokens:** re-entrant capability URL → server-side exchange for a short-lived Supabase-compatible preview JWT; revocation at the exchange.
- **AD-4 Telemetry/feedback storage:** `first_look` schema in the same Supabase project; single server write path through the shell's ingestion route (app events beacon to it).
- **AD-5 Media & scheduling:** static MP4 + native player with WebVTT captions and quartile telemetry; MediaRecorder → private Storage bucket for audio; plain Calendly/Cal.com outbound link.

## Phase 3 — Build the seven-screen shell ✅ (built + deployed 2026-08-03; e2e + assets 2026-08-05/07)

Shipped in-repo: Next 15 App Router shell on the v3 mockup tokens + IBM Plex, invite-code exchange (httpOnly session, URL scrub via redirect, revoked/expired → calm inactive page), forward-only flow guard, all seven screens (workspace as an explicit Phase 4 placeholder), 8-part debrief with exact §7 wording (text + MediaRecorder audio + scheduling link), `/api/events` ingestion with the per-event property allowlist, memory dev store (dev invite `/dev-preview-morris`) + `first_look`-schema Supabase store that fails closed in production. `pnpm tsc` / `lint` / `build` green; flow smoke-tested.

**Deployed 2026-08-03, live at `https://preview.docside.ai`:** Vercel project `docside-first-look` (team `docside`), GitHub connected (pushes to `main` auto-deploy). DNS: Cloudflare CNAME `preview` → `cname.vercel-dns.com` (DNS-only), TLS issued via `vercel certs issue`. Verified over HTTPS: headers (`no-referrer`, noindex), homepage, and graceful `/link-inactive` degradation (Supabase env intentionally unset until Phase 5, so invite links stay inactive in prod).

Remaining before Cohort 1: Phase 5 env wiring (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SCHEDULE_URL` — blocked on the `first_look` schema migration + provisioning, Phase 4/5).

**Screen-2 capture ✅ (2026-08-07):** `public/docside-intro-capture.png` regenerated from docside's `/review` frame (headline "A better way to present the offer.") via docside's `scripts/capture-first-look-intro.mjs` ([docside#60](https://github.com/manderso90/docside/pull/60), merged 2026-08-07) and rendered by `/first-impression`. Supersedes the earlier shell-side mock route from [first-look#2](https://github.com/manderso90/docside-first-look/pull/2) (2026-08-04): `src/app/intro/` + `scripts/capture-intro.mjs` reproduced a Docside entry screen inside the shell to generate the same asset — the real-app capture replaces both the asset and the approach ("the real app, not a reproduction"). **Founder follow-up:** delete `src/app/intro/` + `scripts/capture-intro.mjs`, or keep deliberately.

**Playwright e2e + 375px pass ✅ (2026-08-05):** `pnpm test:e2e` (docside pre-deploy discipline; `.spec.ts`, one worker, list reporter). Two local dev servers (ports 4381/4382, isolated `NEXT_DIST_DIR` build dirs) because prod invites stay inactive pre-Phase 5 and the memory store is per-instance. 16 tests green across desktop + 375px projects: access control (unknown/revoked codes, cookieless bounce, no-referrer/noindex headers), the full seven-screen journey (URL scrub, forward-only guards mid-flow, §7 debrief wording, Part 8 channels incl. quiet no-mic fallback, true-count thank-you), re-entry resume, and post-completion lockout. The 375px visual pass is automated (no-horizontal-scroll asserted per screen) with full-page screenshots to `test-results/screens-375/` — reviewed, all clean. **Two real bugs found and fixed:** (1) memory-store state moved to `globalThis` — Next dev bundle/HMR resets were dropping sessions mid-flow (bounced participants to /link-inactive); (2) debrief stepper: Back to a saved part showed a stale blank (page-load `priorAnswers` snapshot) and Continue after Back never advanced (effect keyed on an unchanged number) — the action now echoes `savedAnswer` and the stepper tracks in-visit saves, so Back shows the real answer and never overwrites it with an empty box.

**Founder video ✅ (2026-08-05):** recorded by Morris (`FounderVideo1.mov`, 48s, 1080×1920 portrait HEVC), converted to web H.264 MP4 (~30MB, 5 Mbps cap, faststart; local staging in gitignored `media/`), uploaded to the private `first-look-media` bucket in the shared Supabase project per AD-5/BRIEF §11. WebVTT captions generated locally (whisper.cpp) and corrected against the §5.3 script — **Morris should proofread `media/founder-video.vtt`**. 10-year signed URLs set as `FOUNDER_VIDEO_URL` + `FOUNDER_VIDEO_CAPTIONS_URL` in `.env.local` and all three Vercel envs; prod redeployed and verified (captions serve `text/vtt` with CORS; player already sets `crossOrigin`). Note: video is portrait 9:16 — §5.3 assumed a 16:9 player card; check the framing on screen 3.

## Phase 4 — Seed data + preview mode in the main app ◔ (in progress 2026-08-03)

Synthetic Oakview Drive dataset run through the real extraction pipeline; preview agents + `generateLink` session handoff per `docs/ARCHITECTURE-VERIFICATION.md`; sandbox guarantees (nothing an agent does touches real data; "nothing will actually be sent" on Mission 4).

**Docside-side PRs — all merged:**
- [docside#57](https://github.com/manderso90/docside/pull/57) (merged) — **the Q8 prerequisite**: M4 `render-summary` (summary pipeline + fail-closed language filter + seller-view narrative sections). The flagged CLAUDE.md-vs-PLAN doc conflict was resolved as framing-hardcoded/body-generated.
- [docside#58](https://github.com/manderso90/docside/pull/58) (merged; migration 0014 applied to prod) — preview foundation: `agents.is_preview` + `share_outbox` suppression trigger, integration-tested (preview share created with zero outbox rows; control agent unaffected).
- [docside#59](https://github.com/manderso90/docside/pull/59) (merged 2026-08-04) — Oakview fixtures (three synthetic PDFs), founder-run golden-seed runner (**verified live locally**: real OCR + extraction, 26–28 fields/offer, citations resolve, staged A.4 overrides applied, summaries green; local golden property `9183a84b-1e0a-425e-a8f2-f562e038be16`), and the per-participant clone routine with isolation tests. Note: Appendix A's Okafor comp arithmetic ("$6,250 (0.5%)") was inconsistent; resolved as flat $6,250 to preserve the stated net.
- [docside#60](https://github.com/manderso90/docside/pull/60) (merged 2026-08-07) — `/review` entry screen (mode picker + client-validated PDF staging; UI-only, upload not yet wired to the pipeline) + the Screen-2 capture script.

**Founder decision (2026-08-07):** the mission handoff lands on **`/review`** (`next=/review`), not `/properties/[id]` — for preview agents `/review` gains a server-resolved continuation card into the cloned Oakview workspace. Wiring `/review`'s upload area to the real extraction pipeline stays **out** of Phase 4 (separate product PR on its own merits; preview participants must never trigger live extraction — missions depend on the seeded fixtures).

**Built 2026-08-07 (awaiting founder review/merge + ops):**
- Docside PRs open: [#61](https://github.com/manderso90/docside/pull/61) mission chrome + beacon + migration 0015 (`get_share_snapshot` live `is_preview`); [#62](https://github.com/manderso90/docside/pull/62) TTL reaper (daily cron, golden-agent exclusion, storage reference-counting) + migration 0016; [#63](https://github.com/manderso90/docside/pull/63) `first_look` schema migration 0017 + service-authenticated provision route.
- Shell S1 (this repo, this commit): `/workspace` now owns the real handoff — provision POST (idempotent) → `admin.auth.admin.generateLink` (magiclink, no email) → `APP_HANDOFF_URL/auth/confirm?token_hash=…&next=/review` — with a calm try-again error state; first launch, mid-mission re-entry, and retry share the one path. `participants.preview_agent_id` threaded through the store. `/api/events`: credentialed CORS for `ALLOWED_EVENT_ORIGIN` + server-derived `stage` for app-originated events. Founder scripts: `scripts/create-invite.mjs` (mints code + `participant_ref` + number), `scripts/revoke-invite.mjs` (sets `revoked_at` + bans the preview auth user). E2E: `events-api.spec.ts` (CORS admit/deny, cookieless 401, stage-optional accept, §10-test-4 rejections) — 21 passed.
- Known double-write: `workspace_launched` is recorded server-side at launch (stage `scenario`) and again by the app beacon on `/review` landing (docside #61). Deliberate for now — the server write is canonical; distinguish by stage.

**Remaining (founder ops, in order):** merge #61–#63 → `supabase db push` (0015–0017) + Dashboard "Exposed schemas" += `first_look` → one-time prod seed (`RUN_FIRST_LOOK_SEED=1`, record `FIRST_LOOK_GOLDEN_PROPERTY_ID`) → docside Vercel env (`FIRST_LOOK_GOLDEN_PROPERTY_ID`, `FIRST_LOOK_PROVISION_SECRET`, `CRON_SECRET`, `NEXT_PUBLIC_FIRST_LOOK_EVENTS_URL`) → shell Vercel env (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SCHEDULE_URL`, `FIRST_LOOK_PROVISION_SECRET`, `ALLOWED_EVENT_ORIGIN`, then **`APP_HANDOFF_URL` last** — it flips off the placeholder) → BRIEF §10 acceptance pass + e2e handoff round trip.

## Phase 5 — Telemetry + feedback capture

Event capture per the VISION list; debrief instrument; per-participant review surface for Morris.

## Phase 6 — Rollout

Moderated Zoom sessions with the first 2–3 agents (think-aloud, screen share) → fix the obvious problems → self-guided links to the next group.

> **Observe → correct → release → measure → interview**

## Open questions

Tracked in `docs/BRIEF.md` §13:

1. Is the main app's verify/compare/share flow stable enough today for missions 1–4, or does First Look plan against a target milestone in `docside/docs/PLAN.md`?
2. Founder video — recorded already, or is the script draft in BRIEF §5.3 the starting point?
3. "GS Retrofit" personalization line in the original doc — leftover or meaningful? (Omission formalized in BRIEF §3.)
4. Docside schema/JWT mechanics for AD-1/AD-3 — confirm against the `docside` repo at Phase 4 (unavailable in cloud sessions).
5. Participant card — downloadable image in v1, or on-screen designation only?
6. Session recording — revisit after Cohort 1; explicit prior consent required if ever added.
