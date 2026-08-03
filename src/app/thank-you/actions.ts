"use server";

import { requireStage } from "@/lib/flow";
import { recordEvent } from "@/lib/record-event";

export type NextStepChoice = "own_docs" | "next_round" | "finished";

export async function chooseNextStep(choice: NextStepChoice): Promise<string> {
  const ctx = await requireStage("thank_you");
  if (choice === "own_docs") {
    await recordEvent(ctx.session, "thank_you", "own_docs_volunteered", {});
    return "Morris will follow up personally to set this up.";
  }
  if (choice === "next_round") {
    await recordEvent(ctx.session, "thank_you", "next_round_opted", {});
    return "You're on the list for the next round.";
  }
  return "Thank you — that's everything.";
}
