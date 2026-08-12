import { requireStage } from "@/lib/flow";
import { recordEvent } from "@/lib/record-event";
import { getStore } from "@/lib/store";
import { stageIndex } from "@/lib/stages";
import { Shell, ScreenTitle } from "@/components/shell";
import { NextSteps } from "./next-steps";

/**
 * Screen 7 — Thank-you & next steps (BRIEF §5.7).
 * Appreciative, never gimmicky: no confetti, no badges beyond the pass,
 * gentle fade and a single drawn check. The summary reports the TRUE count
 * of completed activities.
 *
 * Stage A3 re-skin (docs/PROMOTION.md): the exploration's screen 3 —
 * centered column, drawn check, preview pass card. Copy and true-count
 * logic unchanged; the pass replaces the small designation box.
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
  const number = String(ctx.participant.participantNumber).padStart(3, "0");

  return (
    <Shell>
      <div className="animate-[fadeIn_0.6s_var(--ease-calm)] text-center">
        <svg className="ty-check" viewBox="0 0 100 100" aria-hidden="true">
          <circle className="ring" cx="50" cy="50" r="42" transform="rotate(-90 50 50)" />
          <path className="mark" d="M32 51.5 45 64 69 39" />
        </svg>

        <div className="mt-6">
          <ScreenTitle>
            Thank you, {ctx.participant.firstName}. You helped shape Docside.
          </ScreenTitle>
        </div>
        <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-ink-2">
          Your feedback will be reviewed directly by Morris and used to
          determine what Docside should become next.
        </p>

        <p className="mt-7 text-[13.5px] text-ink-3">
          {activities === 4 ? "Four" : "Three of four"} activities completed ·{" "}
          {feedbackSubmitted ? "Feedback submitted" : "Feedback in progress"}
        </p>

        <div className="pass-scene">
          <div
            className="pass"
            role="img"
            aria-label={`Docside Founding Agent Preview pass, participant number ${number}`}
          >
            <div className="pass-top">
              <span className="pass-brand">Docside · Founding Agent Preview</span>
            </div>
            <div className="pass-no">
              <small>№</small>
              {number}
            </div>
            <p className="pass-role">Founding Preview Participant</p>
            <hr className="pass-rule" />
            <div className="pass-meta">
              <div>
                <div className="k">Participant</div>
                <div className="v">Participant No. {number}</div>
              </div>
              <div>
                <div className="k">Preview</div>
                <div className="v">1248 Oakview Drive</div>
              </div>
              <div>
                <div className="k">Feedback</div>
                <div className="v">{feedbackSubmitted ? "Submitted" : "In progress"}</div>
              </div>
              <div>
                <div className="k">Issued at</div>
                <div className="v">preview.docside.ai</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-9">
          <NextSteps />
        </div>
      </div>
    </Shell>
  );
}
