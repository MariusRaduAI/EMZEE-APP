"use client";

import { useState } from "react";
import { Client, ClientStatus } from "@/lib/types";
import { Toggle } from "./ui";
import { cx } from "@/lib/utils";

const emptyClient = (): Client => ({
  id: "", couple: "", family: "", event_date: "", city: "", venue: "", fee: null,
  currency: "RON", status: "lead", svc_mc: true, svc_program: false, svc_games: false,
  svc_flowers: false, svc_kids: false, svc_rentals: false, svc_corporate: false,
  guests: null, deposit: null, paid: null, notes: "", program_start: "16:00", created_at: "",
});

function MoneyField({ label, value, onChange, placeholder }: { label: string; value: number | null; onChange: (v: number | null) => void; placeholder?: string }) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="relative">
        <input className="input pr-12" type="number" value={value ?? ""} onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)} placeholder={placeholder} />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-faint">RON</span>
      </div>
    </div>
  );
}

export function ClientForm({ initial, onSave, onCancel }: { initial?: Client | null; onSave: (c: Client) => void | Promise<void>; onCancel: () => void }) {
  const [c, setC] = useState<Client>(initial || emptyClient());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const set = (patch: Partial<Client>) => setC((p) => ({ ...p, ...patch }));

  async function handleSave() {
    setErr(null); setBusy(true);
    try {
      await onSave({ ...c, currency: "RON" });
    } catch (e: unknown) {
      setErr("Nu s-a putut salva: " + (e instanceof Error ? e.message : String(e)));
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Nume miri *</label>
          <input className="input" value={c.couple} onChange={(e) => set({ couple: e.target.value })} placeholder="ex. Alex & Geo" autoFocus />
        </div>
        <div>
          <label className="label">Nume familie</label>
          <input className="input" value={c.family} onChange={(e) => set({ family: e.target.value })} placeholder="ex. Herghelegiu" />
        </div>
        <div>
          <label className="label">Data evenimentului</label>
          <input className="input" type="date" value={c.event_date} onChange={(e) => set({ event_date: e.target.value })} />
        </div>
        <div>
          <label className="label">Status</label>
          <select className="input" value={c.status} onChange={(e) => set({ status: e.target.value as ClientStatus })}>
            <option value="lead">Lead</option>
            <option value="confirmat">Confirmat</option>
            <option value="finalizat">Finalizat</option>
          </select>
        </div>
        <div>
          <label className="label">Oraș</label>
          <input className="input" value={c.city} onChange={(e) => set({ city: e.target.value })} placeholder="ex. București" />
        </div>
        <div>
          <label className="label">Locație / salon</label>
          <input className="input" value={c.venue} onChange={(e) => set({ venue: e.target.value })} placeholder="ex. Lagoo Snagov" />
        </div>
        <div>
          <label className="label">Nr. invitați (estimativ)</label>
          <input className="input" type="number" value={c.guests ?? ""} onChange={(e) => set({ guests: e.target.value ? Number(e.target.value) : null })} placeholder="ex. 150" />
        </div>
        <MoneyField label="Fee total (lei)" value={c.fee} onChange={(v) => set({ fee: v })} placeholder="ex. 1500" />
        <MoneyField label="Avans convenit" value={c.deposit} onChange={(v) => set({ deposit: v })} placeholder="ex. 500" />
        <MoneyField label="Încasat până acum" value={c.paid} onChange={(v) => set({ paid: v })} placeholder="ex. 500" />
      </div>

      {(c.fee || c.paid || c.deposit) && (
        <div className="card-2 p-3 flex items-center justify-between text-sm">
          <span className="text-muted">Rest de încasat</span>
          <span className={cx("font-bold text-base", (c.fee || 0) - (c.paid || 0) <= 0 ? "text-green" : "text-amber")}>
            {((c.fee || 0) - (c.paid || 0)).toLocaleString("ro-RO")} RON
          </span>
        </div>
      )}

      <div>
        <label className="label">Servicii incluse</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 card-2 p-3">
          <Toggle checked={c.svc_mc} onChange={(v) => set({ svc_mc: v })} label="MC" />
          <Toggle checked={c.svc_program} onChange={(v) => set({ svc_program: v })} label="Program" />
          <Toggle checked={c.svc_games} onChange={(v) => set({ svc_games: v })} label="Jocuri" />
          <Toggle checked={c.svc_flowers} onChange={(v) => set({ svc_flowers: v })} label="Flori" />
          <Toggle checked={c.svc_kids} onChange={(v) => set({ svc_kids: v })} label="Kids" />
          <Toggle checked={c.svc_rentals} onChange={(v) => set({ svc_rentals: v })} label="Rentals" />
        </div>
      </div>

      <div>
        <label className="label">Note</label>
        <textarea className="input min-h-[80px] resize-y" value={c.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="Detalii, cerințe speciale, observații…" />
      </div>

      {err && <p className="text-[15px] text-rose font-semibold">{err}</p>}

      <div className="flex justify-end gap-2 pt-1">
        <button className="btn" onClick={onCancel} disabled={busy}>Anulează</button>
        <button className="btn-brand" disabled={!c.couple.trim() || busy} onClick={handleSave}>{busy ? "Se salvează…" : "Salvează"}</button>
      </div>
    </div>
  );
}
