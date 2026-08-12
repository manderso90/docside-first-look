"use client";

import { useState, useTransition } from "react";
import { chooseNextStep, type NextStepChoice } from "./actions";

const CHOICES: { id: NextStepChoice; label: string }[] = [
  { id: "own_docs", label: "Try Docside with my own documents" },
  { id: "next_round", label: "Join the next feedback round" },
  { id: "finished", label: "I'm finished for now" },
];

/** Three equal-weight choices; the own-documents path shows the human
 * follow-up note and never an upload UI (BRIEF §5.7). */
export function NextSteps() {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (message) {
    return <p className="text-[14px] font-medium text-ink">{message}</p>;
  }

  // Stage A3: the exploration's primary → outline → ghost ladder, centered.
  // Equal-weight rule kept in substance: all three remain plain one-click
  // choices with no default and no persuasion copy.
  const VARIANT: Record<NextStepChoice, string> = {
    own_docs: "btn-primary",
    next_round: "btn-outline",
    finished: "btn-ghost",
  };

  return (
    <div className="flex flex-col justify-center gap-2.5 sm:flex-row">
      {CHOICES.map((choice) => (
        <button
          key={choice.id}
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              setMessage(await chooseNextStep(choice.id));
            })
          }
          className={`btn ${VARIANT[choice.id]}`}
        >
          {choice.label}
        </button>
      ))}
    </div>
  );
}
