/**
 * The funnel-stage enum (BRIEF §4). Order is the forward-only flow;
 * drop-off analysis is "last stage with an event."
 */
export const STAGES = [
  "welcome",
  "first_impression",
  "video",
  "scenario",
  "mission_1",
  "mission_2",
  "mission_3",
  "mission_4",
  "debrief",
  "thank_you",
] as const;

export type Stage = (typeof STAGES)[number];

export function stageIndex(stage: Stage): number {
  return STAGES.indexOf(stage);
}

/** True when `candidate` is at or before `reached` in the flow. */
export function isStageReachable(candidate: Stage, reached: Stage): boolean {
  return stageIndex(candidate) <= stageIndex(reached);
}

/** Shell route for a stage (missions live in the main app, not the shell). */
export function stagePath(stage: Stage): string {
  switch (stage) {
    case "welcome":
      return "/welcome";
    case "first_impression":
      return "/first-impression";
    case "video":
      return "/video";
    case "scenario":
      return "/scenario";
    case "mission_1":
    case "mission_2":
    case "mission_3":
    case "mission_4":
      return "/workspace";
    case "debrief":
      return "/debrief";
    case "thank_you":
      return "/thank-you";
  }
}
