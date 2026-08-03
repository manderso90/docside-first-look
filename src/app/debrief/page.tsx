import { requireStage } from "@/lib/flow";
import { getStore } from "@/lib/store";
import { Shell } from "@/components/shell";
import { DEBRIEF_PARTS, responsePartKey } from "@/lib/debrief";
import { DebriefStepper } from "./stepper";
import type { DebriefPartId } from "@/lib/debrief";

/**
 * Screen 6 — Structured debrief (BRIEF §5.6, §7).
 * One part per view, quiet progress, back allowed within the debrief,
 * per-part save with resume at the first unanswered part.
 */
export default async function DebriefPage() {
  const ctx = await requireStage("debrief");
  const responses = await getStore().getResponses(ctx.participant.id);
  const answered = new Set(responses.map((r) => r.part));

  const priorAnswers: Record<number, Record<string, unknown>> = {};
  for (const spec of DEBRIEF_PARTS) {
    const row = responses.find(
      (r) => r.part === responsePartKey(spec.part as DebriefPartId),
    );
    if (row) priorAnswers[spec.part] = row.answer;
  }

  const firstUnanswered =
    DEBRIEF_PARTS.find(
      (spec) => !answered.has(responsePartKey(spec.part as DebriefPartId)),
    )?.part ?? 8;

  const scheduleUrl = process.env.SCHEDULE_URL
    ? `${process.env.SCHEDULE_URL}${process.env.SCHEDULE_URL.includes("?") ? "&" : "?"}ref=${encodeURIComponent(ctx.participant.participantRef)}`
    : null;

  return (
    <Shell>
      <p className="text-[15px] font-medium text-ink">
        Eight short questions. Blunt answers are the most useful kind.
      </p>
      <div className="mt-6">
        <DebriefStepper
          startAt={firstUnanswered}
          priorAnswers={priorAnswers}
          scheduleUrl={scheduleUrl}
        />
      </div>
    </Shell>
  );
}
