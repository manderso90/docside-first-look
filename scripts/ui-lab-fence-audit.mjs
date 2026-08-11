// Fence audit for the First Look UI lab stylesheet (plan: ui-lab Phase 1).
//
// The lab's styles are containment-scoped by SELECTOR, not by import — Next.js
// bundles any imported CSS globally — so this script mechanically proves the
// fence: every top-level selector in first-look-ui.css must start with
// `[data-fl]`, and every @keyframes name must carry the `fl-` prefix
// (keyframe names are global even when authored inside nested rules).
//
//   node scripts/ui-lab-fence-audit.mjs
//
// Exits non-zero listing each violation.

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

const css = readFileSync(CSS_PATH, "utf8")
  // strip comments
  .replace(/\/\*[\s\S]*?\*\//g, "");

const violations = [];

// Semicolon-terminated at-statements never reach the brace-walker below —
// catch the fence-defeating ones up front.
for (const m of css.matchAll(/@import\b[^;{]*;/g)) {
  violations.push(`first-look-ui.css: "${m[0].trim()}" — @import defeats the fence`);
}

/**
 * Walk top-level statements. `css` here is the content of one block level;
 * conditional at-rules recurse so `@media { body { … } }` can't smuggle a
 * bare selector past the fence.
 */
function audit(block, context) {
  let i = 0;
  while (i < block.length) {
    const brace = block.indexOf("{", i);
    if (brace === -1) break;
    const prelude = block.slice(i, brace).trim();
    // find the matching close brace
    let depth = 1;
    let j = brace + 1;
    while (j < block.length && depth > 0) {
      if (block[j] === "{") depth += 1;
      else if (block[j] === "}") depth -= 1;
      j += 1;
    }
    const body = block.slice(brace + 1, j - 1);

    if (prelude.startsWith("@")) {
      const name = prelude.split(/\s+/)[0];
      if (name === "@keyframes" || name === "@-webkit-keyframes") {
        const kf = prelude.split(/\s+/)[1] ?? "";
        if (!kf.startsWith("fl-")) {
          violations.push(`${context}: keyframes "${kf}" lacks the fl- prefix`);
        }
      } else if (["@media", "@supports", "@layer", "@container"].includes(name)) {
        audit(body, `${context} > ${prelude}`);
      } else if (name === "@import" || name === "@theme") {
        // @import pulls in unfenced CSS; @theme registers GLOBAL Tailwind
        // tokens/utilities. Both defeat the fence outright.
        violations.push(`${context}: ${name} is not allowed in the fence stylesheet`);
      }
      // other at-rules (@font-face would be global too — flag it)
      if (name === "@font-face") {
        violations.push(
          `${context}: @font-face belongs in the lab layout via next/font, not here`,
        );
      }
    } else {
      for (const sel of prelude.split(",").map((s) => s.trim())) {
        if (!sel.startsWith("[data-fl]")) {
          violations.push(`${context}: selector "${sel}" does not start with [data-fl]`);
        }
      }
    }
    i = j;
  }
}

audit(css, "first-look-ui.css");

// ── Import-disjointness rule ────────────────────────────────────────────────
// The lab subtree must not import modules shared with participant screens:
// sharing modules across these dev entries corrupts the dev server's webpack
// chunk graph for subsequently-visited routes ("__webpack_require__.n is not
// a function" on client navigation). Allowed: framework modules, anything
// under first-look-ui, and the lab's own files.
import { readdirSync } from "node:fs";

const LAB_DIRS = [
  join(dirname(fileURLToPath(import.meta.url)), "..", "src", "app", "ui-lab"),
  join(dirname(fileURLToPath(import.meta.url)), "..", "src", "components", "first-look-ui"),
  join(dirname(fileURLToPath(import.meta.url)), "..", "src", "lib", "first-look-ui"),
];
const FORBIDDEN = /from\s+"@\/(?!components\/first-look-ui|lib\/first-look-ui)[^"]+"/;

function* walkFiles(dir) {
  let entries = [];
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* walkFiles(p);
    else if (/\.(ts|tsx)$/.test(e.name)) yield p;
  }
}

for (const dir of LAB_DIRS) {
  for (const file of walkFiles(dir)) {
    const src = readFileSync(file, "utf8");
    for (const line of src.split("\n")) {
      if (FORBIDDEN.test(line)) {
        violations.push(
          `${file.split("/src/")[1]}: shared-module import breaks dev chunk isolation — ${line.trim()}`,
        );
      }
    }
  }
}

if (violations.length > 0) {
  console.error(`FENCE AUDIT FAILED — ${violations.length} violation(s):`);
  for (const v of violations) console.error(`  ✗ ${v}`);
  process.exit(1);
}
console.log("Fence audit passed: every selector is scoped under [data-fl].");
