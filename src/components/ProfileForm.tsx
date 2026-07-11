"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { Icon } from "./ui";
import { cx } from "@/lib/utils";

const DYNAMICS = ["Super traditional", "Traditional", "Echilibrat", "Hype", "Super hype"];
const PRIORITIES = ["Multă emoție", "Multă distracție", "Multă închinare", "Implicarea invitaților", "Experiență echilibrată"];
const GAME_STYLE = ["Jocuri liniștite / statice", "Jocuri dinamice", "Și static și dinamic", "Joc pentru toată lumea", "Joc doar pentru miri", "Quiz personalizat", "Cel puțin un ice-breaker"];

type P = Record<string, any>;

export function ProfileForm({ clientId }: { clientId: string }) {
  const { db, saveProfile } = useStore();
  const [d, setD] = useState<P>(db.profiles[clientId] || defaults());
  const [dirty, setDirty] = useState(false);

  useEffect(() => { setD(db.profiles[clientId] || defaults()); setDirty(false); }, [clientId, db.profiles]);
  const set = (patch: P) => { setD((p) => ({ ...p, ...patch })); setDirty(true); };
  const save = () => { saveProfile(clientId, d); setDirty(false); };

  const ages = d.ages || { copii: 10, tineri: 45, adulti: 30, seniori: 15 };
  const ageTotal = ages.copii + ages.tineri + ages.adulti + ages.seniori;

  return (
    <div>
      <div className="no-print flex items-center justify-end gap-2 mb-4">
        <button className="btn" onClick={() => window.print()}><Icon.print /> PDF</button>
        <button className={cx("btn-brand", !dirty && "opacity-60")} onClick={save}><Icon.check /> {dirty ? "Salvează" : "Salvat"}</button>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Style */}
        <div className="card p-5 space-y-5">
          <h3 className="section-title">Stilul cuplului</h3>
          <div>
            <label className="label">Dinamica dorită a evenimentului</label>
            <div className="flex flex-wrap gap-1.5">
              {DYNAMICS.map((x) => (
                <button key={x} onClick={() => set({ dynamic: x })} className={cx("chip", d.dynamic === x ? "bg-brand/15 border-brand/40 text-brand-soft" : "border-line text-muted hover:text-ink")}>{x}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Priorități</label>
            <div className="flex flex-wrap gap-1.5">
              {PRIORITIES.map((x) => {
                const on = (d.priorities || []).includes(x);
                return <button key={x} onClick={() => set({ priorities: toggle(d.priorities, x) })} className={cx("chip", on ? "bg-teal/15 border-teal/40 text-teal" : "border-line text-muted hover:text-ink")}>{x}</button>;
              })}
            </div>
          </div>
          <div>
            <label className="label">Tipuri de jocuri dorite</label>
            <div className="flex flex-wrap gap-1.5">
              {GAME_STYLE.map((x) => {
                const on = (d.game_styles || []).includes(x);
                return <button key={x} onClick={() => set({ game_styles: toggle(d.game_styles, x) })} className={cx("chip", on ? "bg-green/15 border-green/40 text-green" : "border-line text-muted hover:text-ink")}>{x}</button>;
              })}
            </div>
          </div>
          <div>
            <label className="label">Descriere / note despre stilul lor</label>
            <textarea className="input min-h-[70px] resize-y" value={d.style_notes || ""} onChange={(e) => set({ style_notes: e.target.value })} placeholder="Cum îi vezi ca stil, ce le place, referințe…" />
          </div>
        </div>

        {/* Demographics */}
        <div className="card p-5 space-y-5">
          <h3 className="section-title">Demografia invitaților</h3>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Nr. invitați</label><input className="input" type="number" value={d.guests ?? ""} onChange={(e) => set({ guests: numOrNull(e.target.value) })} /></div>
            <div><label className="label">Nr. copii</label><input className="input" type="number" value={d.children ?? ""} onChange={(e) => set({ children: numOrNull(e.target.value) })} /></div>
          </div>

          <Split label="Structură socială" left="Cupluri" right="Singuri" value={d.couples_pct ?? 60} onChange={(v) => set({ couples_pct: v })} colL="#6d6bff" colR="#33d6c4" />
          <Split label="Religie" left="Creștini" right="Necreștini" value={d.christian_pct ?? 70} onChange={(v) => set({ christian_pct: v })} colL="#37d399" colR="#94a3b8" />

          <div>
            <label className="label">Distribuția pe vârste {ageTotal !== 100 && <span className="text-amber font-normal">· total {ageTotal}%</span>}</label>
            <div className="space-y-2">
              {([["copii", "Copii 0-14"], ["tineri", "Tineri 15-30"], ["adulti", "Adulți 31-50"], ["seniori", "Seniori 50+"]] as const).map(([k, label]) => (
                <div key={k} className="flex items-center gap-3">
                  <span className="w-24 text-xs text-muted shrink-0">{label}</span>
                  <input type="range" min={0} max={100} value={ages[k]} onChange={(e) => set({ ages: { ...ages, [k]: Number(e.target.value) } })} className="flex-1 accent-brand" />
                  <span className="w-9 text-right text-xs font-medium tabular-nums">{ages[k]}%</span>
                </div>
              ))}
            </div>
            <div className="mt-2 h-2.5 rounded-full overflow-hidden flex bg-panel2">
              <span style={{ width: `${ages.copii}%`, background: "#f5b53d" }} />
              <span style={{ width: `${ages.tineri}%`, background: "#6d6bff" }} />
              <span style={{ width: `${ages.adulti}%`, background: "#33d6c4" }} />
              <span style={{ width: `${ages.seniori}%`, background: "#94a3b8" }} />
            </div>
          </div>

          <div><label className="label">De unde sunt invitații?</label><input className="input" value={d.origin || ""} onChange={(e) => set({ origin: e.target.value })} placeholder="ex. 60% locali, 40% din alte orașe" /></div>
        </div>

        {/* Seating + list */}
        <div className="card p-5 space-y-4 lg:col-span-2">
          <h3 className="section-title">Așezare & listă invitați</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Există schiță cu așezarea la mese?</label>
              <div className="flex gap-2">
                {["DA", "NU"].map((o) => <button key={o} onClick={() => set({ has_seating: d.has_seating === o ? "" : o })} className={cx("flex-1 py-2 rounded-lg text-sm font-medium border", d.has_seating === o ? (o === "DA" ? "bg-green/15 border-green/40 text-green" : "bg-rose/15 border-rose/40 text-rose") : "border-line text-muted hover:text-ink")}>{o}</button>)}
              </div>
              <input className="input mt-2" value={d.seating_link || ""} onChange={(e) => set({ seating_link: e.target.value })} placeholder="Link schiță (Drive, foto) sau observații" />
            </div>
            <div>
              <label className="label">Există listă cu numele invitaților?</label>
              <div className="flex gap-2">
                {["DA", "NU"].map((o) => <button key={o} onClick={() => set({ has_list: d.has_list === o ? "" : o })} className={cx("flex-1 py-2 rounded-lg text-sm font-medium border", d.has_list === o ? (o === "DA" ? "bg-green/15 border-green/40 text-green" : "bg-rose/15 border-rose/40 text-rose") : "border-line text-muted hover:text-ink")}>{o}</button>)}
              </div>
            </div>
          </div>
          <div>
            <label className="label">Listă invitați (nume, câte unul pe linie)</label>
            <textarea className="input min-h-[120px] resize-y font-mono text-xs" value={d.guest_list || ""} onChange={(e) => set({ guest_list: e.target.value })} placeholder={"Andrei Popescu\nMaria Ionescu\n…"} />
          </div>
        </div>
      </div>

      <PrintProfile d={d} ages={ages} />
    </div>
  );
}

function Split({ label, left, right, value, onChange, colL, colR }: { label: string; left: string; right: string; value: number; onChange: (v: number) => void; colL: string; colR: string }) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span style={{ color: colL }} className="font-medium">{left} · {value}%</span>
        <span style={{ color: colR }} className="font-medium">{right} · {100 - value}%</span>
      </div>
      <input type="range" min={0} max={100} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-brand" />
      <div className="mt-1.5 h-2.5 rounded-full overflow-hidden flex bg-panel2">
        <span style={{ width: `${value}%`, background: colL }} />
        <span style={{ width: `${100 - value}%`, background: colR }} />
      </div>
    </div>
  );
}

function PrintProfile({ d, ages }: { d: P; ages: any }) {
  const row = (k: string, v: any) => v ? <tr><td style={{ padding: "3px 8px 3px 0", color: "#666", width: "40%" }}>{k}</td><td style={{ padding: "3px 0", fontWeight: 600 }}>{Array.isArray(v) ? v.join(", ") : String(v)}</td></tr> : null;
  return (
    <div className="print-only" style={{ color: "#111" }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, borderBottom: "3px solid #6d6bff", paddingBottom: 10, marginBottom: 16 }}>Profil miri & invitați</h1>
      <table style={{ width: "100%", fontSize: 13 }}><tbody>
        {row("Dinamica dorită", d.dynamic)}
        {row("Priorități", d.priorities)}
        {row("Tipuri jocuri", d.game_styles)}
        {row("Note stil", d.style_notes)}
        {row("Nr. invitați", d.guests)}
        {row("Nr. copii", d.children)}
        {row("Cupluri / Singuri", `${d.couples_pct ?? 60}% / ${100 - (d.couples_pct ?? 60)}%`)}
        {row("Creștini / Necreștini", `${d.christian_pct ?? 70}% / ${100 - (d.christian_pct ?? 70)}%`)}
        {row("Vârste", `Copii ${ages.copii}%, Tineri ${ages.tineri}%, Adulți ${ages.adulti}%, Seniori ${ages.seniori}%`)}
        {row("Origine invitați", d.origin)}
        {row("Schiță așezare", d.has_seating)}
        {row("Listă invitați", d.has_list)}
      </tbody></table>
    </div>
  );
}

function defaults(): P { return { dynamic: "", priorities: [], game_styles: [], ages: { copii: 10, tineri: 45, adulti: 30, seniori: 15 }, couples_pct: 60, christian_pct: 70 }; }
function toggle(arr: string[] | undefined, x: string): string[] { const a = arr || []; return a.includes(x) ? a.filter((y) => y !== x) : [...a, x]; }
function numOrNull(v: string): number | null { return v ? Number(v) : null; }
