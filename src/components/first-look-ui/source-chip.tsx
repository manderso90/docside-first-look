/**
 * SourceChip — the signature element (plan: ui-lab Phase 3, port priority 1).
 * The mono `§3A − §3G` reference pill that carries the summary → extracted
 * value → source-language moment.
 *
 * In the lab it is HONESTLY INERT: the source view is product work in the
 * main app, so the chip is focusable (keyboard users meet it where mouse
 * users do) but aria-disabled, with the title saying so. Wiring the real
 * click-through happens at promotion, in the app that owns the documents.
 */
export function SourceChip({
  refText,
  note,
}: {
  /** The RPA reference, e.g. "§3L(2) → ¶8B" (see rpa-map.ts). */
  refText: string;
  /** Optional formula/derivation note shown as the tooltip. */
  note?: string;
}) {
  return (
    <button
      type="button"
      className="srcchip"
      aria-disabled="true"
      aria-label={`Source reference ${refText} — source view is not wired in this lab`}
      title={note ? `${note} · source view not wired in this lab` : "Source view not wired in this lab"}
    >
      {refText}
    </button>
  );
}
