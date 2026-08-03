import { existsSync } from "fs";
import { join } from "path";
import Image from "next/image";
import { requireStage } from "@/lib/flow";
import { Shell, ScreenTitle, Card } from "@/components/shell";
import { FirstImpressionForm } from "./form";

/**
 * Screen 2 — First-impression question (BRIEF §5.2).
 * Always precedes the video; no product explanation of any kind here.
 * The framed capture is a static, non-interactive image of Docside's
 * introductory screen (asset lands with Phase 4; graceful frame until then).
 */
export default async function FirstImpressionPage() {
  await requireStage("first_impression");
  const captureExists = existsSync(
    join(process.cwd(), "public", "docside-intro-capture.png"),
  );

  return (
    <Shell>
      <Card>
        <div className="overflow-hidden rounded-control border border-line-2 bg-surface-2">
          <div className="relative aspect-[16/10] w-full">
            {captureExists ? (
              <Image
                src="/docside-intro-capture.png"
                alt="A first look at Docside's main screen"
                fill
                className="object-cover object-top"
                sizes="(max-width: 640px) 100vw, 576px"
                priority
              />
            ) : (
              // Build-time stand-in until the Phase 4 capture asset lands.
              // Never ships to participants: Cohort 1 gating includes the asset.
              <div className="grid h-full w-full place-items-center">
                <span className="label-caps text-muted">
                  Docside capture pending (Phase 4 asset)
                </span>
              </div>
            )}
          </div>
        </div>
        <p className="label-caps mt-3 text-ink-3">
          A screen from Docside — just look, nothing to click yet
        </p>
      </Card>

      <div className="mt-8">
        <ScreenTitle>
          Based on what you see, what do you believe Docside does?
        </ScreenTitle>
        <p className="mt-2 text-[13px] text-ink-3">
          A sentence or two in your own words. There are no wrong answers.
        </p>
        <FirstImpressionForm />
      </div>
    </Shell>
  );
}
