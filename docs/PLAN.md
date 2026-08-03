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

## Phase 3 — Build the seven-screen shell

Next.js 15 App Router app, deployed as Vercel project `docside-first-look` → `preview.docside.ai`. Brand tokens and IBM Plex inherited; light mode only; polish-aware build practice from `docside/CLAUDE.md` §15.9 applies (all four UI states per screen, mobile-checked, WCAG AA).

## Phase 4 — Seed data + preview mode in the main app

Synthetic Oakview Drive dataset run through the real extraction pipeline; signed preview tokens; sandbox guarantees (nothing an agent does touches real data; "nothing will actually be sent" on Mission 4).

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
