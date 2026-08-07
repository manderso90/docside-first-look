# Docside First Look — Product Brief

> **Version:** v1.2 · 2026-08-03 — Mission 1 softened to the citation-excerpt experience and seller summaries confirmed as a Cohort 1 prerequisite (founder decisions, 2026-08-03; §13 Q7–Q8). Architecture mechanics verified in `docs/ARCHITECTURE-VERIFICATION.md`.
> **Status:** Founder-reviewed. This document defines every screen, interaction, data point, feedback question, and acceptance criterion for the Docside First Look experience, plus the Phase 2 architecture decisions (§10).
>
> `docs/VISION.md` is the founding intent; this brief is the buildable spec. Where the two conflict, the Discrepancy Register (§11) records the ruling and why.

---

## §1 — Purpose & research questions

First Look is a research instrument, not a marketing page. The central question, verbatim:

> **Can Docside explain itself, or does Morris have to explain it?**

Every screen, mission, and question below exists to answer one of these research questions. Behavior outweighs praise: task completion, timing, source-link opens, and drop-off points carry more analytical weight than positive comments.

| # | Research question | Answered by |
|---|---|---|
| RQ-1 | Can Docside explain itself without a human explanation? | First-impression answer (screen 2) vs. debrief Part 1 — the headline before/after delta |
| RQ-2 | Do agents believe they can verify what Docside claims? | Mission 1 micro-question (1–5 confidence) + `source_link_opened` rate |
| RQ-3 | Will agents engage with correction rather than passively accept AI output? | Mission 2 behavior: `correction_attempted` events by mode |
| RQ-4 | Do agents trust a ranking they can interrogate but that refuses to score? | Mission 3 "Why this position" / provenance-handle opens + debrief Part 3 |
| RQ-5 | What differs between what agents need and what they'd put in front of sellers? | Mission 4 micro-question + debrief Parts 3 & 5 |
| RQ-6 | Where does Docside fit in a real workflow? | Debrief Part 4 |
| RQ-7 | Is there genuine commitment signal? | Debrief Part 7 + `own_docs_volunteered` + `schedule_clicked` |

---

## §2 — Principles & guardrails

The build is reviewed against this checklist. Each item is a hard rule inherited from `docs/VISION.md` and `CLAUDE.md`, not a preference.

- [ ] **Time:** target ~12 minutes end to end; hard ceiling 15 (see §4 budget).
- [ ] **No account creation, no passwords.** The personalized link admits the agent directly.
- [ ] **No mandatory document uploads.** Seeded scenario only; own documents are an optional offer on screen 7.
- [ ] **The real app, not a reproduction.** Screen 5 launches the actual Docside application in a controlled preview state.
- [ ] **Identical core workflow for every participant.** Personalize the wrapper (name, note, participant number) — never product behavior, scenario data, missions, or question wording.
- [ ] **First impression before explanation.** Screen 2 must render before the founder video, always.
- [ ] **No leading questions.** "How helpful was the comparison?" is banned. Ask "Was there anything you would hesitate to rely upon?" — never "Did you trust it?"
- [ ] **No confetti, points, badges, ten-step tours, tooltip blankets, or five-minute explainer videos.**
- [ ] **Honest early-version framing**, verbatim, on screen 4: *"This is an early working version. Some portions are incomplete. Please evaluate what is present rather than what has been promised."*
- [ ] **Language rules:** "The offer states…", "The contract specifies…" — never advice, never "you should accept", never claims of legal effect.
- [ ] **Trust architecture:** every AI claim carries a source citation; no 1.0 confidence; honest uncertainty over guessed values.

### The moment to protect

> The agent sees an important offer term, questions it, clicks it, and Docside immediately takes them to the exact place in the purchase agreement that supports it.

**Summary → extracted value → original source language.** Every design decision in this brief is subordinate to making that moment land. If a scope cut is ever required, cut anything before cutting this.

*v1 delivery note (founder decision, 2026-08-03 — §13 Q7):* in First Look v1, "the exact place" is delivered as the **cited excerpt** — page, clause reference, and the verbatim contract language — not in-document scroll-and-highlight navigation. The trust chain (summary → value → source language) is intact; the live document pane is the mockup's target direction for a later pass.

---

## §3 — Participant model & personalization

**Personalized (wrapper only):**

- First name in the welcome greeting, thank-you page, and follow-up email.
- A one-to-two-sentence note from Morris explaining why this agent was selected (stored per invite, written by Morris).
- Participant number ("Participant No. 007") on the thank-you page and optional participant card.
- Follow-up email references the portion they completed.

**Never personalized:** product behavior, the Oakview scenario, offer data, mission order or wording, micro-questions, debrief wording. Comparability across participants is the point.

**Lifecycle:** invited → link opened → session(s) → debrief submitted → follow-up. Links are **re-enterable**: a returning participant resumes where they left off, and the return visit is itself a tracked signal (`session_resumed`), never an error.

**Omission carried forward:** the "GS Retrofit" personalization line in the original doc remains omitted per the VISION editor's note, pending founder confirmation (§13).

---

## §4 — Experience map & time budget

| # | Screen | Stage enum | Target | Running total |
|---|---|---|---|---|
| 1 | Personalized welcome | `welcome` | 0:30 | 0:30 |
| 2 | First-impression question | `first_impression` | 0:45 | 1:15 |
| 3 | Founder video | `video` | 1:00 | 2:15 |
| 4 | Transaction scenario | `scenario` | 0:45 | 3:00 |
| 5 | Mission 1 — Understand an offer | `mission_1` | 2:00 | 5:00 |
| 5 | Mission 2 — Verify | `mission_2` | 2:00 | 7:00 |
| 5 | Mission 3 — Compare | `mission_3` | 2:00 | 9:00 |
| 5 | Mission 4 — Seller conversation | `mission_4` | 1:30 | 10:30 |
| 6 | Structured debrief | `debrief` | 2:30 | 13:00 |
| 7 | Thank-you & next steps | `thank_you` | 0:30 | ~13:30 |

Target lands under 15:00 with slack for reading speed. The `stage` values are the funnel-stage enum used by telemetry (§8); drop-off analysis is "last stage with an event."

---

## §5 — The seven screens

All shell screens (1–4, 6, 7) use the inherited visual language: DEC-27 palette (Deep Ocean `#115073` headings, Midnight Slate `#0e2735`, Paper White `#e0dfd8` background, body `#1a1a1a`), IBM Plex Sans (UI) / Mono (data) / Serif (display), light mode only, 22px horizontal gutters, 10px card / 5.5px control radii, micro-caps label register, `cubic-bezier(.16,1,.3,1)` motion, `prefers-reduced-motion` honored, `:focus-visible` 2px Deep Ocean outlines. The canonical token source is `design-reference/comparison-view-mockup-v3.html` (§11.3). Every screen ships all four UI states (loading / empty / error / success) and is mobile-checked at 375px, per docside polish practice.

### 5.1 Personalized welcome — `preview.docside.ai/<invite-code>`

**Layout.** Single centered column, generous whitespace, Stripe/Linear editorial calm. Docside wordmark small at top. Display-serif greeting, body copy, three expectation rows, one primary button.

**Copy direction.**

> **Welcome, {first_name}.**
> Morris invited you to privately preview an early version of Docside.
>
> {personal_note — e.g. "You were invited because of your experience working with real estate purchase agreements and communicating offer terms to sellers."}
>
> This is not a sales presentation. We would like your honest assessment of what Docside does well, what feels unclear, and what would make it more useful in your work.

Three expectations (icon + line): **About 12 minutes** · **No preparation required** · **Honest criticism is encouraged.**

Primary button: **Begin My Docside Preview**.

**Interactions.** One action: the button. No navigation chrome, no footer links that leak the participant out.

**States.**
- *Valid invite:* as above.
- *Revoked or expired invite:* calm, non-alarming copy — "This preview link is no longer active. If you were expecting to participate, reply to Morris's email and he'll send a fresh link." No error styling, no codes.
- *Returning participant (has prior session):* greeting becomes "Welcome back, {first_name}." and the button becomes **Continue My Preview**, resuming at the last incomplete stage.
- *Loading:* skeleton greeting; *error:* generic retry.

**Telemetry.** `invite_opened` (fires on load, with device class), `preview_started` (button click), `session_resumed` (returning path).

**Acceptance criteria.**
- `[Content]` GIVEN a valid invite, THEN the greeting renders the invite's `first_name` and `personal_note` verbatim, and no account/password/upload UI exists anywhere on the page.
- `[UX]` GIVEN a revoked invite, WHEN the page loads, THEN the inactive-link copy renders with no error styling and no invite code echoed.
- `[Telemetry]` GIVEN any load of a valid invite URL, THEN exactly one `invite_opened` event is written with device class; GIVEN a button click, THEN exactly one `preview_started` event.
- `[UX]` GIVEN a participant with a prior session, THEN the button reads "Continue My Preview" and resumes at the last incomplete stage, not the beginning.
- `[Guardrail]` States checklist: loading / revoked / returning / success all implemented; page correct at 375px.

### 5.2 First-impression question

**Layout.** Two zones: a framed, non-interactive capture of Docside's main introductory screen (static image or read-only render — enough to look at, nothing to click), and below it a single open-text prompt with a textarea and a **Continue** button. A quiet **Skip** text link sits below the button.

**Copy direction.** Exactly:

> **Based on what you see, what do you believe Docside does?**

Helper line: "A sentence or two in your own words. There are no wrong answers." No product explanation of any kind appears on this screen.

**Interactions.** Type → Continue. Skip is allowed but recorded. The screen is unreachable after the video (forward-only flow); it must always precede screen 3.

**States.** Empty textarea disables Continue (Skip remains); loading; submit-error with retained text and retry.

**Telemetry.** `first_impression_submitted` (answer text, dwell time ms), or `step_skipped` (`step: 'first_impression'`).

**Acceptance criteria.**
- `[Guardrail]` GIVEN a fresh participant, THEN this screen renders before any founder video or product explanation, in all paths including resume.
- `[Content]` GIVEN the screen, THEN the prompt wording matches the vision verbatim and no feature description, tagline, or explanatory copy is present.
- `[Telemetry]` GIVEN a submission, THEN one `first_impression_submitted` event carries the full answer text and dwell time; GIVEN a skip, THEN one `step_skipped` event.
- `[UX]` GIVEN a submit failure, THEN the participant's text is preserved and a retry is offered.

### 5.3 Founder video

**Layout.** Centered player card (16:9), title line above ("A short note from Morris — about a minute"), **Continue** button below, enabled from the start (watching is observed, not enforced).

**Copy direction.** 45–60 seconds, four beats: the problem observed → what Docside is attempting → what they will experience → why candid feedback matters. Placeholder script (pending §13 Q2), from the vision:

> Real estate agents receive some of the most important information in a transaction inside lengthy documents and email attachments. I created Docside to help make those documents easier to understand, verify, compare, and communicate.
>
> What you are about to see is an early working version — not the finished product. I would like you to approach it as though you have just received offers on one of your listings. Please use it naturally. Nothing you do will break it, and there are no wrong answers. The most helpful feedback is anything that surprises you, slows you down, or causes you not to trust what you see.

The video must not demonstrate clicks — otherwise we test whether they followed the video, not whether Docside is understandable.

**Interactions.** Native HTML5 player (AD-5): play/pause/scrub, WebVTT captions on by default, no autoplay with sound. Continue proceeds regardless of playback state.

**States.** Poster frame before play; playback-error state offers a one-line text summary of the four beats plus Continue (the experience never dead-ends on a codec).

**Telemetry.** `video_started`, `video_quartile` (25/50/75/100 from `timeupdate`), `video_completed` (≥90% reached — the "watched" definition), `video_skipped` (Continue before 25%).

**Acceptance criteria.**
- `[UX]` GIVEN the screen loads, THEN the video never autoplays with sound and captions are available and default-on.
- `[Telemetry]` GIVEN playback crossing each quartile, THEN one `video_quartile` event per quartile per session, and `video_completed` fires exactly once at ≥90%.
- `[UX]` GIVEN a playback failure, THEN the fallback text summary renders and Continue still works.
- `[Guardrail]` GIVEN the final cut, THEN runtime is ≤75 seconds and contains no click-by-click product demonstration.

### 5.4 Transaction scenario

**Layout.** An assignment card — the calm briefing before the app. Property line, assignment paragraph, the three buyer names as quiet chips (Chen · Reyes · Okafor), a preview of the mission indicator ("Your Preview: 1 of 4"), the early-version framing, and the launch button.

**Copy direction.**

> **Your assignment**
> You are the listing agent for **1248 Oakview Drive**. Three purchase offers have been received. Your seller would like help understanding the differences before deciding how to respond.
>
> This is an early working version. Some portions are incomplete. Please evaluate what is present rather than what has been promised.

Button: **Open the Oakview offers**. Sub-line: "Nothing you do here will break anything, and nothing will actually be sent to anyone."

**Interactions.** One action: launch. This is the redirect boundary (AD-2): the button navigates to `app.docside.ai` carrying the preview-session token per the AD-3 handoff rules (token never in a persistent URL; scrubbed from history on arrival).

**States.** Loading (token mint in flight, button shows quiet spinner); mint-failure error with retry; success = redirect.

**Telemetry.** `scenario_viewed` (on load), `workspace_launched` (on redirect).

**Acceptance criteria.**
- `[Content]` GIVEN the card, THEN the early-version framing sentence appears verbatim, and the sandbox promise ("nothing will actually be sent") is present.
- `[Telemetry]` GIVEN the redirect, THEN `workspace_launched` is written before navigation (keepalive fetch per AD-4), and the preview token never persists in browser history on either origin (fragment or POST handoff + `history.replaceState` scrub on arrival, per AD-3).
- `[UX]` GIVEN token-mint failure, THEN the participant sees a retry, not a dead end.

### 5.5 Four-mission workspace (the real app in preview mode)

This screen *is* the Docside application at `app.docside.ai`, entered with a preview-session token. The shell does not render it; the main app, detecting preview mode, adds **First Look mission chrome**:

**Layout.** The app's own verify workspace and comparison view (per the `design-reference/` mockups) plus:
- A persistent, slim **mission bar**: "Your Preview: {N} of 4" + the current task statement, collapsible but never dismissible. Desktop: top edge, below the app context bar. Mobile: pinned bottom, above the app's bottom sheets.
- **Micro-question interstitials** between missions: a modal card with one question (wording in §6), an optional-comment affordance, and Continue. Interstitials never block more than one question at a time.
- A per-mission **hint affordance** ("Show me where to start") — one hint per mission, recorded, revealing a single pointer (e.g., outlining the offers list), never a tooltip tour.
- A quiet **Skip this step** link per mission — recorded, moves to the next mission.
- After Mission 4's interstitial: automatic return redirect to `preview.docside.ai/<code>/debrief`.

**Sandbox promises the UI must communicate** (and the backend must enforce, AD-1): nothing breaks; nothing is sent (Mission 4 share is stubbed with an explicit banner); no real data is touched (the workspace is the participant's own isolated copy).

**States.** Token-expired mid-session (≥2h idle): the app shows "Your preview session paused — reopen your invite link to continue" (resume works per §3). App-error states are the app's own; the mission bar persists through them.

**Telemetry** (fired from the app via the beacon helper, AD-4): `mission_started` / `mission_completed` (mission N, duration ms), `first_click` (first interactive element after workspace load — element id + region), `source_link_opened` (field, ref), `correction_attempted` (field, mode), `hint_requested` (mission), `step_skipped` (mission), `micro_question_answered` (mission, value, comment).

**Acceptance criteria.**
- `[UX]` GIVEN any moment inside missions 1–4, THEN the mission bar shows the current mission number and task statement, on desktop and mobile.
- `[Guardrail]` GIVEN the preview workspace, THEN every mutation lands only in the participant's cloned workspace; no query can read another workspace; all outbound send/share actions are server-stubbed (verified by attempting each).
- `[Telemetry]` GIVEN a participant completing all four missions, THEN the events table contains four `mission_started`/`mission_completed` pairs with plausible durations and exactly one `first_click`.
- `[UX]` GIVEN an expired token, THEN the pause message renders and re-entering the invite link resumes at the current mission.

### 5.6 Structured debrief — `preview.docside.ai/<code>/debrief`

**Layout.** One part per step, quiet progress ("3 of 8"), single question per view, no grid-of-radio-buttons survey feel. Back allowed within the debrief.

**Copy direction.** Exact wording in §7. Intro line: "Eight short questions. Blunt answers are the most useful kind."

**Interactions.** Each part saves on advance (partial completion preserved — drop-off keeps earlier answers). Part 8 offers three channels: type / record audio / schedule a conversation.

**States.** Per-part save failure retains the answer and retries; audio-permission-denied falls back to text seamlessly (no error tone, just the textarea); resume lands on the first unanswered part.

**Telemetry.** `debrief_part_submitted` (part 1–8, answer payload), `audio_recorded` (duration), `schedule_clicked`.

**Acceptance criteria.**
- `[Content]` GIVEN any part, THEN its wording matches §7 exactly — any deviation is a build bug.
- `[UX]` GIVEN a participant who answers parts 1–3 and closes the tab, THEN parts 1–3 are stored and re-entry resumes at part 4.
- `[UX]` GIVEN a denied microphone permission, THEN the text channel is presented without an error state.
- `[Telemetry]` GIVEN each advance, THEN one `debrief_part_submitted` event per part, at most once per part per participant (latest wins on back-edit).

### 5.7 Thank-you & next steps

**Layout.** Personal thank-you headline, a small quiet summary (not gamified), the participant designation, and three optional next-step choices as equal-weight buttons. Optionally a tasteful participant card.

**Copy direction.**

> **Thank you, {first_name}. You helped shape Docside.**
> Your feedback will be reviewed directly by Morris and used to determine what Docside should become next.

Summary line: "Four activities completed · Feedback submitted · **Founding Preview Participant**." Card (if built, §13): "Docside Founding Agent Preview — Participant No. {number}." Appreciative, never gimmicky: no confetti, no badges, no animation beyond a gentle fade.

Three choices: **Try Docside with my own documents** · **Join the next feedback round** · **I'm finished for now.**

**Interactions.** Own-documents choice records the volunteer signal and shows "Morris will follow up personally to set this up" (no upload here — the follow-up is human). Next-round choice records opt-in. Finished ends gracefully.

**States.** If the debrief was partially completed (participant navigated here via drop-off recovery), the summary reflects reality ("Three of four activities completed") — the page never overstates.

**Telemetry.** `preview_completed`, `own_docs_volunteered`, `next_round_opted`, `schedule_clicked` (if the Part 8 link is repeated here).

**Acceptance criteria.**
- `[Content]` GIVEN completion, THEN the thank-you renders the participant's first name and participant number, and contains no confetti/points/badge visuals.
- `[Guardrail]` GIVEN partial completion, THEN the summary reports the true count of completed activities.
- `[Telemetry]` GIVEN the own-documents choice, THEN one `own_docs_volunteered` event; no upload UI appears.

---

## §6 — The four missions

Missions run inside the real app (screen 5.5). Mission-to-mockup mapping: **Missions 1–2 → `verify-workspace-mockup.html`** (icon rail, context bar, 40/60 split — source contract left, "the reading" right; `§→¶` citations; click-to-scroll-and-highlight with "the source" pin; "Needs your attention" queue; High-stakes tags; confirm/corrected/unreadable resolve modes; inline edit; share gate; mobile "In the contract" bottom sheet). *Softening (founder decision, 2026-08-03 — §13 Q7): the mockup's live document pane / scroll-and-highlight behaviors are **not** in v1 scope; v1 ships the citation-excerpt experience the app has today (page + clause + verbatim excerpt per field). The rest of the verify-workspace vocabulary (queues, tags, resolve modes, share gate) applies as built.* **Mission 3 → `comparison-view-mockup-v3.html`** (real table semantics; ranking-basis line; lexicographic Customize reorder — no sliders; per-cell provenance handles, citation or dashed system-formula; "Why this position"; pairwise delta popover; "Order withheld"/"Near-tie" bands; five-string absence grammar; "Other terms — not ranked, quoted verbatim"). **Mission 4 → seller mode** (agent chrome removed from the DOM; no scores/stars/totals/"best offer" anywhere).

Fixture values cited below are canonical per Appendix A.

### Mission 1 — Understand an offer

**Task statement (mission bar):**
> Open the **Okafor** offer and find its purchase price, financing type, deposit, and proposed closing date.

Okafor is chosen deliberately: all-cash and cleanly extracted — the purest first encounter with summary → extracted value → original source language, with no correction noise. It also exposes the honest absence grammar ("Not applicable — all-cash purchase") on the financing detail fields.

**Success definition (observable).** All four fields viewed. **Deliberately excluded from success:** clicking a `§→¶` citation. RQ-2 asks whether agents discover provenance *naturally*; requiring the click would turn the mission into instruction-following and contaminate the signal. `source_link_opened` during Mission 1 is instead the primary RQ-2 behavioral signal (unprompted-discovery rate), and Mission 2's task copy introduces source-checking explicitly for anyone who hasn't found it — so no participant leaves the workspace without encountering the trust moment.

**Micro-question (interstitial after mission).**
> How confident are you that you could verify where Docside found this information?
> (1 = not at all confident … 5 = completely confident) · Optional comment.

**Telemetry.** `mission_started/completed(1)`, `source_link_opened` per citation click, `hint_requested`, `micro_question_answered(1, value, comment)`.

**Acceptance criteria.**
- `[UX]` GIVEN the Okafor reading on screen, WHEN the participant clicks the purchase-price row's `§→¶` citation, THEN the cited source excerpt — page, clause reference, and the verbatim contract language — is revealed within 400 ms of the click. *(v1 excerpt experience per §13 Q7; no document pane or scroll-to-paragraph.)*
- `[Telemetry]` GIVEN that click, THEN exactly one `source_link_opened` event with `{mission: 1, field: "purchase_price", ref: "§3A → ¶5"}` and a server timestamp.
- `[Guardrail]` GIVEN any extracted-field row, THEN it renders either a `§→¶` citation or exactly one of the five absence strings, verbatim — no value without provenance; absence strings never collapsed or paraphrased.
- `[UX]` GIVEN a viewport under 768px, WHEN a citation is tapped, THEN the same excerpt (page + clause + verbatim language) is fully readable — no truncation, no horizontal scroll.
- `[Content]` GIVEN the Okafor financing detail fields, THEN they render "Not applicable — all-cash purchase" — never blank, never invented.

### Mission 2 — Verify what Docside found

**Task statement:**
> Review the highlighted terms on the **Reyes** offer and confirm whether Docside read them correctly.

The Reyes offer ships with two planted verification moments (Appendix A): the purchase price is flagged low-confidence in "Needs your attention" — Docside's read is **$1,260,000** while the source paragraph states **$1,250,000** (the participant can catch and correct it) — and the **$5,000 seller credit** is flagged **High stakes** for confirmation. Four actions are available on any flagged field: **Confirm** · **Correct** · **Mark for further review** · **Inspect the source language** (the cited excerpt — v1 excerpt experience per §13 Q7).

**Resolution vocabulary (canonical).** There are three *terminal* resolution states, matching the verify-workspace mockup: `confirm` (value accepted), `corrected` (value replaced; original read travels), `unreadable` (marked as unreadable; renders the absence string). **Mark for further review is not a fourth terminal state** — it is a non-terminal flag (`review`) that keeps the field open: the attention card stays in the queue, and a high-stakes field marked for review keeps the share gate engaged. The share gate releases only when every high-stakes field reaches a terminal state.

**Success definition.** At least one flagged field resolved via any mode (confirm, correct, or mark-for-review).

**Micro-question.**
> Was there anything in this step you would want handled differently? · Open text, optional.

**Telemetry.** `mission_started/completed(2)`, `correction_attempted` (field, mode: confirm | corrected | unreadable | review), `source_link_opened`, `micro_question_answered(2)`.

**Acceptance criteria.**
- `[UX]` GIVEN the Reyes price card in "Needs your attention", WHEN the participant corrects $1,260,000 → $1,250,000, THEN the reading updates, the row shows the corrected chip with "original read: $1,260,000", and every downstream figure derived from price (net) recomputes.
- `[Guardrail]` GIVEN unresolved high-stakes fields, THEN the share affordance is visibly gated with the count ("1 high-stakes field still needs you"); GIVEN all resolved, THEN it reads ready-to-share — but sharing remains stubbed (Mission 4 promise).
- `[Telemetry]` GIVEN each resolve action, THEN one `correction_attempted` event with the field and mode actually used (`confirm | corrected | unreadable | review`).
- `[Guardrail]` GIVEN a high-stakes field marked for review (`review`), THEN it remains in "Needs your attention" and the share gate remains engaged — review never releases the gate.
- `[Content]` GIVEN a corrected field that later appears anywhere (comparison, seller view), THEN the original read travels with it — corrections are never silent.

### Mission 3 — Compare the offers

**Task statement:**
> Your seller cares most about **net proceeds, certainty, and closing within 30 days**. Which offer would you discuss first?

The comparison opens with the ranking-basis line always visible: "Ranked by: net to seller ▸ contingencies ▸ financing strength ▸ close speed" (Customize can reorder priorities — reorder only, no sliders or weights; the ranker is lexicographic). **Chen's net is suppressed**, and the expected state is exact so implementation and research interpretation cannot drift: Chen's net cell renders "We couldn't read this field" (dashed treatment); because the first-priority dimension is unreadable for Chen, **Chen is held out of the ranked order** — rendered in the withheld position (`—` instead of a rank number) with the reason "Net to seller couldn't be read — resolve it to place this offer" and a link into the verify workspace — while **Reyes and Okafor rank normally** on the full priority list. The overall ranking is neither withheld entirely nor guessed: Docside ranks what it can trace and refuses only what it can't. Resolving Chen's comp field (in verify) places Chen in the order — at 2.5%, first. Participants see honest refusal with a payoff, not just clean success. This is the shipped scenario, deliberately (Appendix A; §11.6). Docside never names a "best" offer; it shows how the offers differ, the seller's stated priorities, and the information behind the presentation — every cell carries a provenance handle (`§→¶` citation or the dashed system formula, e.g. `net = §3A price − §3G(1) credit − §3G(3) comp`).

**Success definition.** An offer selected in the interstitial AND at least one provenance handle or "Why this position" opened during the mission.

**Micro-question.**
> Which offer would you discuss with your seller first — and what made you choose it? · Offer picker + open text. (The answer is research data as much as feedback.)

**Telemetry.** `mission_started/completed(3)`, `source_link_opened` (provenance handles count here, with `surface: 'comparison'`), `micro_question_answered(3, offer, reason)`; "Why this position" opens fire `source_link_opened` with `field: 'position_rationale'`.

**Acceptance criteria.**
- `[Guardrail]` GIVEN the comparison view in any state, THEN no score, star, total, percentage-match, or "best offer" language renders anywhere (the mockup self-check list is the audit).
- `[UX]` GIVEN Chen's suppressed net, THEN the cell renders "We couldn't read this field" with a dashed treatment, Chen shows `—` in place of a rank with the resolve reason and a link into verify, Reyes and Okafor carry rank numbers, and the ranking-basis line remains visible.
- `[UX]` GIVEN Chen's comp field resolved in verify, WHEN the participant returns to the comparison, THEN Chen enters the ranked order and the change is announced via the `aria-live` region.
- `[UX]` GIVEN a click on any cell's provenance handle, THEN the per-offer detail opens showing value + `§→¶` reference (or system formula), with a working "Open in the verify workspace" link.
- `[Content]` GIVEN the unranked extras ("Other terms — not ranked"), THEN Chen's rent-back request and Reyes's personal-property inclusion appear as verbatim contract quotes, never scored into the order.
- `[UX]` GIVEN a priority reorder via Customize, THEN the order updates with the FLIP animation (instant under `prefers-reduced-motion`) and an `aria-live` announcement of the new order.

### Mission 4 — Prepare the seller conversation

**Task statement:**
> Preview the summary you might share with your seller. What would you change before sending it?

The participant opens the seller-mode preview of the share view: agent chrome (dev tools, Customize, corrections UI, "Why this position" expanders) is removed from the DOM, corrected fields carry their original reads, and the suppressed net travels as visible-but-excluded. A persistent banner states: **"This is a preview — nothing will be sent."** The share/send action is stubbed server-side; activating it produces a confirmation of the stub, never a send.

**Success definition.** Seller preview opened AND the micro-question answered or explicitly skipped.

**Micro-question.**
> Looking at this seller view: what would you add, remove, or explain differently? · Open text.

**Telemetry.** `mission_started/completed(4)`, `micro_question_answered(4)`, plus a `source_link_opened` with `surface: 'seller_preview'` if provenance is inspected there.

**Acceptance criteria.**
- `[Guardrail]` GIVEN seller mode, THEN agent-only chrome is absent from the DOM (not merely hidden), and no send/email/SMS leaves the system when share is activated (verified by attempting it).
- `[Content]` GIVEN the seller view, THEN the "This is a preview — nothing will be sent." banner is persistent, and the trust framing renders: ranked by the priorities the agent set, an input to the decision — not the decision.
- `[UX]` GIVEN the corrected Reyes price in the seller view, THEN the correction and its original read are visible per the corrections-travel rule.

---

## §7 — The debrief instrument

Eight parts, one per step, wording final. Ordering rationale: understanding first (Part 1) so it is uncontaminated by the value/trust discussion that follows; commitment (Part 7) late, after the participant has formed judgments; open channel last. No 1–10 ratings; no leading constructions.

| Part | Exact wording | Format |
|---|---|---|
| 1. Understanding | Now that you have used it, how would you describe Docside to another real estate agent? | Open text. *(Analysis pairs this with the screen-2 first impression — the headline RQ-1 delta.)* |
| 2. Value | Which part of Docside felt most valuable? | Single choice: Understanding an individual offer · Verifying contract terms · Comparing multiple offers · Preparing information for the seller · None yet |
| 3. Trust | Was there anything you saw that you would hesitate to rely upon? | Open text |
| 4. Workflow fit | At what point in your normal workflow could you see yourself using Docside? | Single choice: When the first offer arrives · When multiple offers have been received · Before presenting to the seller · During counteroffers · After acceptance · I do not yet see where it fits |
| 5. Friction | What was the most confusing or difficult part? | Open text |
| 6. Missing capability | What would Docside need before you would use it on an active listing? | Open text |
| 7. Commitment | Would you be willing to use Docside with one of your own offer packages? | Single choice: Yes, now · Yes, after certain improvements · Possibly, but I need more information · No |
| 8. Open response | Anything else — in whatever form is easiest. | Three channels: **Type feedback** (textarea) · **Record an audio response** (≤3 min; consent copy shown before the mic permission request: "Recording starts only when you press the button, and only Morris hears it."; denied permission falls back to text) · **Schedule a short conversation with Morris** (outbound scheduling link carrying the participant code) |

Editing rule: any future wording change must cite the no-leading-questions rule in a one-line justification next to the edit.

---

## §8 — Telemetry event schema

**Common envelope on every event:** `event_id` (uuid), `participant_id`, `session_id`, `stage` (§4 enum), `ts_client`, `ts_server` (stamped at the ingestion route), `device` (`desktop | mobile | tablet`, from viewport + UA), plus **version fields**: `brief_version` (this document's version), `fixture_version` (Appendix A dataset version), `shell_commit_sha`, `app_commit_sha` (for app-originated events), and `pipeline_version` (nullable; the extraction-pipeline version that produced the golden seed). Version fields are stamped server-side at ingestion from deploy metadata — clients never self-report them. They exist so Cohort 1 data remains interpretable after the fix pass: any change between cohorts (copy, fixtures, app build) is visible in the data, and cross-cohort comparisons filter on them. Events are **append-only**: the `events` table grants insert only — no update or delete (AD-4).

**Payload hygiene (hard rule):** event `properties` must never contain invite codes, session tokens, email addresses, or raw request headers. Free-text answer content appears only in the events designed to carry it (`first_impression_submitted`, `micro_question_answered`, `debrief_part_submitted`); every other event's properties are enum/id/numeric only. The ingestion route enforces this with a per-event property allowlist — unknown properties are dropped and the drop is logged.

| Event | Properties | Fired when | From |
|---|---|---|---|
| `invite_opened` | — | Welcome page load, valid invite | shell |
| `preview_started` | — | "Begin My Docside Preview" click | shell |
| `session_resumed` | `resumed_stage` | Re-entry with a prior session | shell |
| `first_impression_submitted` | `answer`, `dwell_ms` | Screen 2 submit | shell |
| `step_skipped` | `step` | Any skip affordance (first impression, missions) | both |
| `video_started` | — | First play | shell |
| `video_quartile` | `quartile` (25/50/75/100) | Playback crosses quartile | shell |
| `video_completed` | — | ≥90% reached (the "watched" definition) | shell |
| `video_skipped` | `at_pct` | Continue before 25% played | shell |
| `scenario_viewed` | — | Screen 4 load | shell |
| `workspace_launched` | — | Redirect to app (keepalive fetch pre-navigation, AD-4) | shell |
| `mission_started` | `mission` | Mission bar advances to N | app |
| `mission_completed` | `mission`, `duration_ms` | Success definition met or skip past | app |
| `first_click` | `element_id`, `region` | First interactive click after workspace load | app |
| `source_link_opened` | `mission`, `field`, `ref`, `surface` | Any `§→¶` citation, provenance handle, or "Why this position" open | app |
| `correction_attempted` | `mission`, `field`, `mode` (confirm/corrected/unreadable/review) | Any resolve action | app |
| `hint_requested` | `mission` | Hint affordance used | app |
| `micro_question_answered` | `mission`, `value`, `comment` | Interstitial submit | app |
| `debrief_part_submitted` | `part` (1–8), `answer` | Each debrief advance | shell |
| `audio_recorded` | `duration_ms`, `storage_path` | Part 8 audio upload complete | shell |
| `schedule_clicked` | — | Scheduling link click (Part 8 or screen 7) | shell |
| `preview_completed` | — | Thank-you page load after debrief | shell |
| `own_docs_volunteered` | — | Screen 7 own-documents choice | shell |
| `next_round_opted` | — | Screen 7 next-round choice | shell |

**Derived measures (queries, not events):** drop-off point = last stage with an event per session; per-mission timing = `mission_completed.duration_ms`; return visits = sessions count per participant; watched = presence of `video_completed`.

**Session recording** (rrweb-style) is **out of v1 scope**: the moderated Cohort 1 covers observational depth, and screen recording adds a consent burden the event stream doesn't. If added later, it requires explicit permission before recording begins (§13).

---

## §9 — Invite & personalization data model

All tables live in the `first_look` schema (AD-4). Column sketches — final DDL at build time:

- **`participants`** — `id`, `first_name`, `email`, `participant_number` (the "No. 007"), `participant_ref` (a random, non-secret public reference used wherever a participant must be identified outside our systems — e.g. the scheduling link; it grants no access and is distinct from any invite code), `cohort` (1 = moderated, 2+ = self-guided), `created_at`.
- **`invites`** — `id`, `code` (~20-char high-entropy slug, unique), `participant_id`, `personal_note` (Morris's why-you line), `revoked_at`, `expires_at`, `created_at`. One active invite per participant.
- **`sessions`** — `id`, `participant_id`, `invite_id`, `started_at`, `device`, `last_stage`. One row per entry (returns = multiple rows).
- **`events`** — envelope columns + `event`, `properties` (jsonb). Insert-only.
- **`survey_responses`** — `id`, `participant_id`, `part` (1–8 + micro-question keys `m1`–`m4` + `first_impression`), `answer` (jsonb), `audio_path` (nullable, → `first-look-audio` bucket), `updated_at`. Upsert per (participant, part) — latest wins.

> **Superseded (2026-08-03, §13 Q4):** the hand-minted "Supabase-compatible preview JWT with custom claims" mechanism below was replaced by a real GoTrue session — shell calls `admin.auth.admin.generateLink({ type: 'magiclink' })` (no email sent) and hands `token_hash` to the app's `/auth/confirm` verifyOtp route; RLS keys on `auth.uid()` as for any agent. `docs/ARCHITECTURE-VERIFICATION.md` §3 is authoritative. The flow shape (code exchange, cookie, scrub, re-entrancy, ~2h bound) is unchanged.

**Token flow (AD-3 narrative):** participant opens `preview.docside.ai/<code>` → shell server validates the code against `invites` (not revoked, not expired) → creates a `sessions` row → screens 1–4 run in the shell keyed by an httpOnly session cookie (the code itself is immediately scrubbed from the address bar via `history.replaceState`) → at screen 4's launch, the shell server mints a short-lived (~2h) Supabase-compatible preview JWT — the standard Supabase role plus **custom claims** `first_look: true`, `participant_id`, `workspace_id`, `invite_id`, `session_id` (never a custom Postgres `role` value: overriding `role` would require deliberately creating and granting a DB role, and a typo there fails open in confusing ways — RLS policies key on the `first_look` claim instead) → hands off to `app.docside.ai` → the app's RLS reads the claims directly → after Mission 4 the app redirects back to `/​<code>/debrief`. Re-entry repeats the flow: the invite code always resolves to the same participant and the **same preview workspace** (see AD-1 idempotent provisioning), resuming at `last_stage`.

### §9.1 — Privacy & retention

First Look holds real personal data about real agents alongside their candid criticism; treat both carefully.

- **What is personal data here:** `first_name`, `email`, Morris's `personal_note`, audio recordings, and any free-text answer (participants may name themselves, clients, or properties). Everything else is behavioral telemetry keyed to `participant_id`.
- **Access:** feedback and audio are for Morris's review; no third-party analytics or data processors beyond Supabase/Vercel (already in the stack) and the scheduling provider (which receives only `participant_ref`, never name/email/code — the participant enters their own details there).
- **Retention:** preview workspaces TTL ~30 days after completion (AD-1). Survey responses, audio, and telemetry are retained for the research program; when the First Look program ends, audio is deleted and `participants.email` is dropped or the table is archived offline. Raw server logs containing invite-code exchanges rotate on the platform default (≤30 days).
- **Deletion on request:** a participant's request deletes their `participants` row and cascades: invites, sessions, events, survey responses, audio object, preview workspace. `participant_number` is never reissued.
- **What payloads must never contain:** see §8 payload hygiene — codes, tokens, emails, headers never enter `events.properties`.
- **Recording:** no audio or screen capture ever starts without an explicit participant action (Part 8's record button; §13.6 for any future session recording).

---

## §10 — Architecture decisions

Each decision: what we're doing, why, what was rejected. AD-1 and AD-2 touch the `docside` repo, whose CLAUDE.md requires any cross-repo change to pass its **§17 one-sentence test** (a section of `docside/CLAUDE.md`, not of this brief) — each carries that sentence as an implementation note. Their schema-level details are decisions-with-a-verification-step to confirm against the sibling repo (§13.4) — nothing here invents docside internals.

### AD-1 — Preview tenancy: flagged rows in the existing Supabase project

**Decision.** Preview workspaces live in the main docside Supabase project as flagged rows (`is_preview = true`), cloned per participant from one **golden seed workspace**, RLS-isolated via the preview JWT's `first_look` claim, TTL-cleaned ~30 days after completion.

**Provisioning is idempotent.** The **first** redemption of an invite creates the participant's clone and stores its `workspace_id` on the invite; **every later** redemption (return visits, expired-token re-entry, accidental double-click) reuses that same workspace — never a second clone. One participant, one preview workspace, for the life of the invite.

**Rationale.** (1) The seed must run through the *real* extraction pipeline, which lives in that project — a second project means deploying and version-syncing the pipeline, migrations, and storage twice, forever. (2) Extraction runs **once**, at golden-seed creation; per-participant provisioning is a row/artifact copy — fast, deterministic, and identical for every participant, which the comparability rule requires. (3) Mission 2 mutations land only in the participant's clone. (4) "Nothing an agent does touches real data" is enforced at the RLS layer: the preview JWT carries only its own `workspace_id`, preview policies deny everything else, and real-user policies exclude `is_preview` rows. (5) All outbound actions (share, email, SMS) are hard-stubbed server-side whenever `is_preview`.

**Implementation note — the `docside` repo's §17 one-sentence test:** *Docside gains a preview mode: a flagged, RLS-isolated, per-participant clone of one seeded workspace, entered by signed token, with outbound actions stubbed.*

**Rejected.** A dedicated preview Supabase project — cleaner blast radius on paper, but permanently doubles infra, migration, and secret surface for a research tool serving a dozen participants, and still requires the pipeline deployed there. The isolation it buys is achievable with one flag plus RLS.

### AD-2 — Shell/app composition: full redirect, app-rendered mission chrome

**Decision.** The shell owns screens 1–4, 6, 7. For screen 5 it redirects to `app.docside.ai` with the preview token; the app, in preview mode, renders the mission bar and micro-question interstitials and redirects back to the shell for the debrief.

**Rationale.** (1) Mobile: iOS Safari's third-party storage partitioning breaks cross-origin iframe sessions, and iframe viewport handling would wreck the 40/60 split and the bottom-sheet pattern — the trust moment cannot be risked on iframe scrolling. (2) Telemetry origination: source-link opens and corrections happen inside the app regardless of composition, so the app must be preview-aware anyway; an iframe adds a postMessage relay without removing that need. (3) The moment to protect deserves the full viewport. The cross-repo surface stays one module: token validation, mission chrome, telemetry beacon, share stub.

**Implementation note (docside §17):** covered by AD-1's sentence — the mission chrome and beacon are parts of the same preview mode.

**Rejected.** Iframe + postMessage — keeps the shell visually in control but is strictly worse on mobile storage, viewport, and telemetry plumbing.

### AD-3 — Invite tokens: capability URL → short-lived signed session token, re-entrant

> **Superseded in mechanism (2026-08-03, §13 Q4):** the custom-claims JWT described here was replaced by a real GoTrue session via `admin.auth.admin.generateLink` → `/auth/confirm` — see `docs/ARCHITECTURE-VERIFICATION.md` §3. The decision's intent (server-side exchange, short-lived, re-entrant, revocable) stands; the leak-prevention requirements below remain binding.

**Decision.** The invite code is the capability: a ~20-char unguessable slug in the URL. The shell exchanges it **server-side** for a short-lived (~2h) Supabase-compatible JWT — the standard Supabase role plus custom claims `first_look: true`, `participant_id`, `workspace_id`, `invite_id`, `session_id` (§9 flow explains why the Postgres `role` claim is left alone). Links are **re-entrant** — each entry mints a fresh token and a new session row (reusing the same preview workspace per AD-1), so return-visit tracking falls out for free. Revocation: `invites.revoked_at` checked at every exchange; the short expiry bounds the post-revocation window to ≤2h.

**Leak-prevention requirements (the code is the only secret the participant holds; it must not escape):**
- On invite-page load, the code is scrubbed from the address bar via `history.replaceState` once the httpOnly session cookie is set; subsequent shell navigation is code-free (`/debrief` routes resolve via the cookie, with the code path kept only as a re-entry alias).
- All shell and preview-mode app pages set `Referrer-Policy: no-referrer` — no outbound request may carry a code- or token-bearing URL in a referrer.
- No third-party scripts on any shell page (nothing to exfiltrate to).
- The shell→app handoff carries the session JWT via POST body or URL fragment — never a persistent query string — and the app scrubs it from history on arrival.
- Third parties never see the code or token: the scheduling link carries only the non-secret `participant_ref` (AD-5, §9).
- Codes appear in server logs only at the exchange route; tokens are never logged.

**Rejected.** Single-use tokens (break the vision's return-visit tracking and punish an accidental tab close) and long-lived tokens carried in URLs (unbounded revocation window; leak via history, referrer, and screenshots).

### AD-4 — Telemetry & survey storage: `first_look` schema, single server write path

**Decision.** The §9 tables live in a dedicated `first_look` schema of the main Supabase project. **Every** event and survey answer POSTs to the shell's `/api/events` (and `/api/responses`) route: the server authenticates the caller, validates the event against the per-event property allowlist (§8), stamps `ts_server`, `session_id`, and the version fields, and inserts with the service role. Main-app preview events use the same route (CORS-allowlisted for `app.docside.ai`) — the docside-side change is one small beacon helper. `events` is insert-only at the grant level.

**Transport & auth detail:** the primary transport is `fetch(..., { keepalive: true })` with an `Authorization: Bearer <session JWT>` header — chosen over `navigator.sendBeacon` because sendBeacon cannot set an Authorization header. Shell-originated events may instead authenticate via the httpOnly session cookie (same-origin). For the two genuinely unload-critical events (`workspace_launched`, drop-off flushes), if keepalive fetch proves unreliable the fallback is sendBeacon with a short-lived signed event token *inside the JSON body* — never an unauthenticated beacon endpoint.

**Rationale.** One validation point, one schema owner, one place to rate-limit; co-located with the preview workspaces so there is exactly one project to reason about.

**Rejected.** Client-direct Supabase inserts via anon key + RLS (spoofable properties, schema exposed to clients, validation scattered) and duplicate ingestion routes in both apps (two write paths to keep honest).

### AD-5 — Media & scheduling

**Founder video.** Static MP4 in Supabase Storage behind the shell, native HTML5 `<video>` + WebVTT captions; quartile/completed telemetry from player `timeupdate`/`ended` events; no autoplay with sound. *Rejected:* Mux (a new vendor and player dependency for one 60-second video — native events cover the telemetry) and unlisted YouTube (third-party chrome, recommendations, tracking noise).

**Audio response (debrief Part 8).** Browser MediaRecorder → webm/opus, ≤3 min cap → POST to a shell server route → private `first-look-audio` Storage bucket; `survey_responses.audio_path` links it. Consent copy precedes the permission request; denial falls back to text. *Rejected:* third-party voice-survey SaaS — another data processor for candid participant audio, against the trust posture.

**Scheduling.** Plain outbound Calendly/Cal.com link (URL from env) carrying the non-secret `participant_ref` (§9) as a query param so bookings reconcile to participants — **never the invite code or any token**, which must not reach a third party; `schedule_clicked` on click. *Rejected:* embedded scheduling widget — third-party script weight on the thank-you page for no research gain.

### Security acceptance tests (release gate for Phases 4–5)

The isolation claims above are proven, not assumed. These tests run before any external participant receives a link, and again before each cohort:

- `[Security]` GIVEN a valid preview JWT, WHEN it queries any real (non-preview) workspace, any other participant's preview workspace, or any table outside its RLS grant, THEN every query returns zero rows or a permission error — verified per table, not just per happy path.
- `[Security]` GIVEN a real authenticated docside user, WHEN they query workspaces, THEN no `is_preview` row is ever returned, and preview rows are absent from product metrics/aggregates.
- `[Security]` GIVEN a preview workspace, WHEN each outbound action (share, email, SMS — every send path enumerated) is invoked, THEN the server returns the stub response and no external delivery occurs — verified at the provider/adapter layer, not by watching the UI.
- `[Security]` GIVEN the ingestion route, WHEN called with no auth, an expired JWT, a token for a different session, an unknown event name, or off-allowlist properties, THEN the write is rejected (or the properties dropped and logged) — no unauthenticated or unvalidated row ever lands in `events`.
- `[Security]` GIVEN an expired or revoked invite, WHEN its code is exchanged, THEN no session or token is issued; GIVEN a revoked invite with a still-live JWT, THEN the JWT expires within its ≤2h window and no new token can be minted.
- `[Security]` GIVEN any shell or preview-mode page, THEN response headers include `Referrer-Policy: no-referrer`, no third-party script loads on shell pages, and no invite code or token appears in the address bar after load (AD-3 scrubbing verified in-browser).

---

## §11 — Discrepancy register

Where sources conflict, these rulings govern.

| # | Source A | Source B | Ruling | Why |
|---|---|---|---|---|
| 1 | Mockup fixtures: "1842 Pine Street, Santa Monica" | VISION + CLAUDE.md: **1248 Oakview Drive** | **1248 Oakview Drive** everywhere; mockup fixture values carry over under the new address | VISION/CLAUDE.md are locked sources of truth; the mockup address was a fixture placeholder |
| 2 | VISION Mission 1: "the Anderson offer" | Mockup fixtures: **Chen / Reyes / Okafor** | **Chen / Reyes / Okafor**; Mission 1 names the Okafor offer; "Anderson" retired | Three names are needed and the mockup set is already wired to the fixture values; "Anderson" appears to be the founder's own surname — likely a placeholder |
| 3 | Mockup v2 + verify-workspace: DM Sans / Readex Pro ("VDL §5 DECIDED" comment) | CLAUDE.md + mockup v3: **IBM Plex** Sans/Mono/Serif | **v3 is the token source of truth**; interaction spec comes from the whole mockup family (identical DOM/JS), tokens only from v3 | CLAUDE.md's inherited brand rule wins; the v2 DM Sans comment contradicts it and is flagged to Morris rather than silently inherited |
| 4 | VISION: "approximately 10–15 minutes" | CLAUDE.md: "~12 minutes" | **Target 12, hard ceiling 15**, enforced by the §4 budget | Both satisfied by the tighter reading |
| 5 | VISION's "three things" list contains two items | — | Goals restated as three, adding the memorable/appreciative ending (which VISION develops at length but omitted from its list) | Editorial repair, not a new decision |
| 6 | Mockup displays three nets incl. Chen's | Chen's buyer-broker comp is unreadable in the shipped scenario | **Chen's net ships suppressed** ("We couldn't read this field"); its post-resolution value appears only in Appendix A. Nets are recomputed so the system formula balances (mockup display values were illustrative) | First Look deliberately ships the suppressed-dimension scenario — participants must see honest refusal |
| 7 | — | — | Domain is `preview.docside.ai`; never reference `docside.com` | Restated here because this register is where implementers look |

---

## §12 — What not to build

From the vision, verbatim: a five-minute explainer video · a long product-feature presentation · a ten-step guided tour · mandatory account creation · mandatory document uploading · a survey consisting primarily of 1–10 ratings · leading questions ("How helpful was the comparison?") · confetti, points, badges, or excessive animation · promises about absent features · a polished sales pitch that makes participants reluctant to criticize · a tour that places tooltips over every button.

Additions implied by the design reference (enforced by the mockup family's own self-check):

- No scores, stars, totals, percentage-matches, or "best offer" language anywhere, in any mode.
- Never collapse or paraphrase the five absence strings ("Not specified on this form" / "Not captured on this form" / "We couldn't read this field" / "Conflicting values — needs resolution" / "Not applicable — all-cash purchase").
- No weight sliders in Customize — the ranker is lexicographic; only priority order changes.
- No dark mode (light mode only, inherited).
- No session recording in v1 (§8).

---

## §13 — Open questions

1. **App readiness.** ✅ **ANSWERED (Morris, 2026-08-03):** the main app's verify/compare/share flow is stable enough for Missions 1–4 today. First Look builds against the current app, not a future milestone; no substitution needed.
2. **Founder video.** ✅ **ANSWERED (Morris, 2026-08-03):** not yet recorded. The §5.3 script draft is the starting point; recording is a Phase 5/6 prerequisite (must exist before Cohort 1). Owner: Morris.
3. **"GS Retrofit" personalization line** in the original doc — leftover or meaningful? Omission stands until confirmed.
4. **Docside schema/JWT mechanics.** ✅ **ANSWERED (verification pass, 2026-08-03):** see `docs/ARCHITECTURE-VERIFICATION.md`. AD-1 confirmed with one amendment (the tenancy unit is a preview *agent* — a real `auth.users` row — so existing RLS works unchanged; `agents.is_preview` flag); AD-3 amended (real GoTrue sessions via `admin.generateLink` token-hash exchange, not hand-minted JWTs); AD-2/AD-4 confirmed as written. Two new gaps for founder decision: the click-to-source pane and seller narrative summaries do not exist in the app yet (see that doc's §6, and Q7–Q8 below).
5. **Participant card.** Does v1 generate a downloadable card image, or is the on-screen designation enough?
6. **Session recording.** Revisit after Cohort 1 — only with explicit prior consent if ever added.
7. **Click-to-source pane.** ✅ **DECIDED (Morris, 2026-08-03): soften Mission 1 to the excerpt experience.** v1 delivers the trust moment as the cited excerpt (page + clause + verbatim contract language); the live document pane stays the mockup's target direction for a later pass. Mission 1 ACs, the §2 delivery note, and the §6 mockup-mapping note reflect this. Debrief Parts 3/5/6 will show whether agents ask for in-document navigation — that demand signal is itself research data.
8. **Seller narrative summaries.** ✅ **DECIDED (Morris, 2026-08-03): implement summaries first.** `offer_summaries` generation + seller-view narrative rendering land in `docside` before Cohort 1. Tracked as a Phase 4 prerequisite in `docs/PLAN.md` and item 7 of `ARCHITECTURE-VERIFICATION.md` §7.

---

## §14 — Rollout

> **Observe → correct → release → measure → interview**

- **Cohort 1 (moderated):** 2–3 agents live over Zoom, screen share, think-aloud. Moderated testing first because detailed explanations and follow-ups matter more than volume at this stage. The facilitator never explains the product — only the logistics.
- **Fix pass:** correct the obvious problems Cohort 1 surfaces.
- **Cohort 2+ (self-guided):** send invite links; measure via §8.

**Gates for advancing Cohort 1 → 2:** ≥80% of Cohort 1 completes Mission 1's success definition without facilitator help; zero observed trust-moment failures (citation click fails to land on the right paragraph); no participant exceeds the 15-minute ceiling before the debrief.

**Follow-up:** every participant gets a personal email from Morris referencing the portion they completed; volunteers for own-documents get a personal setup follow-up (no self-serve upload).

---

## Appendix A — Seed dataset spec: 1248 Oakview Drive

### A.1 Property & scenario

- **Property:** 1248 Oakview Drive (fictional; city/state chosen at fixture-writing time to be plausibly Californian without matching a real listing).
- **Seller context (given to the participant):** three offers received; the seller cares most about net proceeds, certainty, and closing within 30 days.
- **Form:** original **synthetic** residential purchase agreement. CAR forms are copyrighted — fixtures must be original documents that mirror the *taxonomy* (paragraph-numbered sections addressable as `§<field> → ¶<paragraph>`) so the real extraction pipeline and citation system work unmodified. Same synthetic form family for all three offers.
- **One scenario ships.** The mockups' six scenario fixtures (clean / suppressed dimension / withheld order / near-tie / N=1 / seller share) remain useful for internal QA, but every participant gets exactly this one: the **suppressed-dimension** state below. Identical data for every participant, always.

### A.2 The three offers

All buyer identities are fictional. Net formula (system-derived, shown as a dashed provenance handle): `net = §3A price − §3G(1) credit − §3G(3) comp`.

| Term | **Chen** | **Reyes** | **Okafor** |
|---|---|---|---|
| Purchase price | $1,310,000 | $1,250,000 *(pipeline read: $1,260,000 — planted, see A.3)* | $1,225,000 |
| Financing | Conventional loan, 25% down ($327,500) | Conventional loan — $1,000,000 first loan, $250,000 down | **All cash** |
| Deposit | $39,300 (3%) | $37,500 (3%) | $61,250 (5%) |
| Loan contingency | **None (waived)** | 17 days | Not applicable — all-cash purchase |
| Appraisal contingency | At purchase price | **Waived** | Not applicable — all-cash purchase |
| Investigation contingency | 10 days | 10 days | **None (waived)** |
| Close of escrow | 30 days after acceptance | 21 days after acceptance | **14 days after acceptance** |
| Seller credit §3G(1) | $3,500 | $5,000 *(flagged High stakes — see A.3)* | $0 |
| Buyer-broker comp §3G(3) | **Unreadable** (handwritten; read as "2.5% or 2.25%") | $6,250 (0.5%) | $6,250 (0.5%) |
| **Net to seller** | **Suppressed — "We couldn't read this field"** *(resolves to $1,273,750 at 2.5%)* | **$1,238,750** *(after price correction; $1,248,750 under the misread)* | **$1,218,750** |
| Offer expiration | 5 days after signing | 3 days after signing | 7 days after signing |

**Deliberate tensions (no objectively "best" offer):** Chen has the highest price but a suppressed net and the slowest close; Okafor is the certainty play — all-cash, contingency-free, 14 days — at the lowest net; Reyes sits between on everything and carries a loan contingency. Against the seller's stated priorities (net ▸ certainty ▸ ≤30 days), reasonable agents will disagree — which is the research point.

### A.3 Planted moments (all participants, identical)

1. **The unreadable field (Chen, §3G(3)).** Handwritten buyer-broker compensation; extraction confidence low ("the read was either 2.5% or 2.25%"). Ships unresolved → Chen's net is suppressed in Mission 3. Resolving it in the verify workspace un-suppresses the net ($1,273,750 at 2.5%) and can change the discussion order — honest refusal with a payoff.
2. **The planted misread (Reyes, §3A).** Contract states $1,250,000; the pipeline's shipped read is $1,260,000, flagged low-confidence in "Needs your attention." The source paragraph is one click away; catching and correcting it is Mission 2's core beat, and the correction ripples into net ($1,248,750 → $1,238,750) and travels with its original read everywhere.
3. **The high-stakes confirmation (Reyes, §3G(1)).** $5,000 seller credit flagged **High stakes** ("This affects the seller's net — confirm it."). Keeps the share gate meaningfully engaged.
4. **Easily-overlooked provisions** (in "Other terms — not ranked", quoted verbatim, never scored):
   - Chen: *"Buyer requests a two-week rent-back after close of escrow if that helps the seller's move."*
   - Reyes: *"Seller to leave the patio furniture and both mounted televisions."*
   - Okafor: *"Deposit becomes non-refundable five days after acceptance."* — the sharpest overlooked term: it materially changes Okafor's certainty story in the seller conversation.

### A.4 Pipeline & provisioning constraints

- The golden workspace is created by running the three synthetic PDFs through the **real extraction pipeline** once; the planted misread and unreadable field must be produced by the actual documents (a genuinely ambiguous handwritten figure; a typeset price the pipeline plausibly misreads is acceptable to stage via a controlled override **only if** the pipeline cannot be induced naturally — the override must be recorded in the seed script, §13.4).
- Every extracted field must resolve a `§→¶` citation to a paragraph that exists in its source document — the Mission 1 trust moment depends on it.
- Participant workspaces are clones of the golden seed (AD-1); a participant's corrections never leak into the golden copy or any other participant's clone.

### A.5 Fixture acceptance criteria

- `[Guardrail]` GIVEN the three synthetic agreements, THEN no CAR-copyrighted text or layout is reproduced, and all buyer identities, addresses, and agents are fictional.
- `[Content]` GIVEN the golden workspace post-extraction, THEN the field values match table A.2 exactly, including the two planted flags and the unreadable state.
- `[UX]` GIVEN any citation in the golden workspace, THEN it opens to a real paragraph in the synthetic document that supports the value.
- `[Guardrail]` GIVEN two participants acting concurrently, THEN corrections by one are never visible to the other.
