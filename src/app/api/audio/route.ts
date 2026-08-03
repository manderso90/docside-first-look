import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSessionContext } from "@/lib/session";
import { getStore } from "@/lib/store";
import { recordEvent } from "@/lib/record-event";
import { AUDIO_MAX_SECONDS } from "@/lib/debrief";

/** ≤3 min of webm/opus stays well under this; hard cap the body. */
const MAX_BYTES = 15 * 1024 * 1024;

/**
 * Debrief Part 8 audio upload (BRIEF §7, AD-5): browser MediaRecorder blob →
 * this route → private `first-look-audio` bucket (or a local dev directory
 * when Supabase isn't configured). Links via survey_responses.audio_path.
 */
export async function POST(request: NextRequest) {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: "no session" }, { status: 401 });

  const body = Buffer.from(await request.arrayBuffer());
  if (body.length === 0 || body.length > MAX_BYTES) {
    return NextResponse.json({ error: "bad size" }, { status: 400 });
  }
  const contentType = request.headers.get("content-type") ?? "audio/webm";
  if (!contentType.startsWith("audio/")) {
    return NextResponse.json({ error: "bad type" }, { status: 400 });
  }

  const ext = contentType.includes("mp4") ? "m4a" : "webm";
  const objectPath = `${ctx.participant.id}/${randomUUID()}.${ext}`;

  try {
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        { auth: { persistSession: false } },
      );
      const { error } = await supabase.storage
        .from("first-look-audio")
        .upload(objectPath, body, { contentType, upsert: false });
      if (error) throw error;
    } else if (process.env.NODE_ENV !== "production") {
      // Dev-only fallback: gitignored local directory. Production always
      // has Supabase configured (the store fails closed without it).
      const dir = join(process.cwd(), "var", "dev-audio", ctx.participant.id);
      await mkdir(dir, { recursive: true });
      await writeFile(join(dir, objectPath.split("/")[1]), body);
    } else {
      return NextResponse.json({ error: "storage unavailable" }, { status: 503 });
    }
  } catch (error) {
    console.error("[first-look] audio upload failed", error);
    return NextResponse.json({ error: "upload failed" }, { status: 500 });
  }

  // The recording is itself a Part 8 answer-in-progress: store the path now
  // so a drop-off after recording still leaves Morris the audio.
  await getStore().saveResponse({
    participantId: ctx.participant.id,
    part: "part_8",
    answer: { channel: "audio", audio_path: objectPath, text: "" },
    updatedAt: new Date().toISOString(),
  });
  const claimedMs = Number(request.headers.get("x-audio-duration-ms") ?? 0);
  await recordEvent(ctx.session, "debrief", "audio_recorded", {
    duration_ms: Number.isFinite(claimedMs)
      ? Math.max(0, Math.min(Math.round(claimedMs), AUDIO_MAX_SECONDS * 1000))
      : 0,
  });

  return NextResponse.json({ ok: true });
}
