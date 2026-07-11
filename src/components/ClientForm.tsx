"use client";

import { useState } from "react";
import { Client, ClientStatus } from "@/lib/types";
import { Toggle } from "./ui";

const emptyClient = (): Client => ({
  id: "", couple: "", family: "", event_date: "", city: "", venue: "", fee: null,
  currency: "RON", status: "lead", svc_mc: true, svc_program: false, svc_games: false,
  svc_flowers: false, svc_kids: false, svc_rentals: false, svc_corporate: false,
  guests: null, notes: "", program_start: "16:00", created_at: "",
});

export function ClientForm({ initial, onSave, onCancel }: { initial?: Client | null; onSave: (c: Client) => void; onCancel: () => void }) {
  const [c, setC] = useState<Client>(initial || emptyClient());
  const set = (patch: Partial<Client>) => setC((p) => ({ ...p, ...patch }));

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
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <div>
            <label className="label">Fee</label>
            <input className="input" type="number" value={c.fee ?? ""} onChange={(e) => set({ fee: e.target.value ? Number(e.target.value) : null })} placeholder="ex. 1500" />
          </div>
          <div>
            <label className="label">Monedă</label>
            <select className="input !w-24" value={c.currency} onChange={(e) => set({ currency: e.target.value })}>
              <option>RON</option><option>EUR</option>
            </select>
          </div>
        </div>
      </div>

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

      <div className="flex justify-end gap-2 pt-1">
        <button className="btn" onClick={onCancel}>Anulează</button>
        <button className="btn-brand" disabled={!c.couple.trim()} onClick={() => onSave(c)}>Salvează</button>
      </div>
    </div>
  );
}
