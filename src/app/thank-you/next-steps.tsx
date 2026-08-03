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

  return (
    <div className="flex flex-col gap-2.5 sm:flex-row">
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
          className="rounded-control border border-line bg-surface px-4 py-2.5 text-[13.5px] font-medium text-ink-2 transition-colors hover:border-ocean-200 hover:bg-ocean-50 hover:text-deep-ocean disabled:cursor-not-allowed disabled:text-muted"
        >
          {choice.label}
        </button>
      ))}
    </div>
  );
}
