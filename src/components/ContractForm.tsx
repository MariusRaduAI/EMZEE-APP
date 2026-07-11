"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { Icon } from "./ui";
import { PROVIDER_DEFAULTS, CONTRACT_SERVICES } from "@/lib/types";
import { exportContractPDF } from "@/lib/pdf";
import { cx, nowISO } from "@/lib/utils";

const ANNEX_OPTIONS = ["Program eveniment", "Brief floral", "Listă rentals & echipamente", "Ofertă detaliată"];

const DEFAULT_CANCELLATION =
  "În cazul anulării evenimentului de către Beneficiar, avansul achitat nu se restituie, acesta acoperind rezervarea datei și pregătirile efectuate. Reprogramarea este posibilă, în funcție de disponibilitatea Prestatorului.";

function seed(clientId: string, client: any, existing: any) {
  const svc = client
    ? [
        client.svc_mc && CONTRACT_SERVICES[0],
        client.svc_program && CONTRACT_SERVICES[1],
        client.svc_games && CONTRACT_SERVICES[2],
        client.svc_flowers && CONTRACT_SERVICES[3],
        client.svc_kids && CONTRACT_SERVICES[4],
        client.svc_rentals && CONTRACT_SERVICES[5],
      ].filter(Boolean)
    : [];
  return {
    no: existing?.no || "",
    date: existing?.date || nowISO().slice(0, 10),
    provider: { ...PROVIDER_DEFAULTS, ...(existing?.provider || {}) },
    benef_name: existing?.benef_name ?? (client?.couple || ""),
    benef_id: existing?.benef_id || "",
    benef_address: existing?.benef_address ?? (client?.city || ""),
    benef_email: existing?.benef_email || "",
    benef_phone: existing?.benef_phone || "",
    event_type: existing?.event_type || "Nuntă",
    event_date: existing?.event_date ?? (client?.event_date || ""),
    event_location: existing?.event_location ?? ([client?.venue, client?.city].filter(Boolean).join(", ") || ""),
    services: (existing?.services as string[]) || svc,
    total: existing?.total ?? (client?.fee ?? null),
    deposit: existing?.deposit ?? (client?.deposit ?? null),
    currency: existing?.currency || client?.currency || "RON",
    deposit_due: existing?.deposit_due || "",
    balance_due: existing?.balance_due || "cu cel puțin 7 zile înainte de eveniment",
    pay_method: existing?.pay_method || "transfer bancar sau numerar",
    cancellation: existing?.cancellation || DEFAULT_CANCELLATION,
    extra: existing?.extra || "",
    annexes: (existing?.annexes as string[]) || [],
  };
}

export function ContractForm({ clientId }: { clientId: string }) {
  const { db, saveContract } = useStore();
  const client = db.clients.find((c) => c.id === clientId);
  const existing = db.contracts[clientId];
  const [f, setF] = useState(() => seed(clientId, client, existing));
  const [saved, setSaved] = useState(false);
  const [customSvc, setCustomSvc] = useState("");

  const set = (p: Partial<typeof f>) => { setF((x) => ({ ...x, ...p })); setSaved(false); };
  const setProv = (p: Partial<typeof f.provider>) => set({ provider: { ...f.provider, ...p } });

  const rest = useMemo(() => (f.total || 0) - (f.deposit || 0), [f.total, f.deposit]);

  const toggleSvc = (s: string) => set({ services: f.services.includes(s) ? f.services.filter((x) => x !== s) : [...f.services, s] });
  const toggleAnnex = (s: string) => set({ annexes: f.annexes.includes(s) ? f.annexes.filter((x) => x !== s) : [...f.annexes, s] });
  const addCustomSvc = () => { const v = customSvc.trim(); if (v && !f.services.includes(v)) { set({ services: [...f.services, v] }); setCustomSvc(""); } };

  const save = async () => { await saveContract(clientId, f as any); setSaved(true); };
  const generate = async () => { await saveContract(clientId, f as any); setSaved(true); exportContractPDF(f as any); };

  return (
    <div className="space-y-5">
      {/* Antet contract */}
      <div className="card p-5">
        <h3 className="section-title mb-4">Antet contract</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="Număr contract"><input className="input" value={f.no} onChange={(e) => set({ no: e.target.value })} placeholder="ex. 042" /></Field>
          <Field label="Data contractului"><input className="input" type="date" value={f.date} onChange={(e) => set({ date: e.target.value })} /></Field>
          <Field label="Tip eveniment"><input className="input" value={f.event_type} onChange={(e) => set({ event_type: e.target.value })} /></Field>
          <Field label="Data eveniment"><input className="input" type="date" value={f.event_date} onChange={(e) => set({ event_date: e.target.value })} /></Field>
          <Field label="Locație eveniment" wide><input className="input" value={f.event_location} onChange={(e) => set({ event_location: e.target.value })} /></Field>
        </div>
      </div>

      {/* Prestator */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="section-title">Prestator (EMZEE)</h3>
          <span className="text-xs text-faint">se memorează pentru orice contract</span>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Denumire"><input className="input" value={f.provider.legal} onChange={(e) => setProv({ legal: e.target.value })} /></Field>
          <Field label="Reprezentant"><input className="input" value={f.provider.repr} onChange={(e) => setProv({ repr: e.target.value })} /></Field>
          <Field label="CUI / CIF"><input className="input" value={f.provider.cui} onChange={(e) => setProv({ cui: e.target.value })} placeholder="opțional" /></Field>
          <Field label="Reg. comerțului"><input className="input" value={f.provider.reg} onChange={(e) => setProv({ reg: e.target.value })} placeholder="opțional" /></Field>
          <Field label="Adresă" wide><input className="input" value={f.provider.address} onChange={(e) => setProv({ address: e.target.value })} /></Field>
          <Field label="Email"><input className="input" value={f.provider.email} onChange={(e) => setProv({ email: e.target.value })} /></Field>
          <Field label="Telefon"><input className="input" value={f.provider.phone} onChange={(e) => setProv({ phone: e.target.value })} /></Field>
          <Field label="IBAN"><input className="input" value={f.provider.iban} onChange={(e) => setProv({ iban: e.target.value })} placeholder="opțional" /></Field>
          <Field label="Bancă"><input className="input" value={f.provider.bank} onChange={(e) => setProv({ bank: e.target.value })} placeholder="opțional" /></Field>
        </div>
      </div>

      {/* Beneficiar */}
      <div className="card p-5">
        <h3 className="section-title mb-4">Beneficiar</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Nume complet"><input className="input" value={f.benef_name} onChange={(e) => set({ benef_name: e.target.value })} /></Field>
          <Field label="CI / CNP"><input className="input" value={f.benef_id} onChange={(e) => set({ benef_id: e.target.value })} placeholder="opțional" /></Field>
          <Field label="Adresă" wide><input className="input" value={f.benef_address} onChange={(e) => set({ benef_address: e.target.value })} /></Field>
          <Field label="Email"><input className="input" value={f.benef_email} onChange={(e) => set({ benef_email: e.target.value })} /></Field>
          <Field label="Telefon"><input className="input" value={f.benef_phone} onChange={(e) => set({ benef_phone: e.target.value })} /></Field>
        </div>
      </div>

      {/* Servicii */}
      <div className="card p-5">
        <h3 className="section-title mb-3">Servicii contractate</h3>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {Array.from(new Set([...CONTRACT_SERVICES, ...f.services])).map((s) => (
            <button key={s} onClick={() => toggleSvc(s)} className={cx("chip", f.services.includes(s) ? "bg-brand/15 border-brand/40 text-brand-soft" : "border-line text-muted hover:text-ink")}>{s}</button>
          ))}
        </div>
        <div className="flex gap-2">
          <input className="input" value={customSvc} onChange={(e) => setCustomSvc(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomSvc())} placeholder="Adaugă un serviciu personalizat…" />
          <button className="btn shrink-0" onClick={addCustomSvc}><Icon.plus /> Adaugă</button>
        </div>
      </div>

      {/* Preț & plată */}
      <div className="card p-5">
        <h3 className="section-title mb-4">Valoare & plată</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="Valoare totală (RON)"><input className="input" type="number" value={f.total ?? ""} onChange={(e) => set({ total: e.target.value ? Number(e.target.value) : null })} /></Field>
          <Field label="Avans (RON)"><input className="input" type="number" value={f.deposit ?? ""} onChange={(e) => set({ deposit: e.target.value ? Number(e.target.value) : null })} /></Field>
          <Field label="Rest de plată">
            <div className="input flex items-center bg-panel2 tabular-nums font-semibold">{rest.toLocaleString("ro-RO")} RON</div>
          </Field>
          <Field label="Termen plată avans"><input className="input" value={f.deposit_due} onChange={(e) => set({ deposit_due: e.target.value })} placeholder="la semnare / dată" /></Field>
          <Field label="Termen plată rest" wide><input className="input" value={f.balance_due} onChange={(e) => set({ balance_due: e.target.value })} /></Field>
          <Field label="Modalitate de plată" wide><input className="input" value={f.pay_method} onChange={(e) => set({ pay_method: e.target.value })} /></Field>
        </div>
      </div>

      {/* Clauze */}
      <div className="card p-5">
        <h3 className="section-title mb-4">Clauze & anexe</h3>
        <Field label="Politica de anulare">
          <textarea className="input min-h-[80px] resize-y" value={f.cancellation} onChange={(e) => set({ cancellation: e.target.value })} />
        </Field>
        <div className="mt-4">
          <Field label="Clauze suplimentare (opțional)">
            <textarea className="input min-h-[70px] resize-y" value={f.extra} onChange={(e) => set({ extra: e.target.value })} placeholder="Orice altă înțelegere specifică între Părți…" />
          </Field>
        </div>
        <div className="mt-4">
          <label className="label">Anexe</label>
          <div className="flex flex-wrap gap-1.5">
            {ANNEX_OPTIONS.map((a) => (
              <button key={a} onClick={() => toggleAnnex(a)} className={cx("chip", f.annexes.includes(a) ? "bg-teal/15 border-teal/40 text-teal" : "border-line text-muted hover:text-ink")}>{a}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Acțiuni */}
      <div className="flex flex-wrap items-center justify-end gap-2 sticky bottom-0 py-3 bg-app/80 backdrop-blur -mx-1 px-1">
        {saved && <span className="text-sm text-green mr-auto flex items-center gap-1.5"><Icon.check className="w-4 h-4" /> Salvat</span>}
        <button className="btn" onClick={save}>Salvează</button>
        <button className="btn-brand" onClick={generate}><Icon.download /> Generează contract PDF</button>
      </div>
    </div>
  );
}

function Field({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={cx(wide && "sm:col-span-2")}>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}
