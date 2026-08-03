import type { Stage } from "@/lib/stages";

/**
 * Data model per BRIEF §9. The production store is the `first_look` schema
 * in the main docside Supabase project (AD-4); the memory store backs local
 * dev before that schema exists.
 */

export interface Participant {
  id: string;
  firstName: string;
  email: string;
  participantNumber: number;
  /** Random, non-secret public reference (scheduling links etc.). Grants no access. */
  participantRef: string;
  cohort: number;
}

export interface Invite {
  id: string;
  code: string;
  participantId: string;
  /** Morris's one-to-two-sentence why-you-were-selected note. */
  personalNote: string;
  revokedAt: string | null;
  expiresAt: string | null;
}

export interface Session {
  id: string;
  participantId: string;
  inviteId: string;
  startedAt: string;
  device: "desktop" | "mobile" | "tablet";
  lastStage: Stage;
}

export interface EventRecord {
  eventId: string;
  participantId: string;
  sessionId: string;
  stage: Stage;
  event: string;
  properties: Record<string, unknown>;
  tsClient: string;
  tsServer: string;
  device: string;
}

export type ResponsePart =
  | "first_impression"
  | "m1"
  | "m2"
  | "m3"
  | "m4"
  | "part_1"
  | "part_2"
  | "part_3"
  | "part_4"
  | "part_5"
  | "part_6"
  | "part_7"
  | "part_8";

export interface SurveyResponse {
  participantId: string;
  part: ResponsePart;
  answer: Record<string, unknown>;
  updatedAt: string;
}

export interface InviteLookup {
  status: "ok" | "not_found" | "revoked" | "expired";
  invite?: Invite;
  participant?: Participant;
}

export interface FirstLookStore {
  lookupInvite(code: string): Promise<InviteLookup>;
  getInviteById(inviteId: string): Promise<Invite | null>;
  getParticipant(participantId: string): Promise<Participant | null>;
  /** Creates a session row; returns it. One row per entry (returns = multiple rows). */
  createSession(input: {
    participantId: string;
    inviteId: string;
    device: Session["device"];
  }): Promise<Session>;
  getSession(sessionId: string): Promise<Session | null>;
  /** Advances lastStage; never moves backwards. */
  advanceStage(sessionId: string, stage: Stage): Promise<void>;
  /** Latest lastStage across ALL of a participant's sessions (resume point). */
  furthestStage(participantId: string): Promise<Stage>;
  hasPriorSession(participantId: string): Promise<boolean>;
  insertEvent(event: EventRecord): Promise<void>;
  /** Upsert per (participant, part) — latest wins (BRIEF §9). */
  saveResponse(response: SurveyResponse): Promise<void>;
  getResponses(participantId: string): Promise<SurveyResponse[]>;
}
