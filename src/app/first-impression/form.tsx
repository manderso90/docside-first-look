"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { TextArea, QuietLinkButton, ErrorNote } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import {
  submitFirstImpression,
  skipFirstImpression,
  type FirstImpressionState,
} from "./actions";

const initialState: FirstImpressionState = { error: null };

export function FirstImpressionForm() {
  const [state, formAction] = useActionState(submitFirstImpression, initialState);
  const [text, setText] = useState("");
  const arrivedAt = useRef(0);
  const dwellInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    arrivedAt.current = performance.now();
  }, []);

  return (
    <div className="mt-5">
      <form
        action={formAction}
        onSubmit={() => {
          if (dwellInput.current) {
            dwellInput.current.value = String(
              Math.round(performance.now() - arrivedAt.current),
            );
          }
        }}
      >
        <TextArea
          name="answer"
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-label="What do you believe Docside does?"
          placeholder="In your own words…"
        />
        <input type="hidden" name="dwell_ms" defaultValue="0" ref={dwellInput} />
        {state.error ? <ErrorNote>{state.error}</ErrorNote> : null}
        <div className="mt-5">
          <SubmitButton disabled={text.trim().length === 0}>Continue</SubmitButton>
        </div>
      </form>
      <form action={skipFirstImpression} className="mt-3">
        <QuietLinkButton type="submit">Skip this question</QuietLinkButton>
      </form>
    </div>
  );
}
