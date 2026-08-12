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

**Verification per step:** build/tsc/lint/e2e green; a before/after capture
with `scripts/ui-lab-containment.mjs`-style runs where the *diffs are the
deliverable* (reviewed by Morris) rather than byte-equality; the 375px
no-horizontal-scroll rule via the existing `checkpoint` helper.

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

**Gate:** run only after ≥1 feedback round validates the vocabulary
behaviorally. Then plan it properly in the docside repo — this section is the
shape, not the plan.

- **Surfaces:** `comparison-view.tsx`, `tier-section.tsx`, `offer-card.tsx`,
  `cost-allocation-table.tsx`, `properties/[id]`, `offers/[id]`, the `(app)`
  layout and `preview-banner`.
- **Regime collisions to resolve:** DM Sans (self-hosted) vs IBM Plex trio;
  shadcn's `:root` variable contract (note: `--primary #115073` already
  matches, `--radius 0.625rem` = 10px already matches, shadcn `--card` ≈
  fence `--card` — the fork is smaller than it looks); **canvas fork
  `#e0dfd8` (Statement §15 Paper White, locked) vs `#ecece8` (v3 mockup /
  this repo)** — that conflict is decided in the docside repo per the
  inheritance rule, surfaced explicitly (§17 one-sentence test), never here.
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
