"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/common";
import { Icon, Modal, useConfirm } from "@/components/ui";
import { CorporateLead, CORP_FORMATS, CORP_OBJECTIVES, CORP_ACTIVITIES } from "@/lib/types";
import { exportCorporatePDF } from "@/lib/pdf";
import { fmtDateShort, money, cx } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = { lead: "Lead", oferta: "Ofertă trimisă", confirmat: "Confirmat", finalizat: "Finalizat" };
const STATUS_CLS: Record<string, string> = { lead: "bg-amber/15 text-amber", oferta: "bg-brand/15 text-brand-soft", confirmat: "bg-green/15 text-green", finalizat: "bg-teal/15 text-teal" };

export default function CorporatePage() {
  const { db, saveCorporate, deleteCorporate } = useStore();
  const { confirm, node } = useConfirm();
  const [editing, setEditing] = useState<CorporateLead | null>(null);

  const leads = [...db.corporate].sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));

  return (
    <div className="fade-in">
      {node}
      <PageHeader title="Corporate" subtitle="Configurează nevoile fiecărui client corporate și livrează oferta." icon={<Icon.building />}>
        <button className="btn-brand" onClick={() => setEditing(newLead())}><Icon.plus /> Lead corporate</button>
      </PageHeader>

      {leads.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-teal/12 border border-teal/25 flex items-center justify-center text-teal mx-auto mb-3"><Icon.building /></div>
          <p className="font-semibold text-ink">Niciun lead corporate încă</p>
          <p className="text-[15px] text-muted mt-1 mb-4">Adaugă un client corporate și configurează-i nevoile ca să poți trimite oferta.</p>
          <button className="btn-brand mx-auto" onClick={() => setEditing(newLead())}><Icon.plus /> Lead corporate</button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {leads.map((l) => (
            <div key={l.id} className="card p-5">
              <div className="flex items-start justify-between mb-2">
                <span className={cx("badge", STATUS_CLS[l.status] || "bg-panel2 text-muted")}>{STATUS_LABEL[l.status] || l.status}</span>
                <div className="flex gap-1">
                  <button className="btn-ghost !p-1.5" title="PDF brief" onClick={() => exportCorporatePDF(l)}><Icon.download /></button>
                  <button className="btn-ghost !p-1.5" onClick={() => setEditing(l)}><Icon.edit /></button>
                  <button className="btn-ghost !p-1.5 hover:!text-rose" onClick={async () => { if (await confirm(`Ștergi lead-ul „${l.company}”?`)) deleteCorporate(l.id); }}><Icon.trash /></button>
                </div>
              </div>
              <p className="font-bold text-ink text-lg">{l.company || "Companie"}</p>
              <p className="text-sm text-muted">{l.contact}{l.participants ? ` · ${l.participants} pers.` : ""}</p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {l.format.slice(0, 2).map((f) => <span key={f} className="badge bg-panel2 border border-line text-muted">{f}</span>)}
                {l.format.length > 2 && <span className="badge bg-panel2 border border-line text-faint">+{l.format.length - 2}</span>}
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-line/60 text-sm">
                <span className="text-muted">{l.date ? fmtDateShort(l.date) : "fără dată"}</span>
                <span className="font-semibold text-ink">{l.budget != null ? money(l.budget, "RON") : "—"}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Referință metodologie/pachete */}
      <div className="card p-5">
        <h3 className="section-title mb-3">Metodologia EMZEE (referință)</h3>
        <p className="text-[15px] text-ink mb-4">HR vrea engagement, managerii vor coeziune, directorii vor să arate că le pasă de oameni. <b className="text-teal">EMZEE este soluția.</b> Un apel → propunere în 48h → livrăm tot → raport post-eveniment.</p>
        <div className="grid sm:grid-cols-3 gap-3">
          {[["La birou", "799 €", "2-3 ore · 2 activități · MC inclus"], ["Team-building 1 zi", "1.599 €", "3 activități · scavenger hunt · raport"], ["Program 3 zile", "8.000–10.000 €", "diagnostic · KPI · MC + facilitare"]].map(([n, p, d]) => (
            <div key={n} className="card-2 p-4">
              <p className="font-bold text-ink">{n}</p>
              <p className="text-xl font-black text-teal my-1">{p}</p>
              <p className="text-sm text-muted">{d}</p>
            </div>
          ))}
        </div>
      </div>

      {editing && <CorpEditor key={editing.id || "new"} lead={editing} onClose={() => setEditing(null)} onSave={(l) => { saveCorporate(l); setEditing(null); }} />}
    </div>
  );
}

function newLead(): CorporateLead {
  return { id: "", company: "", contact: "", email: "", phone: "", date: "", status: "lead", participants: null, format: [], objectives: [], activities: [], location: "", catering: "", budget: null, deadline: "", notes: "", created_at: "" };
}

function CorpEditor({ lead, onClose, onSave }: { lead: CorporateLead; onClose: () => void; onSave: (l: CorporateLead) => void }) {
  const [l, setL] = useState<CorporateLead>(lead);
  const set = (p: Partial<CorporateLead>) => setL((x) => ({ ...x, ...p }));
  const toggle = (key: "format" | "objectives" | "activities", v: string) => { const a = l[key]; set({ [key]: a.includes(v) ? a.filter((y) => y !== v) : [...a, v] } as any); };
  const Chip = ({ k, v, color }: { k: "format" | "objectives" | "activities"; v: string; color: string }) => (
    <button onClick={() => toggle(k, v)} className={cx("chip", l[k].includes(v) ? colorCls(color) : "border-line text-muted hover:text-ink")}>{v}</button>
  );
  return (
    <Modal open onClose={onClose} title={l.id ? "Editează lead corporate" : "Lead corporate nou"} wide>
      <div className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className="label">Companie *</label><input className="input" value={l.company} onChange={(e) => set({ company: e.target.value })} autoFocus /></div>
          <div><label className="label">Status</label><select className="input" value={l.status} onChange={(e) => set({ status: e.target.value })}><option value="lead">Lead</option><option value="oferta">Ofertă trimisă</option><option value="confirmat">Confirmat</option><option value="finalizat">Finalizat</option></select></div>
          <div><label className="label">Persoană contact</label><input className="input" value={l.contact} onChange={(e) => set({ contact: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="label">Email</label><input className="input" value={l.email} onChange={(e) => set({ email: e.target.value })} /></div>
            <div><label className="label">Telefon</label><input className="input" value={l.phone} onChange={(e) => set({ phone: e.target.value })} /></div>
          </div>
          <div><label className="label">Nr. participanți</label><input className="input" type="number" value={l.participants ?? ""} onChange={(e) => set({ participants: e.target.value ? Number(e.target.value) : null })} /></div>
          <div><label className="label">Data / perioada</label><input className="input" type="date" value={l.date} onChange={(e) => set({ date: e.target.value })} /></div>
        </div>
        <div>
          <label className="label">Format dorit</label>
          <div className="flex flex-wrap gap-1.5">{CORP_FORMATS.map((f) => <Chip key={f} k="format" v={f} color="teal" />)}</div>
        </div>
        <div>
          <label className="label">Obiective</label>
          <div className="flex flex-wrap gap-1.5">{CORP_OBJECTIVES.map((o) => <Chip key={o} k="objectives" v={o} color="brand" />)}</div>
        </div>
        <div>
          <label className="label">Activități dorite</label>
          <div className="flex flex-wrap gap-1.5">{CORP_ACTIVITIES.map((a) => <Chip key={a} k="activities" v={a} color="amber" />)}</div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className="label">Locație</label><input className="input" value={l.location} onChange={(e) => set({ location: e.target.value })} placeholder="birou / externă / de organizat de noi" /></div>
          <div><label className="label">Catering</label><input className="input" value={l.catering} onChange={(e) => set({ catering: e.target.value })} placeholder="coffee break / prânz / cină…" /></div>
          <div><label className="label">Buget estimativ (RON)</label><input className="input" type="number" value={l.budget ?? ""} onChange={(e) => set({ budget: e.target.value ? Number(e.target.value) : null })} /></div>
          <div><label className="label">Deadline propunere</label><input className="input" type="date" value={l.deadline} onChange={(e) => set({ deadline: e.target.value })} /></div>
        </div>
        <div><label className="label">Note / nevoi specifice</label><textarea className="input min-h-[80px] resize-y" value={l.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="Context echipă, provocări, așteptări, restricții…" /></div>
        <div className="flex justify-between pt-1">
          {l.id && <button className="btn" onClick={() => exportCorporatePDF(l)}><Icon.download /> PDF brief</button>}
          <div className="flex gap-2 ml-auto">
            <button className="btn" onClick={onClose}>Anulează</button>
            <button className="btn-brand" disabled={!l.company.trim()} onClick={() => onSave(l)}>Salvează</button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function colorCls(color: string) {
  return color === "teal" ? "bg-teal/15 border-teal/40 text-teal"
    : color === "amber" ? "bg-amber/15 border-amber/40 text-amber"
    : "bg-brand/15 border-brand/40 text-brand-soft";
}
