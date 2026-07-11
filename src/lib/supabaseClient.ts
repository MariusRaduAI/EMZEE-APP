import { createClient, SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const SUPABASE_ENABLED = Boolean(url && key);

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!SUPABASE_ENABLED) return null;
  if (!_client) {
    _client = createClient(url as string, key as string, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
  }
  return _client;
}
