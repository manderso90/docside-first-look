# Docside First Look — Claude Code Project Memory

Read this once at the start of every session in this repo.

## What this repo is

**Docside First Look** is the guided preview & product-research experience for Docside — personalized invite links at `preview.docside.ai/<invite-code>` that walk a small group of selected real estate agents through a realistic multi-offer scenario inside the real Docside app, and capture structured, candid feedback.

It is a **research instrument, not a marketing page**. Its job is to answer: *Can Docside explain itself, or does Morris have to explain it?* — and to surface what agents trust, what confuses them, and what's missing.

Source-of-truth documents in this repo:

- **`docs/VISION.md`** — the founding vision brief (imported from Morris's Google Doc). The experience design decisions live here.
- **`docs/PLAN.md`** — the phased build plan for this repo.

## The three Docside repos

| Repo | Location | Role |
|---|---|---|
| `docside` | `~/Projects-clean/docside` | The product — Next.js app, Supabase, extraction pipeline. Its `CLAUDE.md`, `docs/STATEMENT.md`, and `docs/PLAN.md` are **locked** sources of truth. |
| `docside-experience` | `~/Projects-clean/docside-experience` | Design system, trust doctrine, IA, screen specs. Start at `NORTH-STAR.md`. |
| `docside-first-look` | this repo | The preview/research experience shell. |

**Inheritance rule:** brand, trust doctrine, language rules, and stack decisions are made in the other two repos and *inherited* here — never re-decided here. When in doubt, read the sibling repo's doc rather than improvising.

Key inherited constraints (see `docside/CLAUDE.md` for the full list):

- **Brand:** Deep Ocean `#115073` (headings), Midnight Slate `#0e2735`, Paper White `#e0dfd8` background, body `#1a1a1a`. IBM Plex Sans (UI) / Mono (data) / Serif (display). **Light mode only.** Stripe/Linear/Apple editorial calm.
- **Language rules:** "The offer states…", "The contract specifies…" — never advice, never "you should accept", never claims of legal effect.
- **Trust architecture:** every AI claim has a source citation; no 1.0 confidence; honest uncertainty over guessed values.
- **Stack:** Next.js 15 App Router + TypeScript, pnpm, Tailwind 4 (CSS-first tokens), shadcn/ui + Radix + Lucide, Supabase, Vercel, react-hook-form + zod.
- **Deployment target:** separate Vercel project `docside-first-look` → `preview.docside.ai`. Never reference `docside.com`.

**Design cue (founder preference, 2026-08-03):** Morris likes the look of `docside-experience/07-screen-design/comparison-view-mockup.html` (and its v2/v3 iterations). Use that mockup family as the visual reference point for First Look surfaces. Read-only copies of these mockups (plus the verify-workspace mockup) are vendored in `design-reference/` in this repo — open those when the sibling repo is not available (e.g., cloud sessions).

## First Look hard rules (from the vision doc)

- **~12 minutes total** (never exceed ~15–20). Concentrate on 3–5 meaningful actions.
- **No account creation, no passwords.** The personalized link admits the agent directly.
- **No mandatory document uploads.** Agents work with the seeded scenario; using their own documents is an *optional* offer at the end.
- **Launch the real app in a controlled preview state** — never build a fake reproduction of Docside unless a portion of the real app is too unstable to test.
- **Identical core workflow for every participant** so feedback is comparable. Personalize the wrapper (name, note, participant number), never the product behavior.
- **Capture the first impression before explaining anything** ("Based on what you see, what do you believe Docside does?").
- **No leading questions** ("How helpful was the comparison?" is banned). Ask "Was there anything you would hesitate to rely upon?" not "Did you trust it?"
- **No confetti, points, badges, ten-step tours, tooltip blankets, or 5-minute explainer videos.**
- **Honest early-version framing:** "This is an early working version. Some portions are incomplete. Please evaluate what is present rather than what has been promised."
- **Behavior over praise:** task completion, timing, source-link opens, and drop-off points carry more weight than positive comments.

## The moment to protect

> The agent sees an important offer term, questions it, clicks it, and Docside immediately takes them to the exact place in the purchase agreement that supports it.

**Summary → extracted value → original source language.** Every design decision in this repo is subordinate to making that moment land. Docside does not merely provide an answer; it helps the agent understand and verify the answer.

## The experience skeleton (seven screens, four missions)

1. Personalized welcome (invited by name, why they were selected, three expectations)
2. First-impression question (before any explanation)
3. Founder video (45–60s; problem → what Docside attempts → what they'll experience → why candor matters)
4. Transaction scenario: listing agent for **1248 Oakview Drive**, three offers received
5. Four-mission workspace: **understand an offer → verify what Docside found → compare the offers → prepare the seller conversation** (persistent "Your Preview: N of 4" indicator)
6. Structured debrief (eight parts — see `docs/VISION.md`)
7. Personalized thank-you + Founding Preview Participant designation + optional next steps

## Working style

- Sample data is **synthetic and fictional** — realistic terms, fictional buyers. CAR forms are copyrighted; fixtures must be original synthetic documents that still exercise the real extraction pipeline.
- Anything that touches the main app (preview mode, seeded workspace, tokens) is cross-repo work: check it against `docside`'s §17 one-sentence test and surface it explicitly before building.
- Secrets never committed. `.env.local` is gitignored.
- Keep commits small and named after the phase/milestone.
