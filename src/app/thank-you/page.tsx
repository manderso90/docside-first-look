import { requireStage } from "@/lib/flow";
import { recordEvent } from "@/lib/record-event";
import { getStore } from "@/lib/store";
import { stageIndex } from "@/lib/stages";
import { Shell, ScreenTitle } from "@/components/shell";
import { NextSteps } from "./next-steps";

/**
 * Screen 7 — Thank-you & next steps (BRIEF §5.7).
 * Appreciative, never gimmicky: no confetti, no badges, gentle fade only.
 * The summary reports the TRUE count of completed activities.
 */
export default async function ThankYouPage() {
  const ctx = await requireStage("thank_you");
  await recordEvent(ctx.session, "thank_you", "preview_completed", {});

  // True-count rule: until per-mission telemetry lands with the Phase 4 app
  // handoff, the shell knows missions only via the stage frontier — reaching
  // the debrief means the workspace pass finished (4), anything earlier
  // reports what actually happened.
  const activities =
    stageIndex(ctx.session.lastStage) >= stageIndex("debrief") ? 4 : 3;
  const responses = await getStore().getResponses(ctx.participant.id);
  const feedbackSubmitted = responses.some((r) => r.part === "part_8");

  return (
    <Shell>
      <div className="animate-[fadeIn_0.6s_var(--ease-calm)]">
        <ScreenTitle>
          Thank you, {ctx.participant.firstName}. You helped shape Docside.
        </ScreenTitle>
        <p className="mt-4 max-w-md text-[15px] leading-relaxed text-ink-2">
          Your feedback will be reviewed directly by Morris and used to
          determine what Docside should become next.
        </p>

        <p className="mt-8 text-[13.5px] text-ink-3">
          {activities === 4 ? "Four" : "Three of four"} activities completed ·{" "}
          {feedbackSubmitted ? "Feedback submitted" : "Feedback in progress"} ·{" "}
          <span className="font-medium text-deep-ocean">
            Founding Preview Participant
          </span>
        </p>

        <div className="mt-4 inline-block rounded-card border border-ocean-200 bg-ocean-50 px-5 py-3.5">
          <p className="label-caps text-deep-ocean">
            Docside Founding Agent Preview
          </p>
          <p className="mt-1 font-mono text-[13px] text-ink-2">
            Participant No.{" "}
            {String(ctx.participant.participantNumber).padStart(3, "0")}
          </p>
        </div>

        <div className="mt-10">
          <NextSteps />
        </div>
      </div>
    </Shell>
  );
}
