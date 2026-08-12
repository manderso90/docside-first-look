import type { ChipVariant } from "@/components/first-look-ui/chip";
import type { TierBadgeVariant } from "@/components/first-look-ui/tier-badge";

/**
 * The dashboard's view model (plan: ui-lab Phase 4). Deliberately free of
 * First-Look-only assumptions so the shape survives promotion: it is "offers
 * with sourced terms", not "the lab's three cards".
 */

export type CloseTerm =
  | { kind: "days"; days: number }
  | { kind: "date"; dateISO: string }
  | { kind: "not_stated" };

export type TermChip = { variant: ChipVariant; label: string };

export type OfferView = {
  id: string;
  /** 1-based display order → "OFFER 01". */
  index: number;
  buyer: string;
  /** Present only when offers span different properties (stress dataset). */
  address?: string;
  price: number;
  /** Display-only derived metric — see net note fields. */
  netEstimate: number;
  /** The derivation, shown in the SourceChip tooltip. */
  netNote: string;
  financing: TermChip[];
  contingencies: TermChip[];
  close: CloseTerm;
  tier?: { variant: TierBadgeVariant; label: string; icon?: "up" | "zap" };
};

export type DashboardData = {
  /** Serif display heading — the property for a single-listing set. */
  title: string;
  flatBadges: string[];
  offers: OfferView[];
  /** False for the multi-property stress set — suppresses cross-listing crowns. */
  singleProperty: boolean;
};

/** $1,242,500 / $1,205,437.50 — cents only when the math produces them. */
export function usd(amount: number): string {
  const hasCents = !Number.isInteger(amount);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0,
  }).format(amount);
}

/** "30 days" / "By Sep 15, 2026" / "Not stated". */
export function closeLabel(close: CloseTerm): string {
  switch (close.kind) {
    case "days":
      return `${close.days} days`;
    case "date": {
      const d = new Date(`${close.dateISO}T00:00:00`);
      return `By ${d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    }
    case "not_stated":
      return "Not stated";
  }
}
