import { flInter, flMono } from "./fonts";

export type FlPalette = "proposed" | "brand";

/** ?palette= → palette, defaulting to the exploration's default. */
export function resolvePalette(value: string | string[] | undefined): FlPalette {
  return value === "brand" ? "brand" : "proposed";
}

/**
 * The fence wrapper (plan: ui-lab Phase 1/2). Everything the lab renders
 * lives inside this element: the [data-fl] attribute is what every fence
 * stylesheet selector requires, and the font-variable classes scope the
 * lab-only font loads. data-palette flips the token set.
 */
export function FlSurface({
  palette,
  children,
}: {
  palette: FlPalette;
  children: React.ReactNode;
}) {
  return (
    <div
      data-fl=""
      data-palette={palette}
      className={`${flInter.variable} ${flMono.variable}`}
    >
      {children}
    </div>
  );
}
