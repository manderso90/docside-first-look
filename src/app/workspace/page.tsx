import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/session";
import { mintWorkspaceHandoff } from "@/lib/preview-handoff";
import { stageIndex, stagePath } from "@/lib/stages";
import { Shell, ScreenTitle, Card } from "@/components/shell";
import { SubmitButton } from "@/components/submit-button";
import { completeMissionsDev } from "./actions";

/**
 * Screen 5's boundary (BRIEF §5.5). The real screen IS the docside app at
 * app.docside.ai in preview mode. With APP_HANDOFF_URL configured this page
 * provisions the preview workspace (idempotent) and redirects into the app
 * with a freshly minted session — first launch, mid-mission re-entry, and
 * retry all pass through here. When the mint fails, it renders a calm
 * try-again state instead of stranding the participant. Without
 * APP_HANDOFF_URL (local dev pre-wiring), the placeholder below keeps the
 * shell flow walkable.
 *
 * Reached only via redirects (launch action / stage resume), never via
 * Link — so no prefetch can mint a token that a later click would have
 * already invalidated.
 */
export default async function WorkspacePage() {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/link-inactive");
  const reached = stageIndex(ctx.session.lastStage);
  if (reached < stageIndex("mission_1")) redirect(stagePath(ctx.session.lastStage));
  if (reached > stageIndex("mission_4")) redirect(stagePath(ctx.session.lastStage));

  if (process.env.APP_HANDOFF_URL) {
    let handoffUrl: string | null = null;
    try {
      handoffUrl = await mintWorkspaceHandoff(ctx.participant);
    } catch (error) {
      // Message may carry an HTTP status, never a secret or token.
      console.error("[first-look] workspace handoff failed", error);
    }
    if (handoffUrl) redirect(handoffUrl);

    return (
      <Shell>
        <Card>
          <p className="label-caps text-attention">One moment</p>
          <ScreenTitle>The workspace didn&apos;t connect.</ScreenTitle>
          <p className="mt-4 text-[14px] leading-relaxed text-ink-2">
            Nothing is lost — your preview picks up right where you left
            off. Give it another try; if it keeps happening, reply to your
            invitation email and Morris will take a look.
          </p>
          {/* Link styled as PrimaryButton (ui.tsx): a plain re-render retry.
              prefetch={false} is load-bearing — a prefetch would mint a
              token before the click and could invalidate one in flight. */}
          <Link
            href="/workspace"
            prefetch={false}
            className="mt-7 inline-flex items-center justify-center rounded-control bg-deep-ocean px-5 py-2.5 text-[14px] font-semibold text-white transition-colors duration-150 hover:bg-ocean-700 active:bg-midnight-slate"
          >
            Try again
          </Link>
        </Card>
      </Shell>
    );
  }

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
