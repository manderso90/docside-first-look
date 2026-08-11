import Link from "next/link";
import type { FlPalette } from "./surface";

/**
 * Lab-only palette switch (plan: ui-lab Phase 2). Two links riding
 * ?palette= so both variants are directly linkable and screenshotable.
 * Lives only under the FL_UI_LAB-gated /ui-lab subtree — participants can
 * never see it. Stripping after the decision: delete this file, hardcode
 * data-palette in FlSurface, `grep -r "data-palette\|palette-toggle" src/`
 * must return nothing.
 */
export function PaletteToggle({
  current,
  extraQuery = {},
}: {
  current: FlPalette;
  extraQuery?: Record<string, string>;
}) {
  const href = (palette: FlPalette) => {
    const q = new URLSearchParams({ ...extraQuery, palette });
    return `?${q.toString()}`;
  };
  return (
    <nav className="lab-toggle" aria-label="Palette (lab-only)">
      {(["proposed", "brand"] as const).map((p) => (
        <Link key={p} href={href(p)} aria-current={p === current ? "true" : undefined}>
          {p === "proposed" ? "Proposed" : "Docside tokens"}
        </Link>
      ))}
    </nav>
  );
}
