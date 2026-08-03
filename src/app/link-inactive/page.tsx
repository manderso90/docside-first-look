import { Shell, ScreenTitle } from "@/components/shell";

/**
 * Inactive / unknown invite (BRIEF §5.1 revoked state).
 * Calm, non-alarming, no error styling, no codes echoed.
 */
export default function LinkInactivePage() {
  return (
    <Shell>
      <ScreenTitle>This preview link is no longer active.</ScreenTitle>
      <p className="mt-4 max-w-md text-[15px] leading-relaxed text-ink-2">
        If you were expecting to participate, reply to Morris&rsquo;s email and
        he&rsquo;ll send a fresh link.
      </p>
    </Shell>
  );
}
