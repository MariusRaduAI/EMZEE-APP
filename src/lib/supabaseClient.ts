import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Normalizează URL-ul: curăță spații/ghilimele și adaugă https:// dacă lipsește.
// Astfel o valoare ca "xxx.supabase.co" (fără protocol) tot funcționează.
function normalizeUrl(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  let u = raw.trim().replace(/^["']|["']$/g, "").replace(/\/+$/, "");
  if (!u) return undefined;
  if (!/^https?:\/\//i.test(u)) u = "https://" + u;
  try { new URL(u); return u; } catch { return undefined; }
}

const url = normalizeUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

export const SUPABASE_ENABLED = Boolean(url && key);

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!SUPABASE_ENABLED || !url || !key) return null;
  if (!_client) {
    try {
      _client = createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
          // App single-user, single-tab: dezactivăm navigator lock-ul care poate
          // provoca blocaje (getSession hang). Pass-through fără lock real.
          lock: <R>(_name: string, _acquireTimeout: number, fn: () => Promise<R>): Promise<R> => fn(),
        },
      });
    } catch (e) {
      // URL/cheie invalidă — nu dărâmăm aplicația, doar semnalăm.
      console.error("Supabase init failed (verifică NEXT_PUBLIC_SUPABASE_URL / ANON_KEY):", e);
      return null;
    }
  }
  return _client;
}
