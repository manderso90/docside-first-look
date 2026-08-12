# The Docside Card — founding-member pass concept

Status: **founder concept, recorded 2026-08-12. Not scheduled.** Nothing here
is First Look cohort scope; this document exists so the idea survives in the
repo record until it is deliberately picked up. Origin: founder feedback on
the Stage A thank-you screen (the participant pass, `src/app/thank-you/`).

## The vision (Morris, 2026-08-12)

The thank-you pass grows into a durable membership artifact that outlives the
preview — kept for years, not discarded:

- **Offers.** The card carries special offers and discounts for the whole
  membership period — creative opportunities to try new features and
  products, always with an incentive. It should feel like money: valuable
  enough that a member never throws it away.
- **Premium tier.** Holding the card marks a founding-tier membership with
  first-look access to future Docside projects and advancements, and to
  companies associated with Docside.
- **Partnerships.** Possibly the access point for a partner program spanning
  other real-estate-industry services.
- **Wallet-native.** The card lives in Apple Wallet (and Google Wallet for
  Android agents) as "the Docside card."

Goals: long-haul retention, a standing founder↔agent contact channel, and a
felt sense of exclusivity. The pass number (№ NNN, Founding Preview
Participant) already provides the permanent, scarce founding-member identity
this program would be built around — it never needs reissuing.

## Two boundaries (why this is deferred, not diluted)

1. **Research instrument first.** While a First Look cohort is open, the
   participant flow must not promise discounts or premium benefits — an
   incentive attached to participation biases feedback toward praise
   (VISION: behavior over praise, no gimmicks). The pass sits after the
   debrief, which softens this, but offer language stays out of the shell
   until a cohort's feedback is fully captured.
2. **Cross-repo scope.** An offers/redemption/partnership backend is Docside
   product-and-business work, not preview-shell work (`docside` §17 test).
   This repo's role ends at issuing the pass; the membership program itself
   is planned in the `docside` repo when picked up.

## Sequencing sketch

- **Phase 1 — issue the pass** (after the current cohort closes): a Wallet
  version of the existing founding pass — number, designation, contact link.
  No offers backend. Exclusivity lands immediately with modest work.
- **Phase 2 — offers layer:** offer catalog + redemption, with pass
  push-updates so the card refreshes in place with the current offer. This
  update channel is what makes the card "represent money" without emails or
  app installs.
- **Phase 3 — partner program:** business development and agreements more
  than engineering; last.

## Technical shape (Phase 1–2)

Apple PassKit `.pkpass`: generated and signed server-side (Apple Developer
account + Pass Type ID certificate), plus a small **pass web service**
(registration, update, APNs push) — the piece that lets offers silently
refresh the card in every member's Wallet. Google Wallet is the same server
with a second output format. Pass identity keys off the existing participant
number.

## Open questions for pickup

- Which offers are honest at Phase 2 launch (discount on what, funded how)?
- Does the founding tier stay closed at the First Look cohorts, or extend to
  later preview rounds?
- Partner program: who moves first, and what does Docside promise them?
