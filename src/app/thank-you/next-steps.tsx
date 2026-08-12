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

  // Founder decision 2026-08-12: all three choices render identically (outline)
  // so the screen never reads as a conversion funnel (BRIEF §5.7 equal weight).
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
          className="btn btn-outline"
        >
          {choice.label}
        </button>
      ))}
    </div>
  );
}
