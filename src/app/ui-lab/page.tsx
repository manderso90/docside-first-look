import { FlSurface, resolvePalette } from "@/components/first-look-ui/surface";
import { PaletteToggle } from "@/components/first-look-ui/palette-toggle";
import { labOpen, LabClosed } from "./lab-gate";

const TOKEN_NAMES = [
  "canvas", "card", "card-2", "ink", "ink-2", "ink-3", "line", "line-2",
  "primary", "primary-deep", "primary-soft", "primary-line",
  "success", "success-deep", "success-soft", "success-line",
  "attention", "attention-soft", "attention-line",
];

/** Phase 2: token swatch strip — becomes the primitives gallery in Phase 3. */
export default async function UiLabIndex({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!labOpen()) return <LabClosed />;
  const palette = resolvePalette((await searchParams).palette);

  return (
    <FlSurface palette={palette}>
      <PaletteToggle current={palette} />
      <div className="wrap">
        <div className="preview-eyebrow">
          <span className="caps">First Look · UI lab</span>
        </div>
        <h1 className="display">Tokens</h1>
        <p className="subline">
          Both sets defined on [data-fl]; the toggle flips data-palette. The
          duplication register lives at the top of first-look-ui.css.
        </p>
        <section className="lab-section">
          <div className="lab-swatches">
            {TOKEN_NAMES.map((name) => (
              <div key={name} className="lab-swatch">
                <div className="well" style={{ background: `var(--${name})` }} />
                <div className="meta">--{name}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </FlSurface>
  );
}
