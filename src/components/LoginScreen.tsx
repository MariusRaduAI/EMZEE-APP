"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Logo } from "./Logo";

export function LoginScreen() {
  const { signIn } = useStore();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setBusy(true);
    const msg = await signIn(email.trim(), pw);
    setBusy(false);
    if (msg) setErr(translate(msg));
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <Logo className="h-14 w-auto text-ink mb-4 logo-in" />
          <p className="text-muted text-sm">Platforma ta de management evenimente</p>
        </div>

        <form onSubmit={submit} className="card p-6 space-y-4">
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="office@wle.ro" autoFocus />
          </div>
          <div>
            <label className="label">Parolă</label>
            <input className="input" type="password" required value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" />
          </div>
          {err && <p className="text-sm text-rose">{err}</p>}
          <button className="btn-brand w-full" disabled={busy}>
            {busy ? "Se procesează…" : "Autentificare"}
          </button>
        </form>
        <p className="text-center text-xs text-faint mt-4">Aplicație privată · datele tale protejate în Supabase.</p>
      </div>
    </div>
  );
}

function translate(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("invalid login")) return "Email sau parolă greșite.";
  if (m.includes("email not confirmed")) return "Emailul nu e confirmat. Dezactivează confirmarea emailului în Supabase, apoi încearcă din nou.";
  return msg;
}
