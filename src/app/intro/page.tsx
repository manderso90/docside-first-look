import type { Metadata } from "next";
import { Entry } from "./entry";

/**
 * Docside entry screen (`/intro`).
 *
 * A standalone product surface — deliberately outside the First Look flow
 * guard (no requireStage): it renders freely as both a prototype entry point
 * for the Docside app and the capture source for First Look Screen 2. The
 * chrome mirrors the real app idiom from
 * design-reference/comparison-view-mockup-v3.html (56px Deep Ocean rail + a
 * slim top bar) so a first-time agent reads it as genuine software rather
 * than a marketing page. No functional navigation is implied.
 */

export const metadata: Metadata = {
  title: "Docside — Review an offer",
  robots: { index: false, follow: false },
};

export default function IntroPage() {
  return (
    <div className="flex min-h-dvh bg-paper">
      <AppRail />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="min-h-0 flex-1 overflow-y-auto">
          <Entry />
        </main>
      </div>
    </div>
  );
}

/**
 * The product's left rail (verify-workspace / v3 idiom). Icons are static and
 * non-interactive here: this is an entry surface, so only the "review" home
 * affordance reads as active. The rest are muted, present for product
 * fidelity, not function.
 */
function AppRail() {
  return (
    <nav
      aria-label="Docside"
      className="flex w-14 flex-shrink-0 flex-col items-center gap-1 bg-deep-ocean py-3.5"
    >
      <span
        aria-hidden="true"
        className="mb-3.5 grid h-[30px] w-[30px] place-items-center rounded-lg bg-ocean-500 font-display text-[17px] font-semibold text-white"
      >
        d
      </span>
      <RailIcon active label="Review">
        <path
          d="M4 5.5h16M4 12h16M4 18.5h10"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </RailIcon>
      <RailIcon label="Documents">
        <path
          d="M7 3.5h6.5L18 8v11.5A1.5 1.5 0 0116.5 21h-9A1.5 1.5 0 016 19.5v-14A1.5 1.5 0 017.5 4M13 3.5V8h4.5"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </RailIcon>
      <RailIcon label="Compare">
        <path
          d="M12 4v16M6 8l-3 4 3 4M18 8l3 4-3 4"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </RailIcon>
    </nav>
  );
}

function RailIcon({
  children,
  active = false,
  label,
}: {
  children: React.ReactNode;
  active?: boolean;
  label: string;
}) {
  return (
    <span
      aria-hidden="true"
      title={label}
      className={`grid h-[38px] w-[38px] place-items-center rounded-[9px] ${
        active ? "bg-white/10 text-white" : "text-ocean-300"
      }`}
    >
      <svg viewBox="0 0 24 24" className="h-[19px] w-[19px]" fill="none">
        {children}
      </svg>
    </span>
  );
}

function TopBar() {
  return (
    <header className="flex flex-shrink-0 items-center gap-2.5 border-b border-line bg-surface px-6 py-3.5">
      <span className="font-display text-[16px] font-semibold tracking-tight text-deep-ocean">
        docside
      </span>
    </header>
  );
}
