import "server-only";
import { MemoryStore } from "./memory";
import { SupabaseStore } from "./supabase";
import type { FirstLookStore } from "./types";

/**
 * Store selection: `supabase` whenever the service-role env is present,
 * `memory` otherwise (local dev before the first_look schema exists).
 * Fail closed in production: never silently run prod on the memory store.
 */
let store: FirstLookStore | null = null;

export function getStore(): FirstLookStore {
  if (store) return store;
  const hasSupabase =
    !!process.env.SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (hasSupabase) {
    store = new SupabaseStore();
  } else {
    if (process.env.NODE_ENV === "production" && process.env.VERCEL) {
      throw new Error(
        "first-look: refusing to run the in-memory store in production — set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY",
      );
    }
    store = new MemoryStore();
  }
  return store;
}

export type { FirstLookStore } from "./types";
