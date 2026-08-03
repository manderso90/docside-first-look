"use server";

import { redirect } from "next/navigation";
import { requireStage } from "@/lib/flow";
import { recordEvent } from "@/lib/record-event";
import { stagePath } from "@/lib/stages";
import { getStore } from "@/lib/store";

export async function continueFromVideo(formData: FormData): Promise<void> {
  const ctx = await requireStage("video");
  const playedPct = Number(formData.get("played_pct") ?? 0);

  if (Number.isFinite(playedPct) && playedPct < 25) {
    await recordEvent(ctx.session, "video", "video_skipped", {
      at_pct: Math.max(0, Math.round(playedPct)),
    });
  }
  await getStore().advanceStage(ctx.session.id, "scenario");
  redirect(stagePath("scenario"));
}
