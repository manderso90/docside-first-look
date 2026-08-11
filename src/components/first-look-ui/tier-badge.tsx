import { IconUp, IconZap } from "./icons";

export type TierBadgeVariant = "success" | "primary" | "neutral";

/** Offer-card tier badge (plan: ui-lab Phase 3). */
export function TierBadge({
  variant,
  icon,
  children,
}: {
  variant: TierBadgeVariant;
  icon?: "up" | "zap";
  children: React.ReactNode;
}) {
  return (
    <span className={`tierbadge ${variant}`}>
      {icon === "up" ? <IconUp size={12} strokeWidth={2.6} /> : null}
      {icon === "zap" ? <IconZap size={12} strokeWidth={2.4} /> : null}
      {children}
    </span>
  );
}
