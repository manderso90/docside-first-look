import { Shell, ScreenTitle } from "@/components/shell";

/**
 * Root page: participants always arrive via a personalized invite link, so
 * this is the quiet front door for anyone else. No product pitch, no leaks.
 */
export default function RootPage() {
  return (
    <Shell>
      <ScreenTitle>Docside First Look</ScreenTitle>
      <p className="mt-4 max-w-md text-[15px] leading-relaxed text-ink-2">
        A private preview for selected real estate professionals. If Morris
        invited you, use the personal link from your invitation to begin.
      </p>
    </Shell>
  );
}
