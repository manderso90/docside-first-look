import { randomUUID } from "crypto";
import { STAGES, stageIndex, type Stage } from "@/lib/stages";
import {
  inviteExpired,
  type EventRecord,
  type FirstLookStore,
  type Invite,
  type InviteLookup,
  type Participant,
  type Session,
  type SurveyResponse,
} from "./types";

/**
 * In-memory store for local development only, seeded with dev invites.
 * State does not survive server restarts and is per-instance — never deploy
 * with this store selected (see store/index.ts guard).
 *
 * Dev invite URL: http://localhost:3000/dev-preview-morris
 *
 * Two synthetic participants. Angela owns the walkable dev invite the
 * journey e2e uses; Noor owns the invites the revocation e2e mutates through
 * the dev-gated hook route (src/app/api/e2e-hooks) so revoking or expiring
 * one never disturbs the other — that isolation IS one of the cases under
 * test. All names, emails and codes are fictional.
 */

const angela: Participant = {
  id: "11111111-1111-4111-8111-111111111111",
  firstName: "Angela",
  email: "dev-participant@example.invalid",
  participantNumber: 7,
  participantRef: "pr_dev0000",
  cohort: 1,
  previewAgentId: null,
};

const noor: Participant = {
  id: "44444444-4444-4444-8444-444444444444",
  firstName: "Noor",
  email: "dev-participant-2@example.invalid",
  participantNumber: 8,
  participantRef: "pr_dev0001",
  cohort: 99,
  previewAgentId: null,
};

const PARTICIPANTS: readonly Participant[] = [angela, noor];

const FAR_FUTURE = "2099-01-01T00:00:00.000Z";
const LONG_PAST = "1970-01-02T00:00:00.000Z";

/** Fresh copies every time: the e2e hook mutates these in place and `reset`
 * re-seeds them, so the seed must never hand out shared objects. */
function seedInvites(): Map<string, Invite> {
  const seeds: Invite[] = [
    {
      id: "22222222-2222-4222-8222-222222222222",
      code: "dev-preview-morris",
      participantId: angela.id,
      personalNote:
        "You were invited because of your experience working with real estate purchase agreements and communicating offer terms to sellers.",
      revokedAt: null,
      expiresAt: null,
    },
    {
      id: "33333333-3333-4333-8333-333333333333",
      code: "dev-revoked",
      participantId: angela.id,
      personalNote: "",
      revokedAt: new Date(0).toISOString(),
      expiresAt: null,
    },
    // Noor's invites — the revocation e2e fixtures (hook actions in brackets).
    {
      id: "55555555-5555-4555-8555-555555555555",
      code: "dev-revocable", // active until [revoke]
      participantId: noor.id,
      personalNote: "Synthetic revocation fixture.",
      revokedAt: null,
      expiresAt: null,
    },
    {
      id: "66666666-6666-4666-8666-666666666666",
      code: "dev-expiring", // active with a far-future expiry until [expire]
      participantId: noor.id,
      personalNote: "Synthetic expiry fixture.",
      revokedAt: null,
      expiresAt: FAR_FUTURE,
    },
    {
      id: "77777777-7777-4777-8777-777777777777",
      code: "dev-expired", // already expired at the exchange
      participantId: noor.id,
      personalNote: "",
      revokedAt: null,
      expiresAt: LONG_PAST,
    },
  ];
  return new Map(seeds.map((invite) => [invite.code, invite]));
}

/**
 * Dev state lives on globalThis: `next dev` compiles routes into separate
 * server bundles and hot-reloads reset module scope, so plain module-level
 * Maps silently drop sessions between screens (seen as a mid-flow bounce to
 * /link-inactive). globalThis survives both. Dev-only store, so no prod risk.
 */
interface MemoryState {
  invites: Map<string, Invite>;
  sessions: Map<string, Session>;
  events: EventRecord[];
  responses: Map<string, SurveyResponse>;
  previewAgentByParticipant: Map<string, string>;
  /** Dev fixture: when true every read throws, simulating a store outage. */
  fault: boolean;
}

const globalState = globalThis as typeof globalThis & {
  __firstLookMemoryState?: MemoryState;
};
if (!globalState.__firstLookMemoryState) {
  const fresh: MemoryState = {
    invites: seedInvites(),
    sessions: new Map(),
    events: [],
    responses: new Map(),
    previewAgentByParticipant: new Map(),
    fault: false,
  };
  globalState.__firstLookMemoryState = fresh;
}
// Older HMR-surviving state may predate a field; backfill defensively.
const state = globalState.__firstLookMemoryState;
if (!state.previewAgentByParticipant) state.previewAgentByParticipant = new Map();
if (!state.invites) state.invites = seedInvites();
if (typeof state.fault !== "boolean") state.fault = false;

function assertAvailable(): void {
  if (state.fault) {
    throw new Error("memory store: simulated outage (dev fixture)");
  }
}

export class MemoryStore implements FirstLookStore {
  async lookupInvite(code: string): Promise<InviteLookup> {
    assertAvailable();
    const invite = state.invites.get(code);
    if (!invite) return { status: "not_found" };
    const participant = await this.getParticipant(invite.participantId);
    if (!participant) return { status: "not_found" };
    if (invite.revokedAt) return { status: "revoked", invite, participant };
    if (inviteExpired(invite)) return { status: "expired", invite, participant };
    return { status: "ok", invite, participant };
  }

  async getInviteById(inviteId: string): Promise<Invite | null> {
    assertAvailable();
    for (const invite of state.invites.values()) {
      if (invite.id === inviteId) return invite;
    }
    return null;
  }

  async getParticipant(participantId: string): Promise<Participant | null> {
    assertAvailable();
    const participant = PARTICIPANTS.find((p) => p.id === participantId);
    if (!participant) return null;
    return {
      ...participant,
      previewAgentId:
        state.previewAgentByParticipant.get(participant.id) ?? null,
    };
  }

  async setPreviewAgent(
    participantId: string,
    agentUserId: string,
  ): Promise<void> {
    state.previewAgentByParticipant.set(participantId, agentUserId);
  }

  async createSession(input: {
    participantId: string;
    inviteId: string;
    device: Session["device"];
  }): Promise<Session> {
    assertAvailable();
    const session: Session = {
      id: randomUUID(),
      participantId: input.participantId,
      inviteId: input.inviteId,
      startedAt: new Date().toISOString(),
      device: input.device,
      lastStage: "welcome",
    };
    state.sessions.set(session.id, session);
    return session;
  }

  async getSession(sessionId: string): Promise<Session | null> {
    assertAvailable();
    return state.sessions.get(sessionId) ?? null;
  }

  async advanceStage(sessionId: string, stage: Stage): Promise<void> {
    const session = state.sessions.get(sessionId);
    if (!session) return;
    if (stageIndex(stage) > stageIndex(session.lastStage)) {
      session.lastStage = stage;
    }
  }

  async furthestStage(participantId: string): Promise<Stage> {
    let furthest: Stage = "welcome";
    for (const session of state.sessions.values()) {
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
    for (const session of state.sessions.values()) {
      if (session.participantId === participantId) return true;
    }
    return false;
  }

  async insertEvent(event: EventRecord): Promise<void> {
    state.events.push(event);
    // Dev visibility: the memory store is dev-only, so log the funnel.
    console.log(`[first-look event] ${event.stage}/${event.event}`, event.properties);
  }

  async saveResponse(response: SurveyResponse): Promise<void> {
    state.responses.set(`${response.participantId}:${response.part}`, response);
  }

  async getResponses(participantId: string): Promise<SurveyResponse[]> {
    return [...state.responses.values()]
      .filter((r) => r.participantId === participantId)
      .sort((a, b) => a.part.localeCompare(b.part));
  }
}

/**
 * Dev-only fixture mutators behind src/app/api/e2e-hooks (which is dead code
 * in production builds). They model what happens to real rows out of band:
 * the founder revoking an invite (revoke-invite.mjs), an invite reaching its
 * expiry, a session row that no longer matches its invite, and a database
 * outage. Every mutator returns whether it found something to mutate.
 */
export const devFixtures = {
  reset(): void {
    state.invites = seedInvites();
    state.sessions.clear();
    state.fault = false;
  },
  revokeInvite(code: string): boolean {
    const invite = state.invites.get(code);
    if (!invite) return false;
    invite.revokedAt = new Date().toISOString();
    return true;
  },
  /** Moves the invite's expiry into the past (one minute ago). */
  expireInvite(code: string): boolean {
    const invite = state.invites.get(code);
    if (!invite) return false;
    invite.expiresAt = new Date(Date.now() - 60_000).toISOString();
    return true;
  },
  /** Re-points a session at the OTHER participant: invite/participant mismatch. */
  corruptSession(sessionId: string): boolean {
    const session = state.sessions.get(sessionId);
    if (!session) return false;
    session.participantId =
      session.participantId === angela.id ? noor.id : angela.id;
    return true;
  },
  /** Points a session at an invite id that does not exist: missing invitation. */
  orphanSession(sessionId: string): boolean {
    const session = state.sessions.get(sessionId);
    if (!session) return false;
    session.inviteId = randomUUID();
    return true;
  },
  setFault(on: boolean): void {
    state.fault = on;
  },
};

export const DEV_STAGE_ORDER = STAGES;
