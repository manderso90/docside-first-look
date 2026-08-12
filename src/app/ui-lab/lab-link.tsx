import type { AnchorHTMLAttributes } from "react";

/**
 * Plain-anchor link for lab-internal navigation. next/link is banned in this
 * subtree (dev webpack chunk corruption — see lab-gate.tsx and the fence
 * audit), and @next/next/no-html-link-for-pages flags literal <a href>
 * page links; this wrapper is the one sanctioned bypass. Full page loads are
 * fine for a dev-only lab.
 */
export function LabA(props: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a {...props} />;
}
