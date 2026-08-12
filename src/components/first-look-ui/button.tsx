import type { ButtonHTMLAttributes } from "react";

export type FlButtonVariant = "primary" | "outline" | "ghost";

/**
 * Lab button (plan: ui-lab Phase 3): primary / outline / ghost with the
 * exploration's hover treatments and :active scale. Real `disabled`
 * semantics — a disabled action must not look or read interactive
 * (review adjustment 5).
 */
export function FlButton({
  variant,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant: FlButtonVariant }) {
  return <button type="button" {...props} className={`btn btn-${variant} ${className}`} />;
}
