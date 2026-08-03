import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/session";
import { stageIndex, stagePath } from "@/lib/stages";
import { Shell, ScreenTitle, Card } from "@/components/shell";
import { SubmitButton } from "@/components/submit-button";
import { completeMissionsDev } from "./actions";

/**
 * Stand-in for screen 5 (BRIEF §5.5). The real screen IS the docside app at
 * app.docside.ai in preview mode — this page exists only until the Phase 4
 * handoff (APP_HANDOFF_URL) is wired, so the shell flow stays walkable.
 * It never ships to participants: Cohort 1 gates on the real handoff.
 */
export default async function WorkspacePlaceholderPage() {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/link-inactive");
  const reached = stageIndex(ctx.session.lastStage);
  if (reached < stageIndex("mission_1")) redirect(stagePath(ctx.session.lastStage));
  if (reached > stageIndex("mission_4")) redirect(stagePath(ctx.session.lastStage));
  if (process.env.APP_HANDOFF_URL) redirect(process.env.APP_HANDOFF_URL);

  return (
    <Shell>
      <Card>
        <p className="label-caps text-attention">Build placeholder</p>
        <ScreenTitle>The missions run inside Docside itself.</ScreenTitle>
        <p className="mt-4 text-[14px] leading-relaxed text-ink-2">
          In the finished experience this step hands off to the real Docside
          application in preview mode — the four missions (understand, verify,
          compare, prepare) happen there, then return here for the debrief.
          The handoff is Phase 4 work (<code className="font-mono text-[13px]">APP_HANDOFF_URL</code>).
        </p>
        <form action={completeMissionsDev} className="mt-7">
          <SubmitButton>Continue to the debrief (dev only)</SubmitButton>
        </form>
      </Card>
    </Shell>
  );
}
