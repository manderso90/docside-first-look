import { z } from "zod";
import { STAGES } from "@/lib/stages";

/**
 * Telemetry event allowlist (BRIEF §8). Payload hygiene is a hard rule:
 * properties may never contain invite codes, tokens, emails, or headers.
 * Free-text answer content is allowed ONLY on the three events designed to
 * carry it. Unknown events are rejected; unknown properties are dropped
 * (and the drop is logged) by the ingestion route.
 */

const mission = z.number().int().min(1).max(4);

/** Per-event property schemas. `.strip()` semantics: zod objects strip
 * unknown keys by default — the ingestion route logs when keys were dropped. */
export const EVENT_PROPERTIES: Record<string, z.ZodObject<z.ZodRawShape>> = {
  invite_opened: z.object({}),
  preview_started: z.object({}),
  session_resumed: z.object({ resumed_stage: z.enum(STAGES) }),
  first_impression_submitted: z.object({
    answer: z.string().max(5000),
    dwell_ms: z.number().int().nonnegative(),
  }),
  step_skipped: z.object({ step: z.string().max(40) }),
  video_started: z.object({}),
  video_quartile: z.object({
    quartile: z.union([
      z.literal(25),
      z.literal(50),
      z.literal(75),
      z.literal(100),
    ]),
  }),
  video_completed: z.object({}),
  video_skipped: z.object({ at_pct: z.number().min(0).max(100) }),
  scenario_viewed: z.object({}),
  workspace_launched: z.object({}),
  mission_started: z.object({ mission }),
  mission_completed: z.object({
    mission,
    duration_ms: z.number().int().nonnegative(),
  }),
  first_click: z.object({
    element_id: z.string().max(120),
    region: z.string().max(60),
  }),
  source_link_opened: z.object({
    mission: mission.optional(),
    field: z.string().max(80),
    ref: z.string().max(80).optional(),
    surface: z.string().max(40).optional(),
  }),
  correction_attempted: z.object({
    mission: mission.optional(),
    field: z.string().max(80),
    mode: z.enum(["confirm", "corrected", "unreadable", "review"]),
  }),
  hint_requested: z.object({ mission }),
  micro_question_answered: z.object({
    mission,
    value: z.union([z.number(), z.string().max(120)]).optional(),
    comment: z.string().max(5000).optional(),
    offer: z.string().max(40).optional(),
    reason: z.string().max(5000).optional(),
  }),
  debrief_part_submitted: z.object({
    part: z.number().int().min(1).max(8),
  }),
  audio_recorded: z.object({
    duration_ms: z.number().int().nonnegative(),
  }),
  schedule_clicked: z.object({}),
  preview_completed: z.object({}),
  own_docs_volunteered: z.object({}),
  next_round_opted: z.object({}),
};

export const eventEnvelopeSchema = z.object({
  event: z.string(),
  stage: z.enum(STAGES),
  ts_client: z.string(),
  properties: z.record(z.string(), z.unknown()).default({}),
});

export type EventEnvelope = z.infer<typeof eventEnvelopeSchema>;
