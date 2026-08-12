import type { ReactNode } from "react";

/**
 * The shell frame: single centered column, generous whitespace, small
 * wordmark, no navigation chrome and no footer links that leak the
 * participant out (BRIEF §5.1).
 */
export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col items-center px-6 py-10 sm:py-16">
      {/* 680px — the vocabulary's narrow column (Stage A3). */}
      <div className="w-full max-w-[680px]">
        <div className="mb-10 flex items-center gap-2.5" aria-hidden="true">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-deep-ocean font-display text-[17px] font-semibold text-white">
            d
          </span>
          <span className="font-display text-[15px] font-semibold tracking-tight text-deep-ocean">
            docside
          </span>
          <span className="label-caps ml-1 mt-0.5 text-ink-3">First Look</span>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ScreenTitle({ children }: { children: ReactNode }) {
  // Vocabulary display scale (Stage A3): 30px / 1.15 / -0.01em, balanced
  // wrap. Deep Ocean is KEPT (brand heading rule) although the exploration's
  // dashboard title is ink — flagged in the A3 review package.
  return (
    <h1 className="font-display text-[30px] font-semibold leading-[1.15] tracking-[-0.01em] text-balance text-deep-ocean">
      {children}
    </h1>
  );
}

export function Card({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-card border border-line-soft bg-surface p-6 shadow-card sm:p-8">
      {children}
    </div>
  );
}
