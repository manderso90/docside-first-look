# UI vocabulary promotion plan

Status: **written 2026-08-11, not yet executed.** This is checkpoint step 5 of
the UI lab (`/ui-lab`): the plan that must exist before any production screen
changes. Inputs: the lab build (commits `4454a8e…dacfcd0`), the founder
palette decision (2026-08-11: Docside tokens, srcchip border 1.5px), and the
containment/contrast/a11y findings recorded in the lab scripts.

**Decision still owed (checkpoint step 3):** where the vocabulary promotes.
This plan PROPOSES: **Stage A (First Look shell, this repo) now-ish; Stage B
(main docside app) only after at least one First Look feedback round** shows
the vocabulary earns it — measured by behavior (source-chip opens, task
completion, drop-off), not praise. Rationale: the shell is cheap, fenced, and
ours; the app is live product in a different styling regime, and First Look
exists precisely to learn before making that bet.

---

## Stage A — promote into the First Look shell (this repo)

> **Execution status (2026-08-11):** A1 ✓ (`dca4804`) · A2 ✓ (`be8f489` —
> includes the dev switch to Turbopack: the webpack dev server corrupts
> client chunks probabilistically once the vocabulary stylesheet is global;
> under Turbopack the containment capture is byte-identical to the webpack
> baseline) · A3+A4 ✓ (`Stage A3` commit — all five gates green; review
> package with the founder pending) · A3 review ✓ (founder approved the
> visual direction 2026-08-12; next-step buttons flattened to equal weight,
> home glyph removed from the pass, prod-mode capture byte-identical to dev)
> · A5 ✓ 2026-08-12 (fixtures.ts, /ui-lab/dashboard, ui-lab-shots.mjs and
> the DOCSIDE_FIXTURES_DIR entry deleted; gated gallery kept). **Nothing
> pushed/deployed — mid-cohort rule; all of Stage A sits on local branch
> `stage-a-ui-promotion`, main reset to origin/main.**

### A1. Token merge into `src/app/globals.css` `@theme`

The duplication register (header of `src/components/first-look-ui/first-look-ui.css`)
is the worklist. Principles:

- **Keep the repo's semantic names** (`--color-paper`, `--color-surface`,
  `--color-ink-*`…). They are consumed by every shipped screen; the fence
  names (`--canvas`, `--card`…) map onto them during component migration.
- **Add what's missing:** `--shadow-pop`; the exploration's softer line
  `#dcdbd4` (new name, e.g. `--color-line-soft` — note the register's crossed
  naming: fence `--line-2` = repo `--color-line`); the deeper success step
  `#35682c` (see next point).
- **Success-ramp shift:** repo `--color-success-deep` (#3f7a2e) is the fence's
  `--success`, and the fence's `--success-deep` (#35682c) is absent. Fix by
  renaming repo's to `--color-success` and adding `--color-success-deep:
  #35682c` — a small breaking rename; grep shell usages first.
- **Do NOT mutate tokens live screens consume mid-cohort.** The two drift
  values (`--ink-3` #6d6d69 vs repo #434341; line naming) change how shipped
  screens render if merged in place. Introduce new tokens (e.g.
  `--color-ink-soft`) now; converge/rename only in a between-cohorts window.
- Widen the root layout's Plex Mono load to 400/500/600/700; delete the fence
  `fonts.ts` instance and point `--font-mono` users at the root variable.

### A2. Move the primitives out of the fence

- `src/components/first-look-ui/{source-chip,chip,tier-badge,button,card,micro-timeline,icons}.tsx`
  move to the shell's shared component home (alongside `src/components/ui.tsx`).
- The fence stylesheet's rules move to `globals.css` (or a plainly-imported
  global sheet) with `[data-fl]` stripped from every selector and the `fl-`
  keyframe prefix dropped/merged with `fadeIn`. Mechanical; the fence audit
  script retires with the fence.
- Delete fence apparatus as it becomes moot: `surface.tsx` (wrapper),
  `lab-link.tsx` (`LabA` → `next/link`; the webpack hazard is a property of
  the *fenced dev subtree*, not of the components), and eventually
  `lab-gate.tsx`.
- Keep the plain-CSS class idiom through the migration (values stay exact);
  converging to Tailwind utilities is optional later work, noted as an idiom
  tension with the existing `ui.tsx` components.

### A3. Re-skin the shell screens — behavior-frozen, ordered by risk

Wording and flow do NOT change (BRIEF §7 wording is FINAL; the e2e suite
asserts copy verbatim and is the safety net — it should pass untouched).
Order:

1. `link-inactive` / `not-found` (static, lowest risk)
2. `welcome`, `first-impression`, `scenario` (single-action screens)
3. `workspace` interstitial
4. `thank-you` — adopt the exploration's pass card + draw-on check
   (confetti-free per the hard rules)
5. `debrief` stepper — LAST: stateful, mid-flow for live participants; visual
   re-skin of `stepper.tsx` with the actions/store contract untouched

**Timing rule:** never mid-cohort. Participants within a cohort must see an
identical experience (comparability hard rule); ship between feedback rounds.

**Verification per step — e2e copy assertions are the behavior freeze, not
the whole gate (founder adjustment 2026-08-11).** Each re-skinned screen
passes ALL of:

1. build/tsc/lint/e2e green (behavior + wording frozen);
2. **targeted visual check** — before/after captures
   (`scripts/ui-lab-containment.mjs`-style) where the *diffs are the
   deliverable*, reviewed by Morris per screen;
3. **mobile screenshots** at 375px, including the no-horizontal-scroll rule
   (existing `checkpoint` helper) and sticky/fixed elements in-viewport;
4. **keyboard traversal** — tab-walk reaches every interactive control on the
   screen with a visible focus state (adapt the walk from
   `scripts/ui-lab-shots.mjs`);
5. **contrast verification** — `scripts/ui-lab-contrast-audit.mjs` extended
   to the screen's actual fg/bg pairings; no pairing under 4.5:1 ships
   without an explicit founder acceptance note.

### A4. Fixes folded into promotion (accepted findings, from the contrast audit)

- `chip.warn` 3.83:1 — add a deeper attention text step (e.g.
  `--color-attention-deep`) for text-on-soft, keeping the badge/border family.
- `btn-ghost` 4.39:1 — darken ghost text one ink step, or reserve ghost for
  non-essential actions only.
- SourceChip stays honestly inert in the shell; its real click-through is
  app-side work (Stage B) — the chip's aria/title language carries that until
  then.

### A5. Lab decommission (end of Stage A)

- **Delete** `src/lib/first-look-ui/fixtures.ts` (checkpoint step 4 — the
  real-data stress loader; privacy surface minimization) and the
  `DOCSIDE_FIXTURES_DIR` env entry. Keep `scenario-oakview.ts` as the synthetic
  dataset for future design checks.
- **Keep `/ui-lab` as the dev-only gallery/styleguide** (gate intact) while
  useful; **delete `/ui-lab/dashboard`** once Stage B owns the real screen —
  the dashboard is a mock of an app-side surface and must never become
  participant-facing in the shell ("never build a fake reproduction" hard rule).

---

## Stage B — main docside app (gated; plan at sketch level by design)

**Gate (concrete — founder adjustment 2026-08-11; not vibes):** Stage B opens
only after one full feedback round, run on the Stage-A-skinned shell, meets
pre-registered criteria on the four dimensions below. Thresholds are set and
written down BEFORE the round starts (suggested defaults in parentheses;
adjust when instrumenting, never after reading the data):

1. **Comprehension** — first-impression + debrief Part 1: participants can
   describe what Docside does without Morris explaining (default: ≥ 2/3 of
   the cohort, judged blind against a pre-written rubric).
2. **Verification behavior** — event data shows participants actually open
   source language during missions (default: a majority of participants
   record ≥ 1 source-open; the moment-to-protect is exercised, not just
   present).
3. **Friction attribution** — debrief Parts 3/5: no repeated
   hesitation/confusion pattern that names the new vocabulary itself (chips,
   references, comparison table) as the cause (default: < 2 participants).
4. **Commitment** — debrief Part 7 answers no worse than the prior round
   (default: share of "Yes, now / Yes, after improvements" does not drop).

Task completion and drop-off (stage events) are the tiebreaker: any
regression vs the prior cohort blocks Stage B regardless of the above.

Then plan Stage B properly in the docside repo — this section is the shape,
not the plan.

**Prerequisite 0 — Paper White decision (before token mapping, not during
implementation):** the canvas fork — `#e0dfd8` (Statement §15 Paper White,
locked) vs `#ecece8` (v3 mockup / this repo) — is decided in the docside
repo, per the inheritance rule and the §17 one-sentence test, as the FIRST
Stage B act. No Stage B token mapping starts until this is resolved; deferred
is fine, vague is not.

**Prerequisite 1 — SourceChip technical spike (the real Stage B risk):** the
visual fork is smaller than it looks; wiring SourceChip into the actual
citation pipeline is product-critical and gets its own spike BEFORE the
promotion is committed to. The spike proves, on one real offer in the app:
chip bound to real citations (page/text/bbox via `citation-match.ts`), the
click-through source view (summary → extracted value → original language —
the moment to protect), and the honest states (null citation, low
confidence — never a dead or lying chip). Output: a working end-to-end chip
plus an estimate; if the spike surprises, Stage B replans before any
comparison-surface work.

- **Surfaces:** `comparison-view.tsx`, `tier-section.tsx`, `offer-card.tsx`,
  `cost-allocation-table.tsx`, `properties/[id]`, `offers/[id]`, the `(app)`
  layout and `preview-banner`.
- **Regime collisions to resolve:** DM Sans (self-hosted) vs IBM Plex trio;
  shadcn's `:root` variable contract (note: `--primary #115073` already
  matches, `--radius 0.625rem` = 10px already matches, shadcn `--card` ≈
  fence `--card` — the fork is smaller than it looks); the canvas fork is
  Prerequisite 0 above.
- **Method:** reuse the proven fence pattern — scope the new tokens/styles to
  the comparison surface with a wrapper attribute first, prove containment
  with a capture harness, then flip app-wide and collapse the fence. Wire
  SourceChip to the real citation pipeline (page/text/bbox) there, replacing
  this repo's static `rpa-map.ts`.
- **Risk & verification:** the tier/scoring UI is live product; docside e2e is
  deploy-gated (tests run against the deployed app), so changes ride the
  seeded visual-check flow pre-deploy + post-deploy e2e.

---

## Standing constraints (all stages)

- Trust/language rules and brand foundations are inherited from docside docs,
  never re-decided here; any collision (canvas fork, citation binding) gets
  surfaced in the docside repo first.
- Real 12_25 fixture data never leaves the dev machine and is deleted from
  this repo's tooling at A5.
- Every step: small commit named for the step; report diffs honestly; stop at
  any containment surprise.
