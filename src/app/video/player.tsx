"use client";

import { useRef, useState } from "react";
import { beacon } from "@/lib/beacon";
import { SubmitButton } from "@/components/submit-button";
import { continueFromVideo } from "./actions";

const FOUR_BEATS = [
  "Real estate agents receive some of the most important information in a transaction inside lengthy documents and email attachments. Morris created Docside to help make those documents easier to understand, verify, compare, and communicate.",
  "What you are about to see is an early working version — not the finished product.",
  "Approach it as though you have just received offers on one of your listings. Use it naturally — nothing you do will break it, and there are no wrong answers.",
  "The most helpful feedback is anything that surprises you, slows you down, or causes you not to trust what you see.",
];

export function VideoPlayer({
  videoUrl,
  captionsUrl,
}: {
  videoUrl: string | null;
  captionsUrl: string | null;
}) {
  const [failed, setFailed] = useState(false);
  const playedPct = useRef(0);
  const started = useRef(false);
  const quartilesFired = useRef(new Set<number>());
  const completedFired = useRef(false);

  const showFallback = failed || !videoUrl;

  return (
    <div>
      {showFallback ? (
        <div className="rounded-card border border-line bg-surface p-6 shadow-card">
          {failed ? (
            <p className="mb-4 text-[13px] text-ink-3">
              The video couldn&rsquo;t play here — the short version, in text:
            </p>
          ) : null}
          <ul className="space-y-3">
            {FOUR_BEATS.map((beat) => (
              <li key={beat} className="text-[14px] leading-relaxed text-ink-2">
                {beat}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="overflow-hidden rounded-card border border-line bg-midnight-slate shadow-card">
          <video
            className="aspect-video w-full"
            controls
            preload="metadata"
            crossOrigin="anonymous"
            onPlay={() => {
              if (!started.current) {
                started.current = true;
                beacon("video_started", "video");
              }
            }}
            onTimeUpdate={(e) => {
              const el = e.currentTarget;
              if (!el.duration) return;
              const pct = (el.currentTime / el.duration) * 100;
              playedPct.current = Math.max(playedPct.current, pct);
              for (const q of [25, 50, 75, 100] as const) {
                if (pct >= q && !quartilesFired.current.has(q)) {
                  quartilesFired.current.add(q);
                  beacon("video_quartile", "video", { quartile: q });
                }
              }
              // "Watched" definition: ≥90% reached, fired exactly once.
              if (pct >= 90 && !completedFired.current) {
                completedFired.current = true;
                beacon("video_completed", "video");
              }
            }}
            onError={() => setFailed(true)}
          >
            <source src={videoUrl} />
            {captionsUrl ? (
              <track
                kind="captions"
                src={captionsUrl}
                srcLang="en"
                label="English"
                default
              />
            ) : null}
          </video>
        </div>
      )}

      <form
        action={continueFromVideo}
        className="mt-6"
        onSubmit={(e) => {
          const input = e.currentTarget.elements.namedItem(
            "played_pct",
          ) as HTMLInputElement | null;
          if (input) input.value = String(Math.round(playedPct.current));
        }}
      >
        {/* Fallback readers aren't "skipping" — only real playback under 25% is. */}
        <input
          type="hidden"
          name="played_pct"
          defaultValue={showFallback ? "100" : "0"}
        />
        <SubmitButton>Continue</SubmitButton>
      </form>
    </div>
  );
}
