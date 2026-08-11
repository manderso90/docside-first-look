import type { Metadata } from "next";
import "@/components/first-look-ui/first-look-ui.css";

export const metadata: Metadata = {
  title: "First Look — UI lab",
  robots: { index: false, follow: false },
};

/**
 * The First Look UI lab (plan: ui-lab) — a dev-only design-validation
 * surface for the exploration's component vocabulary and the two candidate
 * palettes. Not part of the participant flow; nothing links here.
 *
 * The FL_UI_LAB gate lives in each page via labOpen()/LabClosed
 * (lab-gate.tsx), NOT here — see lab-gate.tsx for the dev-mode
 * notFound-in-this-subtree hazard that forced that shape.
 *
 * The fence stylesheet import is safe here: Next bundles it globally, but
 * every selector requires [data-fl] (see scripts/ui-lab-fence-audit.mjs).
 * The palette wrapper (FlSurface) is applied per page because layouts don't
 * receive searchParams and the palette rides ?palette=.
 */
export default function UiLabLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
