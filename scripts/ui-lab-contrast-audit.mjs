// WCAG contrast audit for the First Look UI lab (review adjustment 5).
//
// Parses both palette token blocks out of first-look-ui.css and reports the
// contrast ratio for every foreground/background pairing the lab's chips,
// badges, buttons, and captions actually use. Threshold: 4.5:1 (AA, normal
// text — every audited register is under 18.66px bold, so the large-text
// 3:1 relaxation never applies).
//
//   node scripts/ui-lab-contrast-audit.mjs
//
// Exit code 1 if any pairing lands under 4.5 so failures can't scroll away —
// failures are design findings for the palette decision, not build breakers.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// Tokens moved to @theme at Stage A2 promotion (docs/PROMOTION.md).
const CSS_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "src",
  "app",
  "globals.css",
);
const css = readFileSync(CSS_PATH, "utf8");

function tokensFrom(selector) {
  const start = css.indexOf(selector);
  if (start === -1) throw new Error(`block not found: ${selector}`);
  const open = css.indexOf("{", start);
  const close = css.indexOf("}", open);
  const body = css.slice(open + 1, close);
  const map = {};
  for (const m of body.matchAll(/(--[\w-]+)\s*:\s*(#[0-9a-fA-F]{6})/g)) {
    map[m[1]] = m[2];
  }
  return map;
}

// Single palette since the founder decision (2026-08-11): Docside tokens.
const palettes = {
  brand: tokensFrom("@theme {"),
};

function luminance(hex) {
  const c = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
function ratio(fg, bg) {
  const [l1, l2] = [luminance(fg), luminance(bg)].sort((a, b) => b - a);
  return (l1 + 0.05) / (l2 + 0.05);
}

// [label, fg token, bg token] — bg "#ffffff"-style literals allowed.
const PAIRS = [
  ["chip.good", "--color-success-deep", "--color-success-soft"],
  ["chip.warn", "--color-attention-deep", "--color-attention-soft"],
  ["chip.flat", "--color-ink-2", "--color-surface-2"],
  ["tierbadge.success", "--color-success-deep", "--color-success-soft"],
  ["tierbadge.primary", "--color-deep-ocean", "--color-ocean-50"],
  ["tierbadge.neutral", "--color-ink-2", "--color-surface-2"],
  ["srcchip", "--color-deep-ocean", "--color-ocean-50"],
  ["srcchip:hover", "--color-deep-ocean", "--color-ocean-200"],
  ["btn-primary", "#ffffff", "--color-deep-ocean"],
  ["btn-outline", "--color-ink-2", "--color-surface"],
  ["btn-ghost", "--color-ink-3", "--color-paper"],
  ["muted caption (--ink-3 on card)", "--color-ink-soft", "--color-surface"],
  ["subline (--ink-2 on canvas)", "--color-ink-2", "--color-paper"],
  ["leadmark", "--color-success-deep", "--color-surface"],
  ["term value (--ink on card)", "--color-ink", "--color-surface"],
  ["zebra value (--ink on card-2)", "--color-ink", "--color-surface-2"],
  // Stage A3 shell pairings (docs/PROMOTION.md gate 5)
  ["debrief choice label", "--color-ink-2", "--color-surface"],
  ["debrief choice checked", "--color-ink", "--color-ocean-50"],
  ["debrief count (ink-soft on card)", "--color-ink-soft", "--color-surface"],
  ["thank-you statusline (ink-3 on paper)", "--color-ink-3", "--color-paper"],
  ["pass body text", "#f0f6ff", "--color-deep-ocean"],
  ["screen title (deep-ocean on paper)", "--color-deep-ocean", "--color-paper"],
];

let failures = 0;
for (const [name, tokens] of Object.entries(palettes)) {
  console.log(`\n${name.toUpperCase()} palette`);
  for (const [label, fgKey, bgKey] of PAIRS) {
    const fg = fgKey.startsWith("#") ? fgKey : tokens[fgKey];
    const bg = bgKey.startsWith("#") ? bgKey : tokens[bgKey];
    if (!fg || !bg) {
      console.log(`  ?  ${label}: token missing (${fgKey}=${fg}, ${bgKey}=${bg})`);
      failures += 1;
      continue;
    }
    const r = ratio(fg, bg);
    const ok = r >= 4.5;
    if (!ok) failures += 1;
    console.log(
      `  ${ok ? "✓" : "✗"} ${label}: ${r.toFixed(2)}:1  (${fg} on ${bg})`,
    );
  }
}

if (failures > 0) {
  console.error(`\n${failures} pairing(s) under 4.5:1 — design findings for the palette decision.`);
  process.exit(1);
}
console.log("\nAll audited pairings meet 4.5:1.");
