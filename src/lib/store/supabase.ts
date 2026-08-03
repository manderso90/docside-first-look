import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { stageIndex, type Stage } from "@/lib/stages";
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
 * Production store: the `first_look` schema in the main docside Supabase
 * project (BRIEF §9, AD-4). All access is service-role from the server —
 * clients never talk to the database directly; `events` is insert-only.
 *
 * The schema lands with the Phase 4/5 migrations in the docside repo.
 */

// Untyped rows until the first_look schema lands (Phase 5 generates types
// the way docside does with `supabase gen types`).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function client(): SupabaseClient<any, "first_look", any> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for the supabase store",
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false },
    db: { schema: "first_look" },
  });
}

type InviteRow = {
  id: string;
  code: string;
  participant_id: string;
  personal_note: string;
  revoked_at: string | null;
  expires_at: string | null;
};

type ParticipantRow = {
  id: string;
  first_name: string;
  email: string;
  participant_number: number;
  participant_ref: string;
  cohort: number;
};

type SessionRow = {
  id: string;
  participant_id: string;
  invite_id: string;
  started_at: string;
  device: Session["device"];
  last_stage: Stage;
};

function toInvite(row: InviteRow): Invite {
  return {
    id: row.id,
    code: row.code,
    participantId: row.participant_id,
    personalNote: row.personal_note,
    revokedAt: row.revoked_at,
    expiresAt: row.expires_at,
  };
}

function toParticipant(row: ParticipantRow): Participant {
  return {
    id: row.id,
    firstName: row.first_name,
    email: row.email,
    participantNumber: row.participant_number,
    participantRef: row.participant_ref,
    cohort: row.cohort,
  };
}

function toSession(row: SessionRow): Session {
  return {
    id: row.id,
    participantId: row.participant_id,
    inviteId: row.invite_id,
    startedAt: row.started_at,
    device: row.device,
    lastStage: row.last_stage,
  };
}

export class SupabaseStore implements FirstLookStore {
  async lookupInvite(code: string): Promise<InviteLookup> {
    const supabase = client();
    const { data: inviteRow, error } = await supabase
      .from("invites")
      .select("*")
      .eq("code", code)
      .maybeSingle<InviteRow>();
    if (error) throw error;
    if (!inviteRow) return { status: "not_found" };

    const { data: participantRow, error: pErr } = await supabase
      .from("participants")
      .select("*")
      .eq("id", inviteRow.participant_id)
      .single<ParticipantRow>();
    if (pErr) throw pErr;

    const invite = toInvite(inviteRow);
    const participant = toParticipant(participantRow);
    if (invite.revokedAt) return { status: "revoked", invite, participant };
    if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
      return { status: "expired", invite, participant };
    }
    return { status: "ok", invite, participant };
  }

  async getInviteById(inviteId: string): Promise<Invite | null> {
    const { data, error } = await client()
      .from("invites")
      .select("*")
      .eq("id", inviteId)
      .maybeSingle<InviteRow>();
    if (error) throw error;
    return data ? toInvite(data) : null;
  }

  async getParticipant(participantId: string): Promise<Participant | null> {
    const { data, error } = await client()
      .from("participants")
      .select("*")
      .eq("id", participantId)
      .maybeSingle<ParticipantRow>();
    if (error) throw error;
    return data ? toParticipant(data) : null;
  }

  async createSession(input: {
    participantId: string;
    inviteId: string;
    device: Session["device"];
  }): Promise<Session> {
    const { data, error } = await client()
      .from("sessions")
      .insert({
        participant_id: input.participantId,
        invite_id: input.inviteId,
        device: input.device,
        last_stage: "welcome",
      })
      .select("*")
      .single<SessionRow>();
    if (error) throw error;
    return toSession(data);
  }

  async getSession(sessionId: string): Promise<Session | null> {
    const { data, error } = await client()
      .from("sessions")
      .select("*")
      .eq("id", sessionId)
      .maybeSingle<SessionRow>();
    if (error) throw error;
    return data ? toSession(data) : null;
  }

  async advanceStage(sessionId: string, stage: Stage): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) return;
    if (stageIndex(stage) <= stageIndex(session.lastStage)) return;
    const { error } = await client()
      .from("sessions")
      .update({ last_stage: stage })
      .eq("id", sessionId);
    if (error) throw error;
  }

  async furthestStage(participantId: string): Promise<Stage> {
    const { data, error } = await client()
      .from("sessions")
      .select("last_stage")
      .eq("participant_id", participantId);
    if (error) throw error;
    let furthest: Stage = "welcome";
    for (const row of data ?? []) {
      const stage = row.last_stage as Stage;
      if (stageIndex(stage) > stageIndex(furthest)) furthest = stage;
    }
    return furthest;
  }

  async hasPriorSession(participantId: string): Promise<boolean> {
    const { count, error } = await client()
      .from("sessions")
      .select("id", { count: "exact", head: true })
      .eq("participant_id", participantId);
    if (error) throw error;
    return (count ?? 0) > 0;
  }

  async insertEvent(event: EventRecord): Promise<void> {
    const { error } = await client().from("events").insert({
      event_id: event.eventId,
      participant_id: event.participantId,
      session_id: event.sessionId,
      stage: event.stage,
      event: event.event,
      properties: event.properties,
      ts_client: event.tsClient,
      ts_server: event.tsServer,
      device: event.device,
    });
    if (error) throw error;
  }

  async saveResponse(response: SurveyResponse): Promise<void> {
    const { error } = await client()
      .from("survey_responses")
      .upsert(
        {
          participant_id: response.participantId,
          part: response.part,
          answer: response.answer,
          updated_at: response.updatedAt,
        },
        { onConflict: "participant_id,part" },
      );
    if (error) throw error;
  }

  async getResponses(participantId: string): Promise<SurveyResponse[]> {
    const { data, error } = await client()
      .from("survey_responses")
      .select("*")
      .eq("participant_id", participantId);
    if (error) throw error;
    return (data ?? []).map((row) => ({
      participantId: row.participant_id,
      part: row.part,
      answer: row.answer,
      updatedAt: row.updated_at,
    }));
  }
}
