import "server-only";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { CloseTerm, DashboardData, OfferView, TermChip } from "./types";

/**
 * STRESS MODE data loader (plan: ui-lab Phase 4; review adjustment 1 —
 * secondary to the synthetic Oakview set).
 *
 * Reads the CAR RPA 12/25 golden-set ground-truth labels from the sibling
 * docside repo at request time, via DOCSIDE_FIXTURES_DIR (.env.local only).
 *
 * PRIVACY CONTRACT: per docside/tests/fixtures/12_25/README.md these files
 * hold REAL transaction data (buyer/seller names, agent contacts, property
 * addresses), are local-only, and are never committed. Nothing read here may
 * be written to this repo or shipped: the loader runs only on a machine that
 * has the sibling checkout, and every deployed environment renders the
 * honest "not available" state instead. Read-only — never modify fixtures.
 *
 * The five files are five DIFFERENT properties — an extraction test set, not
 * competing offers on one listing. That mismatch is the point of stress mode:
 * the layout renders it visibly (per-card address lines, no cross-listing
 * crowns) rather than smoothing it over.
 */

const OFFER_FILES = ["Cash_offer", "Conventional_20", "FHA_offer", "VA_offer"] as const;

type Field<T> = { value: T | null } | undefined;
// The set carries two schema generations (Cash_offer is the older flat
// shape: string address / string buyer); normalize both.
type RawAddress = string | { street?: string | null; city?: string | null } | null;
type RawBuyers = string | string[] | null;

function val<T>(field: Field<T>): T | null {
  return field?.value ?? null;
}

function formatAddress(raw: RawAddress): string {
  if (!raw) return "Address not stated";
  if (typeof raw === "string") return raw;
  return [raw.street, raw.city].filter(Boolean).join(", ") || "Address not stated";
}

function formatBuyers(raw: RawBuyers): string {
  if (!raw) return "Buyer not stated";
  return Array.isArray(raw) ? raw.join(" & ") : raw;
}

const FIN_LABEL: Record<string, string> = {
  cash: "All-cash",
  conventional: "Conventional",
  fha: "FHA",
  va: "VA",
  seller_financing: "Seller financing",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toOffer(raw: Record<string, any>, index: number, id: string): OfferView {
  const price = val<number>(raw.purchase_price) ?? 0;
  const compPct = val<number>(raw.buyer_broker_compensation_pct) ?? 0;
  const compFlat = val<number>(raw.buyer_broker_compensation_amount_flat) ?? 0;
  const closingCredit = val<number>(raw.seller_closing_cost_credit) ?? 0;
  const otherCredits = val<number>(raw.seller_other_credits) ?? 0;
  const comp = compFlat > 0 ? compFlat : (price * compPct) / 100;
  const netEstimate = price - closingCredit - otherCredits - comp;

  const fin = val<string>(raw.financing_type) ?? "not stated";
  const financing: TermChip[] = [
    {
      variant: fin === "cash" ? "good" : "flat",
      label: FIN_LABEL[fin] ?? fin,
    },
  ];
  if (fin === "cash" && val<boolean>(raw.pof_present)) {
    financing.push({ variant: "flat", label: "Proof of funds attached" });
  }

  const contingencies: TermChip[] = [];
  const loanDays = val<number>(raw.loan_contingency_days);
  const loanPresent = val<boolean>(raw.loan_contingency_present);
  if (fin === "cash" || loanPresent === false) {
    contingencies.push({ variant: "good", label: "No loan contingency" });
  } else if (loanDays !== null) {
    contingencies.push({ variant: "flat", label: `${loanDays}-day loan` });
  }
  const apprDays = val<number>(raw.appraisal_contingency_days);
  if (val<boolean>(raw.appraisal_contingency_present) === false) {
    contingencies.push({ variant: "good", label: "No appraisal contingency" });
  } else if (apprDays !== null) {
    contingencies.push({ variant: "flat", label: `${apprDays}-day appraisal` });
  }
  const inspDays = val<number>(raw.inspection_contingency_days);
  if (val<boolean>(raw.inspection_contingency_present) === false) {
    contingencies.push({ variant: "good", label: "No inspection contingency" });
  } else if (inspDays !== null) {
    contingencies.push({ variant: "flat", label: `${inspDays}-day inspection` });
  }
  if (contingencies.length === 0) {
    contingencies.push({ variant: "flat", label: "Not stated" });
  }

  const coeDays = val<number>(raw.coe_days);
  const coeDate = val<string>(raw.coe_date);
  const close: CloseTerm =
    coeDays !== null
      ? { kind: "days", days: coeDays }
      : coeDate !== null
        ? { kind: "date", dateISO: coeDate }
        : { kind: "not_stated" };

  return {
    id,
    index,
    buyer: formatBuyers(val<RawBuyers>(raw.buyer_names) as RawBuyers),
    address: formatAddress(val<RawAddress>(raw.property_address) as RawAddress),
    price,
    netEstimate,
    netNote:
      "net = §3A price − §3G(1)/(2) credits − §3G(3) comp (estimated, display-only)",
    financing,
    contingencies,
    close,
    tier:
      fin === "cash" ? { variant: "primary", label: "All-cash", icon: "zap" } : undefined,
  };
}

/** Null when the sibling checkout isn't reachable — the page renders that honestly. */
export function loadFixtureOffers(): DashboardData | null {
  const dir = process.env.DOCSIDE_FIXTURES_DIR;
  if (!dir) return null;
  try {
    const offers = OFFER_FILES.map((name, i) =>
      toOffer(
        JSON.parse(readFileSync(join(dir, "12_25", `${name}.ground_truth.json`), "utf8")),
        i + 1,
        name,
      ),
    );
    return {
      title: "Golden-set offers",
      flatBadges: [
        "4 offers · 4 different properties",
        "Hand-labeled ground truth · local only",
        "Extraction test set — not a competing-offer scenario",
      ],
      offers,
      singleProperty: false,
    };
  } catch (error) {
    console.warn("[ui-lab] fixture load failed:", error);
    return null;
  }
}
