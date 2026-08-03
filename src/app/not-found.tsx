import { Shell, ScreenTitle } from "@/components/shell";

export default function NotFound() {
  return (
    <Shell>
      <ScreenTitle>That page isn&rsquo;t here.</ScreenTitle>
      <p className="mt-4 max-w-md text-[15px] leading-relaxed text-ink-2">
        If you followed a preview invitation, open the personal link from your
        email again — it will take you back to where you left off.
      </p>
    </Shell>
  );
}
