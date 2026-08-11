import { notFound } from "next/navigation";

/**
 * The lab gate (plan: ui-lab Phase 1). FL_UI_LAB=1 lives in .env.local only —
 * never in Vercel env — so every deployed environment 404s this subtree
 * (scripts/ui-lab-containment.mjs captures that to prove it).
 */
export function labOpen(): boolean {
  return process.env.FL_UI_LAB === "1";
}

/**
 * What a gated page returns when the lab is closed.
 *
 * Production: a true 404 via notFound() (verified: `pnpm build` with the env
 * unset prerenders /ui-lab as static 404 content).
 *
 * Dev: a plain, dependency-free notice. Deliberately NOT the app's 404
 * screen: rendering it would import Shell into this subtree, and the lab
 * must stay import-disjoint from participant-screen modules — sharing
 * modules across these dev entries (or throwing notFound() here in dev)
 * corrupts the dev server's webpack chunk graph for subsequently-visited
 * routes ("__webpack_require__.n is not a function" on client navigation).
 * Found while validating containment; the disjointness rule is enforced by
 * scripts/ui-lab-fence-audit.mjs.
 */
export function LabClosed() {
  if (process.env.NODE_ENV !== "development") notFound();
  return (
    <main style={{ padding: "48px 24px", fontFamily: "system-ui, sans-serif" }}>
      <p>The First Look UI lab is off. Set FL_UI_LAB=1 in .env.local to open it.</p>
    </main>
  );
}
