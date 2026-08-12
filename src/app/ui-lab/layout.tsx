import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "First Look — UI lab",
  robots: { index: false, follow: false },
};

/**
 * The First Look UI lab (plan: ui-lab) — a dev-only design-validation
 * surface for the exploration's component vocabulary, rendered in the chosen
 * Docside token set (founder decision 2026-08-11; the second candidate
 * palette and its toggle are deleted). Not part of the participant flow;
 * nothing links here.
 *
 * The FL_UI_LAB gate lives in each page via labOpen()/LabClosed
 * (lab-gate.tsx), NOT here — see lab-gate.tsx for the dev-mode
 * notFound-in-this-subtree hazard that forced that shape.
 *
 * The vocabulary styles are global since Stage A2 (imported via globals.css)
 * — this layout imports nothing.
 */
export default function UiLabLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
