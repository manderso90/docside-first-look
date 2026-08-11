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

const CSS_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "src",
  "components",
  "first-look-ui",
  "first-look-ui.css",
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

const palettes = {
  proposed: tokensFrom("[data-fl] {"),
  brand: tokensFrom('[data-fl][data-palette="brand"]'),
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
  ["chip.good", "--success-deep", "--success-soft"],
  ["chip.warn", "--attention", "--attention-soft"],
  ["chip.flat", "--ink-2", "--card-2"],
  ["tierbadge.success", "--success-deep", "--success-soft"],
  ["tierbadge.primary", "--primary", "--primary-soft"],
  ["tierbadge.neutral", "--ink-2", "--card-2"],
  ["srcchip", "--primary", "--primary-soft"],
  ["srcchip:hover", "--primary", "--primary-line"],
  ["btn-primary", "#ffffff", "--primary"],
  ["btn-outline", "--ink-2", "--card"],
  ["btn-ghost", "--ink-3", "--canvas"],
  ["muted caption (--ink-3 on card)", "--ink-3", "--card"],
  ["subline (--ink-2 on canvas)", "--ink-2", "--canvas"],
  ["leadmark", "--success-deep", "--card"],
  ["term value (--ink on card)", "--ink", "--card"],
  ["zebra value (--ink on card-2)", "--ink", "--card-2"],
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
