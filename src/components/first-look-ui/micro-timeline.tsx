/**
 * MicroTimeline (plan: ui-lab Phase 3): 6px track, gradient fill, endpoint
 * dots, mono caption — exploration values verbatim.
 *
 * `notStated` is a data-driven addition the exploration lacks: real offers
 * sometimes state no close term at all, and the honest render is an empty
 * dashed track with a declarative caption, not an invented duration.
 */
export function MicroTimeline({
  pct,
  startLabel,
  endLabel,
  notStated = false,
}: {
  /** Fill width 0–100, meaningful only when notStated is false. */
  pct?: number;
  startLabel?: string;
  endLabel?: string;
  notStated?: boolean;
}) {
  if (notStated) {
    return (
      <div className="tl not-stated">
        <div className="tl-track" />
        <div className="tl-caption">
          <span>Close of escrow — not stated in the offer</span>
        </div>
      </div>
    );
  }
  const width = Math.max(0, Math.min(100, pct ?? 0));
  return (
    <div className="tl">
      <div className="tl-track">
        <div className="tl-fill" style={{ width: `${width}%` }} />
        <span className="tl-dot" style={{ left: "0%" }} />
        <span className="tl-dot" style={{ left: `${width}%` }} />
      </div>
      <div className="tl-caption">
        <span>{startLabel ?? "Acceptance"}</span>
        <span>{endLabel}</span>
      </div>
    </div>
  );
}
