"use server";

import { redirect } from "next/navigation";
import { requireStage } from "@/lib/flow";
import { recordEvent } from "@/lib/record-event";
import { stagePath } from "@/lib/stages";
import { getStore } from "@/lib/store";

export interface FirstImpressionState {
  error: string | null;
}

export async function submitFirstImpression(
  _prev: FirstImpressionState,
  formData: FormData,
): Promise<FirstImpressionState> {
  const ctx = await requireStage("first_impression");
  const answer = String(formData.get("answer") ?? "").trim();
  const dwellMs = Number(formData.get("dwell_ms") ?? 0);

  if (!answer) return { error: "A sentence or two is all it takes." };

  const store = getStore();
  try {
    await store.saveResponse({
      participantId: ctx.participant.id,
      part: "first_impression",
      answer: { text: answer, dwell_ms: dwellMs },
      updatedAt: new Date().toISOString(),
    });
  } catch {
    // Preserve the participant's text — the client keeps the textarea value.
    return { error: "That didn't save. Your answer is still here — try again." };
  }

  await recordEvent(ctx.session, "first_impression", "first_impression_submitted", {
    answer,
    dwell_ms: Number.isFinite(dwellMs) ? Math.max(0, Math.round(dwellMs)) : 0,
  });
  await store.advanceStage(ctx.session.id, "video");
  redirect(stagePath("video"));
}

export async function skipFirstImpression(): Promise<void> {
  const ctx = await requireStage("first_impression");
  await recordEvent(ctx.session, "first_impression", "step_skipped", {
    step: "first_impression",
  });
  await getStore().advanceStage(ctx.session.id, "video");
  redirect(stagePath("video"));
}
