# Docside First Look — Build Plan

> **Status:** v0.1 — drafted 2026-08-03. Phase 0 executed; Phases 1+ pending founder review (and an ultraplan deep-planning pass).

## Phase 0 — Repo foundation ✅

- `CLAUDE.md` (operating context + inherited constraints)
- `README.md`
- `docs/VISION.md` (founding brief imported from Google Doc)
- `docs/PLAN.md` (this file)
- `.gitignore`, git init, connect to `github.com/manderso90/docside-first-look`, initial push

## Phase 1 — The product brief (docs, no code)

Write `docs/BRIEF.md` defining every screen, interaction, data point, feedback question, and acceptance criterion:

- **The seven screens** (welcome → first-impression → founder video → scenario → four-mission workspace → debrief → thank-you), acceptance criteria each
- **The four missions** with per-mission micro-questions (e.g., the 1–5 verification-confidence question after Mission 1)
- **The debrief instrument** — the eight parts from VISION.md, worded to avoid leading questions
- **The seed dataset spec** — 1248 Oakview Drive; three fictional offers with meaningful differences in price, financing, contingencies, deposit, closing date; at least one easily-overlooked provision. Constraint: fixtures must be *synthetic* purchase agreements (CAR forms are copyrighted) that still exercise the real extraction pipeline
- **Telemetry events** — the automatic-capture list (video watched, first click, per-mission timing, source-link opens, corrections attempted, hints, skips, drop-off point, device, return visits, own-documents volunteering)
- **Invite/personalization model** — per-agent tokens, first name, personal note, participant number; no auth

**Design cue:** the comparison-view mockup family in `docside-experience/07-screen-design/` (`comparison-view-mockup.html`, `-v2`, `-v3`) is the founder-preferred visual reference for First Look surfaces.

## Phase 2 — Architecture decisions (before building)

The big unresolved question: the First Look shell is separate, but it **launches the real app in a controlled preview state**. The main `docside` app therefore needs a preview mode — seeded workspace, entered via signed token, sandboxed from real data. That is cross-repo work and must clear `docside`'s §17 one-sentence test. Options: preview-tenant in the existing Supabase project vs. a dedicated preview environment.

Also to decide in this phase:

- Where survey responses + telemetry land (likely a small set of Supabase tables)
- Founder-video hosting
- Audio-response recording mechanism (debrief Part 8)
- Scheduling link (e.g., Calendly) for "talk with Morris"

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

1. Is the main app's verify/compare/share flow stable enough today for missions 1–4, or does First Look plan against a target milestone in `docside/docs/PLAN.md`?
2. Founder video — recorded already, or should the brief include a script draft?
3. "GS Retrofit" personalization line in the original doc — leftover or meaningful? (Omitted for now.)
