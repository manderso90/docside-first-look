"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  AUDIO_CONSENT_COPY,
  AUDIO_MAX_SECONDS,
  DEBRIEF_PARTS,
  type DebriefPart,
} from "@/lib/debrief";
import { TextArea, QuietLinkButton, ErrorNote, PrimaryButton } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { beacon } from "@/lib/beacon";
import { saveDebriefPart, type DebriefSaveState } from "./actions";

const initialState: DebriefSaveState = {
  error: null,
  savedPart: null,
  savedAnswer: null,
};

export function DebriefStepper({
  startAt,
  priorAnswers,
  scheduleUrl,
}: {
  startAt: number;
  priorAnswers: Record<number, Record<string, unknown>>;
  scheduleUrl: string | null;
}) {
  const [current, setCurrent] = useState(Math.min(Math.max(startAt, 1), 8));
  const [state, formAction] = useActionState(saveDebriefPart, initialState);
  // priorAnswers is a page-load snapshot; saves made during this visit land
  // here so Back shows what was actually saved instead of a stale blank
  // (which Continue would then dutifully save over the real answer).
  const [answers, setAnswers] =
    useState<Record<number, Record<string, unknown>>>(priorAnswers);

  // Advance once per successful save (part 8 redirects server-side).
  // Keyed on the state OBJECT, not savedPart: re-saving the same part after
  // Back yields an identical savedPart number, and a number-keyed effect
  // would skip the advance and strand the participant on the saved part.
  useEffect(() => {
    if (state.savedPart !== null) {
      const part = state.savedPart;
      if (state.savedAnswer) {
        setAnswers((prev) => ({ ...prev, [part]: state.savedAnswer! }));
      }
      if (part < 8) setCurrent(part + 1);
    }
  }, [state]);

  const spec = DEBRIEF_PARTS.find((p) => p.part === current)!;

  return (
    <div className="rounded-card border border-line bg-surface p-6 shadow-card sm:p-8">
      <div className="flex items-baseline justify-between gap-4">
        <p className="label-caps text-deep-ocean">{spec.label}</p>
        <p className="text-[12px] text-ink-3">{current} of 8</p>
      </div>

      <h2 className="mt-3 font-display text-[20px] font-semibold leading-snug text-ink">
        {spec.question}
      </h2>

      <form action={formAction} className="mt-5" key={current}>
        <input type="hidden" name="part" value={spec.part} />
        <PartBody
          spec={spec}
          prior={answers[spec.part]}
          scheduleUrl={scheduleUrl}
        />
        {state.error ? <ErrorNote>{state.error}</ErrorNote> : null}
        <div className="mt-6 flex items-center justify-between">
          {current > 1 ? (
            <QuietLinkButton type="button" onClick={() => setCurrent(current - 1)}>
              Back
            </QuietLinkButton>
          ) : (
            <span />
          )}
          <SubmitButton>{current === 8 ? "Finish" : "Continue"}</SubmitButton>
        </div>
      </form>
    </div>
  );
}

function PartBody({
  spec,
  prior,
  scheduleUrl,
}: {
  spec: DebriefPart;
  prior?: Record<string, unknown>;
  scheduleUrl: string | null;
}) {
  if (spec.kind === "open_text") {
    return (
      <TextArea
        name="text"
        rows={4}
        defaultValue={typeof prior?.text === "string" ? prior.text : ""}
        aria-label={spec.question}
        placeholder="In your own words…"
      />
    );
  }

  if (spec.kind === "single_choice") {
    const priorChoice = typeof prior?.choice === "string" ? prior.choice : null;
    return (
      <fieldset className="space-y-2.5">
        <legend className="sr-only">{spec.question}</legend>
        {spec.options.map((option) => (
          <label
            key={option}
            className="flex cursor-pointer items-center gap-3 rounded-control border border-line bg-surface px-3.5 py-2.5 text-[14px] text-ink-2 transition-colors has-checked:border-verified-line has-checked:bg-verified-soft has-checked:text-ink"
          >
            <input
              type="radio"
              name="choice"
              value={option}
              defaultChecked={priorChoice === option}
              className="accent-deep-ocean"
            />
            {option}
          </label>
        ))}
      </fieldset>
    );
  }

  return <OpenChannel prior={prior} scheduleUrl={scheduleUrl} />;
}

/** Part 8 — three channels: type · record audio · schedule (BRIEF §7). */
function OpenChannel({
  prior,
  scheduleUrl,
}: {
  prior?: Record<string, unknown>;
  scheduleUrl: string | null;
}) {
  const [audioState, setAudioState] = useState<
    "idle" | "recording" | "uploading" | "done" | "unavailable"
  >("idle");
  const [seconds, setSeconds] = useState(0);
  const secondsRef = useRef(0);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timer = useRef<number | null>(null);

  const stopTimer = () => {
    if (timer.current !== null) window.clearInterval(timer.current);
    timer.current = null;
  };

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      recorder.current = rec;
      chunks.current = [];
      rec.ondataavailable = (e) => chunks.current.push(e.data);
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setAudioState("uploading");
        const blob = new Blob(chunks.current, { type: rec.mimeType || "audio/webm" });
        try {
          const res = await fetch("/api/audio", {
            method: "POST",
            headers: {
              "content-type": blob.type || "audio/webm",
              "x-audio-duration-ms": String(secondsRef.current * 1000),
            },
            body: blob,
          });
          setAudioState(res.ok ? "done" : "idle");
        } catch {
          setAudioState("idle");
        }
      };
      rec.start();
      setSeconds(0);
      secondsRef.current = 0;
      setAudioState("recording");
      timer.current = window.setInterval(() => {
        setSeconds((s) => {
          const next = s + 1;
          secondsRef.current = next;
          if (next >= AUDIO_MAX_SECONDS) {
            recorder.current?.stop();
            stopTimer();
          }
          return next;
        });
      }, 1000);
    } catch {
      // Permission denied or no mic: fall back to text with no error tone.
      setAudioState("unavailable");
    }
  }

  return (
    <div className="space-y-5">
      <TextArea
        name="text"
        rows={4}
        defaultValue={typeof prior?.text === "string" ? prior.text : ""}
        aria-label="Type your feedback"
        placeholder="Type anything at all — or use one of the options below."
      />
      <input
        type="hidden"
        name="channel"
        value={audioState === "done" ? "audio" : "text"}
      />

      {audioState !== "unavailable" ? (
        <div className="rounded-control border border-line-2 bg-surface-2 p-4">
          <p className="text-[13px] text-ink-2">
            Prefer to say it out loud? {AUDIO_CONSENT_COPY}
          </p>
          <div className="mt-3 flex items-center gap-3">
            {audioState === "idle" ? (
              <PrimaryButton type="button" onClick={startRecording}>
                Record an audio response
              </PrimaryButton>
            ) : null}
            {audioState === "recording" ? (
              <>
                <PrimaryButton
                  type="button"
                  onClick={() => {
                    recorder.current?.stop();
                    stopTimer();
                  }}
                >
                  Stop recording
                </PrimaryButton>
                <span className="font-mono text-[13px] text-conflict" aria-live="polite">
                  ● {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
                </span>
              </>
            ) : null}
            {audioState === "uploading" ? (
              <span className="text-[13px] text-ink-3">Saving your recording…</span>
            ) : null}
            {audioState === "done" ? (
              <span className="text-[13px] font-medium text-success-deep">
                Recording saved — Morris will hear it.
              </span>
            ) : null}
          </div>
        </div>
      ) : null}

      {scheduleUrl ? (
        <p className="text-[13px] text-ink-3">
          Or{" "}
          <a
            href={scheduleUrl}
            target="_blank"
            rel="noopener"
            onClick={() => beacon("schedule_clicked", "debrief")}
            className="text-deep-ocean underline decoration-ocean-200 underline-offset-2 hover:decoration-deep-ocean"
          >
            schedule a short conversation with Morris
          </a>{" "}
          instead.
        </p>
      ) : null}
    </div>
  );
}
