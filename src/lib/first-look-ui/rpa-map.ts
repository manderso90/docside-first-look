/**
 * Static field → CAR RPA (12/25 revision) section map (plan: ui-lab Phase 4).
 *
 * Transcribed from docside/src/lib/ai/schemas/car-rpa.md "Paragraph map
 * (12/25)". This exists because ground-truth citations are deliberately null
 * (citations are LLM-side), so the lab's SourceChips bind to the FORM's
 * structure — which is fixed per form revision — rather than to per-document
 * citations. Form metadata, not transaction data: safe to commit.
 *
 * At promotion the real citation pipeline (page + text + bbox) replaces this.
 */
export const RPA_REF = {
  purchase_price: "§3A",
  close_of_escrow: "§3B",
  offer_expiration: "§3C → ¶32A",
  emd: "§3D(1) → ¶5A(1)",
  financing: "§3E(1)",
  occupancy: "§3E(3) → ¶7A",
  seller_closing_credit: "§3G(1) → ¶5E",
  seller_other_credits: "§3G(2)",
  buyer_broker_comp: "§3G(3)",
  proof_of_funds: "§3H(1) → ¶5B",
  loan_contingency: "§3L(1) → ¶8A",
  /** Combined row reference when a term row carries all three. */
  contingencies: "§3L(1)–(3) → ¶8A–8C",
  appraisal_contingency: "§3L(2) → ¶8B",
  inspection_contingency: "§3L(3) → ¶8C",
  /** The exploration's shorthand for the derived-net inputs. */
  net_inputs: "§3A − §3G",
} as const;
