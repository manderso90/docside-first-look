import { flMono } from "./fonts";

/**
 * The fence wrapper (plan: ui-lab Phase 1/2). Everything the lab renders
 * lives inside this element: the [data-fl] attribute is what every fence
 * stylesheet selector requires, and the font-variable class scopes the
 * lab-only mono weights. Single palette since the founder decision
 * (2026-08-11): the Docside token set, defined directly on [data-fl].
 */
export function FlSurface({ children }: { children: React.ReactNode }) {
  return (
    <div data-fl="" className={flMono.variable}>
      {children}
    </div>
  );
}
