import { IBM_Plex_Mono } from "next/font/google";

/**
 * Lab-scoped font load (plan: ui-lab Phase 1). Deliberately NOT in the root
 * layout: next/font in this subtree preloads only on /ui-lab routes, and the
 * variable class goes on the fence wrapper — nothing outside changes.
 *
 * flMono duplicates the root IBM Plex Mono load at extra weights (600/700
 * are needed for offer prices and table values; the root loader carries only
 * 400/500). Promotion: widen the root loader, delete this.
 *
 * (Inter existed here for the exploration's "proposed" palette; deleted with
 * that palette — founder decision 2026-08-11.)
 */
export const flMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-fl-mono",
});
