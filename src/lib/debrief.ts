/**
 * The debrief instrument (BRIEF §7). Wording is FINAL — any deviation is a
 * build bug; any future edit must cite the no-leading-questions rule in a
 * one-line justification next to the change.
 */

export type DebriefPartId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface OpenTextPart {
  kind: "open_text";
  part: DebriefPartId;
  label: string;
  question: string;
}

export interface SingleChoicePart {
  kind: "single_choice";
  part: DebriefPartId;
  label: string;
  question: string;
  options: string[];
}

export interface OpenChannelPart {
  kind: "open_channel";
  part: DebriefPartId;
  label: string;
  question: string;
}

export type DebriefPart = OpenTextPart | SingleChoicePart | OpenChannelPart;

export const DEBRIEF_PARTS: DebriefPart[] = [
  {
    kind: "open_text",
    part: 1,
    label: "Understanding",
    question:
      "Now that you have used it, how would you describe Docside to another real estate agent?",
  },
  {
    kind: "single_choice",
    part: 2,
    label: "Value",
    question: "Which part of Docside felt most valuable?",
    options: [
      "Understanding an individual offer",
      "Verifying contract terms",
      "Comparing multiple offers",
      "Preparing information for the seller",
      "None yet",
    ],
  },
  {
    kind: "open_text",
    part: 3,
    label: "Trust",
    question:
      "Was there anything you saw that you would hesitate to rely upon?",
  },
  {
    kind: "single_choice",
    part: 4,
    label: "Workflow fit",
    question:
      "At what point in your normal workflow could you see yourself using Docside?",
    options: [
      "When the first offer arrives",
      "When multiple offers have been received",
      "Before presenting to the seller",
      "During counteroffers",
      "After acceptance",
      "I do not yet see where it fits",
    ],
  },
  {
    kind: "open_text",
    part: 5,
    label: "Friction",
    question: "What was the most confusing or difficult part?",
  },
  {
    kind: "open_text",
    part: 6,
    label: "Missing capability",
    question:
      "What would Docside need before you would use it on an active listing?",
  },
  {
    kind: "single_choice",
    part: 7,
    label: "Commitment",
    question:
      "Would you be willing to use Docside with one of your own offer packages?",
    options: [
      "Yes, now",
      "Yes, after certain improvements",
      "Possibly, but I need more information",
      "No",
    ],
  },
  {
    kind: "open_channel",
    part: 8,
    label: "Open response",
    question: "Anything else — in whatever form is easiest.",
  },
];

export function responsePartKey(part: DebriefPartId): `part_${DebriefPartId}` {
  return `part_${part}`;
}

/** Audio consent copy shown BEFORE the mic permission request (§7 Part 8). */
export const AUDIO_CONSENT_COPY =
  "Recording starts only when you press the button, and only Morris hears it.";

export const AUDIO_MAX_SECONDS = 180;
