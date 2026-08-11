import { IBM_Plex_Mono, Inter } from "next/font/google";

/**
 * Lab-scoped font loads (plan: ui-lab Phase 1). Deliberately NOT in the root
 * layout: next/font in this subtree preloads only on /ui-lab routes, and the
 * variable classes go on the fence wrapper — nothing outside changes.
 *
 * - flMono duplicates the root IBM Plex Mono load at extra weights (600/700
 *   are needed for offer prices and table values in BOTH palettes; the root
 *   loader carries only 400/500). Promotion: widen the root loader, delete this.
 * - flInter exists only for the proposed palette and dies with it.
 */
export const flInter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-fl-inter",
});

export const flMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-fl-mono",
});
