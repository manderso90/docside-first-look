import { randomUUID } from "crypto";
import { STAGES, stageIndex, type Stage } from "@/lib/stages";
import type {
  EventRecord,
  FirstLookStore,
  Invite,
  InviteLookup,
  Participant,
  Session,
  SurveyResponse,
} from "./types";

/**
 * In-memory store for local development only, seeded with one dev invite.
 * State does not survive server restarts and is per-instance — never deploy
 * with this store selected (see store/index.ts guard).
 *
 * Dev invite URL: http://localhost:3000/dev-preview-morris
 */

const participant: Participant = {
  id: "11111111-1111-4111-8111-111111111111",
  firstName: "Angela",
  email: "dev-participant@example.invalid",
  participantNumber: 7,
  participantRef: "pr_dev0000",
  cohort: 1,
  previewAgentId: null,
};

const invite: Invite = {
  id: "22222222-2222-4222-8222-222222222222",
  code: "dev-preview-morris",
  participantId: participant.id,
  personalNote:
    "You were invited because of your experience working with real estate purchase agreements and communicating offer terms to sellers.",
  revokedAt: null,
  expiresAt: null,
};

const revokedInvite: Invite = {
  id: "33333333-3333-4333-8333-333333333333",
  code: "dev-revoked",
  participantId: participant.id,
  personalNote: "",
  revokedAt: new Date(0).toISOString(),
  expiresAt: null,
};

/**
 * Dev state lives on globalThis: `next dev` compiles routes into separate
 * server bundles and hot-reloads reset module scope, so plain module-level
 * Maps silently drop sessions between screens (seen as a mid-flow bounce to
 * /link-inactive). globalThis survives both. Dev-only store, so no prod risk.
 */
interface MemoryState {
  sessions: Map<string, Session>;
  events: EventRecord[];
  responses: Map<string, SurveyResponse>;
  previewAgentByParticipant: Map<string, string>;
}

const globalState = globalThis as typeof globalThis & {
  __firstLookMemoryState?: MemoryState;
};
if (!globalState.__firstLookMemoryState) {
  const fresh: MemoryState = {
    sessions: new Map(),
    events: [],
    responses: new Map(),
    previewAgentByParticipant: new Map(),
  };
  globalState.__firstLookMemoryState = fresh;
}
// Older HMR-surviving state may predate a field; backfill defensively.
if (!globalState.__firstLookMemoryState.previewAgentByParticipant) {
  globalState.__firstLookMemoryState.previewAgentByParticipant = new Map();
}
const { sessions, events, responses, previewAgentByParticipant } =
  globalState.__firstLookMemoryState;

export class MemoryStore implements FirstLookStore {
  async lookupInvite(code: string): Promise<InviteLookup> {
    if (code === invite.code) return { status: "ok", invite, participant };
    if (code === revokedInvite.code)
      return { status: "revoked", invite: revokedInvite, participant };
    return { status: "not_found" };
  }

  async getInviteById(inviteId: string): Promise<Invite | null> {
    if (inviteId === invite.id) return invite;
    if (inviteId === revokedInvite.id) return revokedInvite;
    return null;
  }

  async getParticipant(participantId: string): Promise<Participant | null> {
    if (participantId !== participant.id) return null;
    return {
      ...participant,
      previewAgentId: previewAgentByParticipant.get(participant.id) ?? null,
    };
  }

  async setPreviewAgent(
    participantId: string,
    agentUserId: string,
  ): Promise<void> {
    previewAgentByParticipant.set(participantId, agentUserId);
  }

  async createSession(input: {
    participantId: string;
    inviteId: string;
    device: Session["device"];
  }): Promise<Session> {
    const session: Session = {
      id: randomUUID(),
      participantId: input.participantId,
      inviteId: input.inviteId,
      startedAt: new Date().toISOString(),
      device: input.device,
      lastStage: "welcome",
    };
    sessions.set(session.id, session);
    return session;
  }

  async getSession(sessionId: string): Promise<Session | null> {
    return sessions.get(sessionId) ?? null;
  }

  async advanceStage(sessionId: string, stage: Stage): Promise<void> {
    const session = sessions.get(sessionId);
    if (!session) return;
    if (stageIndex(stage) > stageIndex(session.lastStage)) {
      session.lastStage = stage;
    }
  }

  async furthestStage(participantId: string): Promise<Stage> {
    let furthest: Stage = "welcome";
    for (const session of sessions.values()) {
      if (
        session.participantId === participantId &&
        stageIndex(session.lastStage) > stageIndex(furthest)
      ) {
        furthest = session.lastStage;
      }
    }
    return furthest;
  }

  async hasPriorSession(participantId: string): Promise<boolean> {
    for (const session of sessions.values()) {
      if (session.participantId === participantId) return true;
    }
    return false;
  }

  async insertEvent(event: EventRecord): Promise<void> {
    events.push(event);
    // Dev visibility: the memory store is dev-only, so log the funnel.
    console.log(`[first-look event] ${event.stage}/${event.event}`, event.properties);
  }

  async saveResponse(response: SurveyResponse): Promise<void> {
    responses.set(`${response.participantId}:${response.part}`, response);
  }

  async getResponses(participantId: string): Promise<SurveyResponse[]> {
    return [...responses.values()]
      .filter((r) => r.participantId === participantId)
      .sort((a, b) => a.part.localeCompare(b.part));
  }
}

export const DEV_STAGE_ORDER = STAGES;
