import { IconCheck } from "./icons";

export type ChipVariant = "good" | "warn" | "flat";

/**
 * Term chip (plan: ui-lab Phase 3). `good` carries the exploration's leading
 * check by default; `warn` and `flat` are text-only, as in the exploration.
 */
export function Chip({
  variant,
  children,
}: {
  variant: ChipVariant;
  children: React.ReactNode;
}) {
  return (
    <span className={`chip ${variant}`}>
      {variant === "good" ? <IconCheck size={11} strokeWidth={3} /> : null}
      {children}
    </span>
  );
}
