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

// Lock corect pentru auth: serializează operațiile (evită curse la refresh token),
// dar cu timeout — dacă nu poate obține lock-ul repede, rulează oricum (nu se blochează).
async function safeLock<R>(name: string, acquireTimeout: number, fn: () => Promise<R>): Promise<R> {
  const nav = typeof navigator !== "undefined" ? (navigator as any) : undefined;
  if (nav?.locks?.request) {
    const ctrl = new AbortController();
    const ms = acquireTimeout && acquireTimeout > 0 ? acquireTimeout : 4000;
    const timer = setTimeout(() => ctrl.abort(), ms);
    try {
      return await nav.locks.request(name, { mode: "exclusive", signal: ctrl.signal }, async () => await fn());
    } catch {
      return await fn(); // lock indisponibil la timp — continuăm oricum
    } finally {
      clearTimeout(timer);
    }
  }
  return await fn();
}

export function getSupabase(): SupabaseClient | null {
  if (!SUPABASE_ENABLED || !url || !key) return null;
  if (!_client) {
    try {
      _client = createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
          lock: safeLock,
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
