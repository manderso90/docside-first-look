import { requireStage } from "@/lib/flow";
import { Shell, ScreenTitle } from "@/components/shell";
import { IconCheck } from "@/components/first-look-ui/icons";
import { getStore } from "@/lib/store";
import { beginPreview } from "./actions";
import { SubmitButton } from "@/components/submit-button";

/**
 * Screen 1 — Personalized welcome (BRIEF §5.1).
 * One action. No account UI, no navigation chrome, no leaks out.
 */
export default async function WelcomePage() {
  const { session, participant } = await requireStage("welcome");
  const returning = session.lastStage !== "welcome";

  const invite = await getStore().getInviteById(session.inviteId);
  const personalNote = invite?.personalNote || null;

  return (
    <Shell>
      <ScreenTitle>
        {returning
          ? `Welcome back, ${participant.firstName}.`
          : `Welcome, ${participant.firstName}.`}
      </ScreenTitle>

      <p className="mt-4 text-[15px] leading-relaxed text-ink-2">
        Morris invited you to privately preview an early version of Docside.
      </p>

      {personalNote ? (
        <p className="mt-4 border-l-2 border-ocean-200 pl-4 text-[14px] italic leading-relaxed text-ink-3">
          {personalNote}
        </p>
      ) : null}

      <p className="mt-4 text-[14px] leading-relaxed text-ink-2">
        This is not a sales presentation. We would like your honest assessment
        of what Docside does well, what feels unclear, and what would make it
        more useful in your work.
      </p>

      <ul className="mt-8 space-y-3">
        <Expectation>About 12 minutes</Expectation>
        <Expectation>No preparation required</Expectation>
        <Expectation>Honest criticism is encouraged</Expectation>
      </ul>

      <form action={beginPreview} className="mt-10">
        <SubmitButton>
          {returning ? "Continue My Preview" : "Begin My Docside Preview"}
        </SubmitButton>
      </form>
    </Shell>
  );
}

function Expectation({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-3 text-[14px] text-ink-2">
      <span
        aria-hidden="true"
        className="grid h-5 w-5 place-items-center rounded-full bg-ocean-50 text-deep-ocean"
      >
        <IconCheck size={11} strokeWidth={3} />
      </span>
      {children}
    </li>
  );
}
