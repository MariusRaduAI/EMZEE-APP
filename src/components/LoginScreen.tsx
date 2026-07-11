"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";

export function LoginScreen() {
  const { signIn, signUp } = useStore();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setInfo(null); setBusy(true);
    const fn = mode === "in" ? signIn : signUp;
    const msg = await fn(email.trim(), pw);
    setBusy(false);
    if (msg) { setErr(msg); return; }
    if (mode === "up") setInfo("Cont creat. Dacă e nevoie, confirmă emailul, apoi autentifică-te.");
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <span className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand to-teal flex items-center justify-center text-white font-black text-lg shadow-glow mb-3">E</span>
          <h1 className="text-2xl font-bold tracking-tight">EMZEE <span className="text-faint font-medium text-sm">OS</span></h1>
          <p className="text-muted text-sm mt-1">Platforma ta de management evenimente</p>
        </div>

        <form onSubmit={submit} className="card p-6 space-y-4">
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="office@wle.ro" />
          </div>
          <div>
            <label className="label">Parolă</label>
            <input className="input" type="password" required minLength={6} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" />
          </div>
          {err && <p className="text-sm text-rose">{err}</p>}
          {info && <p className="text-sm text-green">{info}</p>}
          <button className="btn-brand w-full" disabled={busy}>
            {busy ? "Se procesează…" : mode === "in" ? "Autentificare" : "Creează cont"}
          </button>
          <p className="text-center text-sm text-muted">
            {mode === "in" ? "Prima dată aici? " : "Ai deja cont? "}
            <button type="button" className="text-brand-soft font-medium hover:underline" onClick={() => { setMode(mode === "in" ? "up" : "in"); setErr(null); setInfo(null); }}>
              {mode === "in" ? "Creează cont" : "Autentifică-te"}
            </button>
          </p>
        </form>
        <p className="text-center text-xs text-faint mt-4">Datele tale sunt private, protejate în Supabase.</p>
      </div>
    </div>
  );
}
