"use server";

import { redirect } from "next/navigation";
import { requireStage } from "@/lib/flow";
import { recordEvent } from "@/lib/record-event";
import { stagePath, stageIndex } from "@/lib/stages";
import { getStore } from "@/lib/store";

export async function beginPreview(): Promise<void> {
  const ctx = await requireStage("welcome");
  const { session } = ctx;

  if (session.lastStage === "welcome") {
    // Fresh start: the button click is the preview_started moment.
    await recordEvent(session, "welcome", "preview_started", {});
    await getStore().advanceStage(session.id, "first_impression");
    redirect(stagePath("first_impression"));
  }

  // Returning participant: resume at the frontier (session_resumed already
  // fired at the invite exchange).
  const frontier = session.lastStage;
  redirect(
    stageIndex(frontier) > stageIndex("welcome")
      ? stagePath(frontier)
      : stagePath("first_impression"),
  );
}
