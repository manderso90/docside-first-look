import type { DashboardData, OfferView } from "./types";
import { RPA_REF } from "./rpa-map";

/**
 * The PRIMARY dashboard dataset (review adjustment 1): synthetic competing
 * offers on 1248 Oakview Drive — the product's canonical scenario, same
 * fictional buyers the /scenario screen names (Chen, Reyes, Okafor), listed
 * $1,195,000, seller priorities per BRIEF §6 mission 3 (net proceeds,
 * certainty, a 30-day close).
 *
 * The terms deliberately carry the awkwardness the real 12_25 fixture set
 * exposed, so the design is judged against reality, not tidy placeholders:
 *   - contingencies are PRESENT with day counts (waivers are the exception),
 *   - one offer states NO close term at all,
 *   - one closes by an absolute DATE, not days,
 *   - the cash offer is BELOW list and still keeps its appraisal contingency,
 *   - % commission math pushes one net estimate into cents,
 *   - seller credits are mostly null.
 *
 * Synthetic and fictional per CLAUDE.md's sample-data rule; net figures are
 * display-only derived metrics (docside "Layer 2" precedent), each carrying
 * its derivation note.
 */

const net = (price: number, credits: number, compPct: number) =>
  price - credits - (price * compPct) / 100;

const OFFERS: OfferView[] = [
  {
    id: "chen",
    index: 1,
    buyer: "Chen",
    price: 1_242_500,
    netEstimate: net(1_242_500, 6_000, 2.5), // 1,205,437.50 — cents on purpose
    netNote:
      "net = §3A price − §3G(1) closing credit $6,000 − §3G(3) comp 2.5% (estimated, display-only)",
    financing: [{ variant: "flat", label: "Conventional · 20% down" }],
    contingencies: [
      { variant: "flat", label: "17-day loan" },
      { variant: "flat", label: "12-day appraisal" },
      { variant: "flat", label: "10-day inspection" },
    ],
    close: { kind: "days", days: 30 },
    tier: { variant: "success", label: "Highest estimated net", icon: "up" },
  },
  {
    id: "reyes",
    index: 2,
    buyer: "Reyes",
    price: 1_219_000,
    netEstimate: net(1_219_000, 0, 3), // 1,182,430
    netNote: "net = §3A price − §3G(3) comp 3% (no §3G credits stated; estimated, display-only)",
    financing: [
      { variant: "flat", label: "FHA" },
      { variant: "flat", label: "17-day lender repair list" },
    ],
    contingencies: [
      { variant: "flat", label: "21-day loan" },
      { variant: "flat", label: "17-day appraisal" },
      { variant: "flat", label: "17-day inspection" },
    ],
    close: { kind: "not_stated" },
    tier: { variant: "neutral", label: "FHA financing" },
  },
  {
    id: "okafor",
    index: 3,
    buyer: "Okafor",
    price: 1_178_000, // below the $1,195,000 list
    netEstimate: net(1_178_000, 0, 2), // 1,154,440
    netNote: "net = §3A price − §3G(3) comp 2% (no §3G credits stated; estimated, display-only)",
    financing: [
      { variant: "good", label: "All-cash" },
      { variant: "flat", label: "Proof of funds attached" },
    ],
    contingencies: [
      { variant: "good", label: "No loan contingency" },
      { variant: "flat", label: "10-day appraisal" },
      { variant: "flat", label: "7-day inspection" },
    ],
    close: { kind: "date", dateISO: "2026-09-15" },
    tier: { variant: "primary", label: "All-cash", icon: "zap" },
  },
];

export const OAKVIEW: DashboardData = {
  title: "1248 Oakview Drive",
  flatBadges: [
    "3 offers · synthetic scenario data",
    "Listed $1,195,000",
    `Net inputs: ${RPA_REF.net_inputs}`,
  ],
  offers: OFFERS,
  singleProperty: true,
};
