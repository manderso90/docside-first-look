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

## Phase 3 — Build the seven-screen shell ◑ (built 2026-08-03; deploy pending)

Shipped in-repo: Next 15 App Router shell on the v3 mockup tokens + IBM Plex, invite-code exchange (httpOnly session, URL scrub via redirect, revoked/expired → calm inactive page), forward-only flow guard, all seven screens (workspace as an explicit Phase 4 placeholder), 8-part debrief with exact §7 wording (text + MediaRecorder audio + scheduling link), `/api/events` ingestion with the per-event property allowlist, memory dev store (dev invite `/dev-preview-morris`) + `first_look`-schema Supabase store that fails closed in production. `pnpm tsc` / `lint` / `build` green; flow smoke-tested.

**Deployed 2026-08-03, live at `https://preview.docside.ai`:** Vercel project `docside-first-look` (team `docside`), GitHub connected (pushes to `main` auto-deploy). DNS: Cloudflare CNAME `preview` → `cname.vercel-dns.com` (DNS-only), TLS issued via `vercel certs issue`. Verified over HTTPS: headers (`no-referrer`, noindex), homepage, and graceful `/link-inactive` degradation (Supabase env intentionally unset until Phase 5, so invite links stay inactive in prod).

Remaining before Cohort 1: the Docside intro capture asset (screen 2); founder video MP4 + captions (env `FOUNDER_VIDEO_URL`); Playwright e2e per docside's pre-deploy checklist; visual pass at 375px; Phase 5 env wiring (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SCHEDULE_URL`).

## Phase 4 — Seed data + preview mode in the main app ◔ (in progress 2026-08-03)

Synthetic Oakview Drive dataset run through the real extraction pipeline; preview agents + `generateLink` session handoff per `docs/ARCHITECTURE-VERIFICATION.md`; sandbox guarantees (nothing an agent does touches real data; "nothing will actually be sent" on Mission 4).

**Docside-side PRs open (2026-08-03, awaiting founder review):**
- [docside#57](https://github.com/manderso90/docside/pull/57) — **the Q8 prerequisite**: M4 `render-summary` (summary pipeline + fail-closed language filter + seller-view narrative sections). Includes a flagged CLAUDE.md-vs-PLAN doc conflict resolved as framing-hardcoded/body-generated — confirm in review.
- [docside#58](https://github.com/manderso90/docside/pull/58) — preview foundation: migration 0014 (`agents.is_preview` + `share_outbox` suppression trigger), integration-tested (preview share created with zero outbox rows; control agent unaffected).

**Merged:** [docside#57](https://github.com/manderso90/docside/pull/57) (summaries — the Q8 prerequisite), [docside#58](https://github.com/manderso90/docside/pull/58) (preview foundation; migration 0014 applied to prod). **Open:** [docside#59](https://github.com/manderso90/docside/pull/59) — Oakview fixtures (three synthetic PDFs), founder-run golden-seed runner (**verified live**: real OCR + extraction, 26–28 fields/offer, citations resolve, staged A.4 overrides applied, summaries green; local golden property `9183a84b-1e0a-425e-a8f2-f562e038be16`), and the per-participant clone routine with isolation tests. Note: Appendix A's Okafor comp arithmetic ("$6,250 (0.5%)") was inconsistent; resolved as flat $6,250 to preserve the stated net.

**Still to build (change-list items 5–6 + wiring):** `generateLink` session handoff + mission chrome + telemetry beacon in the app; TTL reaper; metrics exclusion; one-time prod seed run; shell-side provisioning (invite → preview agent + clone) + `first_look` schema migration + Vercel env wiring (Phase 5).

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
