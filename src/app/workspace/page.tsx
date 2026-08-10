import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/session";
import { stageIndex, stagePath } from "@/lib/stages";
import { Shell, ScreenTitle, Card } from "@/components/shell";
import { SubmitButton } from "@/components/submit-button";
import { completeMissionsDev, enterWorkspace } from "./actions";

/**
 * Screen 5's boundary (BRIEF §5.5). The real screen IS the docside app at
 * app.docside.ai in preview mode. With APP_HANDOFF_URL configured this page
 * renders a brief interstitial — what the missions are about to be, and that
 * the app's banner leads back here — and the Continue button's server action
 * provisions + mints + redirects (founder request 2026-08-09: hand-holding at
 * the handoff instead of a silent redirect).
 *
 * Minting happens ONLY in the enterWorkspace action, never at render: the
 * magic-link token is single-use and short-lived, so a render-time mint would
 * burn a token per refresh and could expire while the participant reads this
 * page. ?retry=1 marks a failed mint and swaps in the calm try-again state.
 */
export default async function WorkspacePage({
  searchParams,
}: {
  searchParams: Promise<{ retry?: string }>;
}) {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/link-inactive");
  const reached = stageIndex(ctx.session.lastStage);
  if (reached < stageIndex("mission_1")) redirect(stagePath(ctx.session.lastStage));
  if (reached > stageIndex("mission_4")) redirect(stagePath(ctx.session.lastStage));

  if (process.env.APP_HANDOFF_URL) {
    const { retry } = await searchParams;
    if (retry) {
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
            {/* Link styled as PrimaryButton (ui.tsx): back to the
                interstitial, whose action does the minting. prefetch={false}
                stays as belt-and-braces even though rendering /workspace no
                longer mints anything. */}
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
          <p className="label-caps text-deep-ocean">Entering Docside</p>
          <ScreenTitle>You&apos;re entering Docside itself.</ScreenTitle>
          <p className="mt-4 text-[14px] leading-relaxed text-ink-2">
            The four short missions happen inside the real application — the
            Oakview offers are already waiting in your workspace. The banner
            inside Docside will bring you back here when you&apos;re done.
          </p>
          <form action={enterWorkspace} className="mt-7">
            <SubmitButton>Continue to Docside</SubmitButton>
          </form>
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
