import { requireStage } from "@/lib/flow";
import { Shell } from "@/components/shell";
import { VideoPlayer } from "./player";

/**
 * Screen 3 — Founder video (BRIEF §5.3).
 * Native HTML5 player, captions default-on, never autoplays with sound,
 * Continue enabled from the start (watching is observed, not enforced).
 * With no video configured (or on playback error), the four-beat text
 * summary renders and the flow never dead-ends.
 */
export default async function VideoPage() {
  await requireStage("video");
  const videoUrl = process.env.FOUNDER_VIDEO_URL ?? null;
  const captionsUrl = process.env.FOUNDER_VIDEO_CAPTIONS_URL ?? null;

  return (
    <Shell>
      <p className="text-[15px] font-medium text-ink">
        A short note from Morris — about a minute
      </p>
      <div className="mt-4">
        <VideoPlayer videoUrl={videoUrl} captionsUrl={captionsUrl} />
      </div>
    </Shell>
  );
}
