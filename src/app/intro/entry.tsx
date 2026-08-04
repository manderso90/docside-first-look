"use client";

import { useState } from "react";

/**
 * Docside entry screen — the "what would you like to review?" surface.
 *
 * Two purposes (see task brief): a real product entry point in the Docside
 * app, and the static capture source for First Look Screen 2. It stays inside
 * the product's inherited language — review / verify / compare / source
 * document — and never reaches for promotional register ("best offer",
 * "instant insights", etc. are deliberately absent).
 *
 * Interaction is intentionally shallow: selecting a mode reveals a restrained
 * upload area whose copy reflects one document set (Single Offer) or two or
 * more (Multiple Offer Comparison). Nothing here posts to a backend — the
 * screen is a prototype/capture surface, not a live intake.
 */

type Mode = "single" | "multiple";

const MODES: Record<
  Mode,
  {
    title: string;
    support: string;
    uploadHeading: string;
    uploadHelper: string;
    icon: "single" | "multiple";
  }
> = {
  single: {
    title: "Single Offer",
    support:
      "Review one purchase agreement and verify key terms against the source document.",
    uploadHeading: "Upload a purchase agreement",
    uploadHelper:
      "Drag and drop a file here, or browse to upload a purchase agreement for review.",
    icon: "single",
  },
  multiple: {
    title: "Multiple Offer Comparison",
    support:
      "Compare multiple offers side by side to understand differences in price, terms, and contingencies.",
    uploadHeading: "Upload two or more purchase agreements",
    uploadHelper:
      "Drag and drop files here, or browse to upload the offers you want to compare.",
    icon: "multiple",
  },
};

export function Entry({ initialMode = null }: { initialMode?: Mode | null }) {
  const [mode, setMode] = useState<Mode | null>(initialMode);

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-12 sm:py-16">
      <header className="max-w-2xl">
        <h1 className="font-display text-[30px] font-semibold leading-tight tracking-tight text-deep-ocean sm:text-[34px]">
          What would you like to review?
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-3">
          Upload purchase agreement documents to review a single offer or
          compare multiple offers side by side.
        </p>
      </header>

      <div
        role="radiogroup"
        aria-label="Choose what to review"
        className="mt-9 grid gap-4 sm:grid-cols-2"
      >
        {(Object.keys(MODES) as Mode[]).map((key) => (
          <ModeCard
            key={key}
            mode={key}
            selected={mode === key}
            onSelect={() => setMode(key)}
          />
        ))}
      </div>

      {mode ? <UploadArea key={mode} mode={mode} /> : null}
    </div>
  );
}

function ModeCard({
  mode,
  selected,
  onSelect,
}: {
  mode: Mode;
  selected: boolean;
  onSelect: () => void;
}) {
  const { title, support, icon } = MODES[mode];

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`group relative flex flex-col rounded-card border bg-surface p-6 text-left shadow-card transition-all duration-150 sm:p-7 ${
        selected
          ? "border-deep-ocean ring-1 ring-deep-ocean"
          : "border-line hover:border-ocean-300"
      }`}
    >
      <span
        aria-hidden="true"
        className={`grid h-11 w-11 place-items-center rounded-control transition-colors ${
          selected
            ? "bg-verified text-white"
            : "bg-verified-soft text-deep-ocean"
        }`}
      >
        <ModeGlyph icon={icon} />
      </span>

      <span className="mt-4 font-display text-[19px] font-semibold leading-snug tracking-tight text-ink">
        {title}
      </span>
      <span className="mt-2 text-[14px] leading-relaxed text-ink-3">
        {support}
      </span>

      <span
        aria-hidden="true"
        className={`absolute right-5 top-5 grid h-6 w-6 place-items-center rounded-full transition-all duration-150 ${
          selected
            ? "scale-100 bg-verified text-white opacity-100"
            : "scale-90 opacity-0"
        }`}
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none">
          <path
            d="M5 12.5l4 4 10-10"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </button>
  );
}

function UploadArea({ mode }: { mode: Mode }) {
  const { uploadHeading, uploadHelper } = MODES[mode];

  return (
    <section
      aria-label={uploadHeading}
      className="mt-7 animate-[fadeIn_0.4s_var(--ease-calm)]"
    >
      <div className="rounded-card border border-dashed border-ocean-300 bg-surface-2 px-6 py-10 text-center sm:py-12">
        <span
          aria-hidden="true"
          className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-line-2 bg-surface text-deep-ocean"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
            <path
              d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M4 15v2.5A2.5 2.5 0 006.5 20h11a2.5 2.5 0 002.5-2.5V15"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>

        <h2 className="mt-4 font-display text-[18px] font-semibold tracking-tight text-ink">
          {uploadHeading}
        </h2>
        <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-ink-3">
          {uploadHelper}
        </p>

        <div className="mt-5">
          <span className="inline-flex items-center justify-center rounded-control border border-line bg-surface px-4 py-2 text-[13px] font-semibold text-ink transition-colors hover:border-ink-3">
            Browse files
          </span>
        </div>

        <p className="label-caps mt-6 text-muted">Accepted file types: PDF, DOCX</p>
      </div>
    </section>
  );
}

function ModeGlyph({ icon }: { icon: "single" | "multiple" }) {
  if (icon === "single") {
    return (
      <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none">
        <path
          d="M7 3.5h6.5L18 8v11.5A1.5 1.5 0 0116.5 21h-9A1.5 1.5 0 016 19.5v-14A1.5 1.5 0 017.5 4"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M13 3.5V8h4.5M9 12.5h6M9 15.5h6"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none">
      <rect
        x="3.5"
        y="4.5"
        width="7"
        height="15"
        rx="1.4"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <rect
        x="13.5"
        y="4.5"
        width="7"
        height="15"
        rx="1.4"
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </svg>
  );
}
