import { requireStage } from "@/lib/flow";
import { recordEvent } from "@/lib/record-event";
import { Shell, ScreenTitle, Card } from "@/components/shell";
import { SubmitButton } from "@/components/submit-button";
import { launchWorkspace } from "./actions";

/**
 * Screen 4 — Transaction scenario (BRIEF §5.4).
 * The calm briefing before the app. Early-version framing verbatim;
 * sandbox promise present; one action.
 */
export default async function ScenarioPage() {
  const ctx = await requireStage("scenario");
  await recordEvent(ctx.session, "scenario", "scenario_viewed", {});

  return (
    <Shell>
      <Card>
        <p className="label-caps text-deep-ocean">Your assignment</p>
        <ScreenTitle>1248 Oakview Drive</ScreenTitle>
        <p className="mt-4 text-[15px] leading-relaxed text-ink-2">
          You are the listing agent for <strong>1248 Oakview Drive</strong>.
          Three purchase offers have been received. Your seller would like help
          understanding the differences before deciding how to respond.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {["Chen", "Reyes", "Okafor"].map((buyer) => (
            <span
              key={buyer}
              className="rounded-control border border-ocean-200 bg-ocean-50 px-3 py-1 text-[12.5px] font-medium text-deep-ocean"
            >
              Offer · {buyer}
            </span>
          ))}
        </div>

        {/* "What you'll do" — the four missions, abbreviated faithfully from
            BRIEF §6 task statements (no leading language). Founder request
            2026-08-09: more hand-holding before the app handoff. */}
        <div className="mt-6">
          <p className="label-caps text-ink-3">What you&rsquo;ll do</p>
          <ol className="mt-2.5 space-y-2 text-[13.5px] leading-relaxed text-ink-2">
            {[
              "Open the Okafor offer and find its purchase price, financing, deposit, and closing date.",
              "Review the highlighted terms on the Reyes offer and confirm whether Docside read them correctly.",
              "Compare the offers — your seller cares most about net proceeds, certainty, and a 30-day close — and decide which you would discuss first.",
              "Preview the summary you might share with your seller and note what you would change before sending.",
            ].map((mission, index) => (
              <li key={mission} className="flex gap-2.5">
                <span className="font-mono text-[12px] text-ink-3">
                  {index + 1}
                </span>
                <span>{mission}</span>
              </li>
            ))}
          </ol>
        </div>

        <p className="label-caps mt-6 text-ink-3">Your Preview: 1 of 4</p>

        <p className="mt-6 border-t border-line-2 pt-5 text-[13.5px] leading-relaxed text-ink-3">
          This is an early working version. Some portions are incomplete.
          Please evaluate what is present rather than what has been promised.
        </p>

        <form action={launchWorkspace} className="mt-7">
          <SubmitButton>Open the Oakview offers</SubmitButton>
          <p className="mt-3 text-[12.5px] text-ink-3">
            Nothing you do here will break anything, and nothing will actually
            be sent to anyone.
          </p>
        </form>
      </Card>
    </Shell>
  );
}
