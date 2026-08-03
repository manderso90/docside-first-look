"use server";

import { redirect } from "next/navigation";
import { requireStage } from "@/lib/flow";
import { recordEvent } from "@/lib/record-event";
import { getStore } from "@/lib/store";
import { stagePath } from "@/lib/stages";
import {
  DEBRIEF_PARTS,
  responsePartKey,
  type DebriefPartId,
} from "@/lib/debrief";
import type { ResponsePart } from "@/lib/store/types";

export interface DebriefSaveState {
  error: string | null;
  savedPart: number | null;
}

export async function saveDebriefPart(
  _prev: DebriefSaveState,
  formData: FormData,
): Promise<DebriefSaveState> {
  const ctx = await requireStage("debrief");
  const partNum = Number(formData.get("part"));
  const spec = DEBRIEF_PARTS.find((p) => p.part === partNum);
  if (!spec) return { error: "Unknown step.", savedPart: null };
  const part = spec.part as DebriefPartId;

  let answer: Record<string, unknown>;
  if (spec.kind === "single_choice") {
    const choice = String(formData.get("choice") ?? "");
    if (!spec.options.includes(choice)) {
      return { error: "Pick one to continue.", savedPart: null };
    }
    answer = { choice };
  } else if (spec.kind === "open_text") {
    // Open parts may be honestly empty — blunt silence is data too.
    answer = { text: String(formData.get("text") ?? "").trim() };
  } else {
    const channel = String(formData.get("channel") ?? "text");
    answer = {
      channel,
      text: String(formData.get("text") ?? "").trim(),
    };
  }

  const store = getStore();
  const partKey = responsePartKey(part) as ResponsePart;
  const prior = (await store.getResponses(ctx.participant.id)).find(
    (r) => r.part === partKey,
  );

  try {
    await store.saveResponse({
      participantId: ctx.participant.id,
      part: partKey,
      answer,
      updatedAt: new Date().toISOString(),
    });
  } catch {
    return {
      error: "That didn't save. Your answer is still here — try again.",
      savedPart: null,
    };
  }

  // Event at most once per part per participant; the response row itself
  // is the latest-wins record on back-edits (BRIEF §5.6 AC).
  if (!prior) {
    await recordEvent(ctx.session, "debrief", "debrief_part_submitted", {
      part,
    });
  }

  if (part === 8) {
    await store.advanceStage(ctx.session.id, "thank_you");
    redirect(stagePath("thank_you"));
  }
  return { error: null, savedPart: part };
}

export async function recordScheduleClick(): Promise<void> {
  const ctx = await requireStage("debrief");
  await recordEvent(ctx.session, "debrief", "schedule_clicked", {});
}
