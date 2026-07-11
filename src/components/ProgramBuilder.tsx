"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { Icon } from "./ui";
import { ProgramItem, PROGRAM_PHASES } from "@/lib/types";
import { addMinutes, fmtDuration, uid, cx, downloadCSV } from "@/lib/utils";
import { exportProgramPDF } from "@/lib/pdf";

const COLORS = ["#5b57f0", "#0d9488", "#15935f", "#b45309", "#e11d48", "#7c3aed", "#0284c7", "#db2777", "#64748b"];
const PHASE_ICON: Record<string, (p: { className?: string }) => React.ReactNode> = {
  pregatiri: Icon.clock, ceremonie: Icon.heart, petrecere: Icon.spark,
};

export function ProgramBuilder({ clientId }: { clientId: string }) {
  const { db, saveProgram } = useStore();
  const client = db.clients.find((c) => c.id === clientId);
  const saved = useMemo(() => db.program_items.filter((p) => p.client_id === clientId).sort((a, b) => a.position - b.position), [db.program_items, clientId]);

  const [items, setItems] = useState<ProgramItem[]>(saved);
  const [phase, setPhase] = useState<string>("petrecere");
  const [dirty, setDirty] = useState(false);
  const dragIndex = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  useEffect(() => { setItems(saved.map((it) => ({ ...it, phase: it.phase || "petrecere" }))); setDirty(false); }, [saved]);

  const phaseDefault = PROGRAM_PHASES.find((p) => p.key === phase)?.defaultStart || "16:00";
  const phaseIdx = useMemo(() => items.map((it, i) => ({ it, i })).filter((x) => (x.it.phase || "petrecere") === phase), [items, phase]);

  // Ora primei activități = ora de start. Restul se calculează din durate (dacă n-au oră proprie).
  const times = useMemo(() => {
    let clock = (phaseIdx[0]?.it.start_time && phaseIdx[0].it.start_time.length ? phaseIdx[0].it.start_time : phaseDefault);
    return phaseIdx.map(({ it }) => {
      const t = it.start_time && it.start_time.length ? it.start_time : clock;
      clock = addMinutes(t, it.duration_min);
      return t;
    });
  }, [phaseIdx, phaseDefault]);
  const endTime = phaseIdx.length ? addMinutes(times[times.length - 1], phaseIdx[phaseIdx.length - 1].it.duration_min) : phaseDefault;
  const totalMin = phaseIdx.reduce((s, x) => s + x.it.duration_min, 0);

  const countByPhase = useMemo(() => {
    const m: Record<string, number> = {};
    items.forEach((it) => { const p = it.phase || "petrecere"; m[p] = (m[p] || 0) + 1; });
    return m;
  }, [items]);

  const update = (flatI: number, patch: Partial<ProgramItem>) => { setItems((p) => p.map((it, idx) => idx === flatI ? { ...it, ...patch } : it)); setDirty(true); };
  const add = () => setItems((p) => {
    setDirty(true);
    const first = p.filter((it) => (it.phase || "petrecere") === phase).length === 0;
    return [...p, { id: uid(), client_id: clientId, position: p.length, duration_min: first ? 15 : 15, activity: "", description: "", color: COLORS[phaseIdx.length % COLORS.length], start_time: first ? phaseDefault : "", phase }];
  });
  const remove = (flatI: number) => { setItems((p) => p.filter((_, idx) => idx !== flatI)); setDirty(true); };
  const autoRecalc = () => { setItems((p) => p.map((it, idx) => (it.phase || "petrecere") === phase && idx !== phaseIdx[0]?.i ? { ...it, start_time: "" } : it)); setDirty(true); };

  function onDrop(targetFlatI: number) {
    const from = dragIndex.current;
    setDragOver(null); dragIndex.current = null;
    if (from === null || from === targetFlatI) return;
    setItems((p) => { const arr = [...p]; const [m] = arr.splice(from, 1); const insertAt = targetFlatI > from ? targetFlatI - 1 : targetFlatI; arr.splice(insertAt, 0, m); return arr; });
    setDirty(true);
  }

  function save() { saveProgram(clientId, items); setDirty(false); }
  function exportExcel() {
    const label = PROGRAM_PHASES.find((p) => p.key === phase)?.short || "program";
    downloadCSV(`program-${label}-${client?.couple || "eveniment"}.csv`, [
      ["Ordine", "Ora", "Durata (min)", "Activitate", "Descriere"],
      ...phaseIdx.map((x, i) => [i + 1, times[i], x.it.duration_min, x.it.activity, x.it.description]),
    ]);
  }
  function exportPdf() {
    const label = PROGRAM_PHASES.find((p) => p.key === phase)?.label || "Program";
    exportProgramPDF(client, label, phaseIdx.map((x, i) => ({ time: times[i], duration_min: x.it.duration_min, activity: x.it.activity, description: x.it.description, color: x.it.color })), times[0] || phaseDefault, endTime);
  }

  return (
    <div>
      {/* Faze — carduri mari */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {PROGRAM_PHASES.map((p) => {
          const PIcon = PHASE_ICON[p.key];
          const active = phase === p.key;
          return (
            <button key={p.key} onClick={() => setPhase(p.key)}
              className={cx("rounded-2xl border p-4 text-left transition-all", active ? "border-brand bg-brand/10 shadow-glow" : "border-line bg-panel hover:border-line2 hover:-translate-y-0.5")}>
              <div className="flex items-center justify-between mb-2">
                <span className={cx("w-9 h-9 rounded-xl flex items-center justify-center", active ? "bg-brand text-white" : "bg-panel2 text-faint")}><PIcon className="w-[18px] h-[18px]" /></span>
                <span className={cx("text-2xl font-bold tabular-nums", active ? "text-brand-soft" : "text-faint")}>{countByPhase[p.key] || 0}</span>
              </div>
              <p className={cx("font-bold leading-tight", active ? "text-ink" : "text-muted")}>{p.label}</p>
              <p className="text-[13px] text-faint mt-0.5">{(countByPhase[p.key] || 0) === 1 ? "1 activitate" : `${countByPhase[p.key] || 0} activități`}</p>
            </button>
          );
        })}
      </div>

      {/* Sumar + acțiuni */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <div className="flex-1 card-2 px-4 py-3 flex items-center gap-5 text-[15px]">
          <span className="text-muted">Start: <b className="text-ink">{times[0] || phaseDefault}</b></span>
          <span className="text-muted">Final: <b className="text-ink">{endTime}</b></span>
          <span className="text-muted">Durată: <b className="text-ink">{fmtDuration(totalMin)}</b></span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn" onClick={autoRecalc} title="Recalculează orele din durate"><Icon.clock /> Auto ore</button>
          <button className="btn" onClick={exportExcel}><Icon.download /> Excel</button>
          <button className="btn" onClick={exportPdf}><Icon.download /> PDF</button>
          <button className={cx("btn-brand", !dirty && "opacity-60")} onClick={save}><Icon.check /> {dirty ? "Salvează" : "Salvat"}</button>
        </div>
      </div>

      {/* Listă activități */}
      <div className="space-y-2">
        {phaseIdx.map(({ it, i: flatI }, i) => (
          <div key={it.id}
            draggable
            onDragStart={() => (dragIndex.current = flatI)}
            onDragOver={(e) => { e.preventDefault(); setDragOver(flatI); }}
            onDragLeave={() => setDragOver((o) => (o === flatI ? null : o))}
            onDrop={() => onDrop(flatI)}
            onDragEnd={() => { setDragOver(null); dragIndex.current = null; }}
            className={cx("card-2 p-3 flex gap-3 items-stretch transition-all", dragOver === flatI && "drop-target", dragIndex.current === flatI && "dragging")}
          >
            <span className="w-1 self-stretch rounded-full shrink-0" style={{ background: it.color }} />
            <div className="flex flex-col items-center gap-1 pt-1.5 cursor-grab active:cursor-grabbing text-faint" title="Trage ca să rearanjezi">
              <Icon.grip />
              <span className="text-[13px] font-bold text-muted tabular-nums">{i + 1}</span>
            </div>
            <div className="w-[92px] shrink-0 space-y-1.5">
              <div>
                <label className="block text-[12px] font-semibold text-faint mb-0.5">{i === 0 ? "Ora start" : "Ora"}</label>
                <input className="input !py-1.5 !px-2 !text-[15px] font-bold text-brand-soft" type="time" value={times[i]} onChange={(e) => update(flatI, { start_time: e.target.value })} />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-faint mb-0.5">Durată min</label>
                <input className="input !py-1.5 !px-2 !text-[15px]" type="number" min={0} step={5} value={it.duration_min} onChange={(e) => update(flatI, { duration_min: Number(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              <input className="input font-semibold" placeholder="Ce se întâmplă? (ex. Intrarea mirilor)" value={it.activity} onChange={(e) => update(flatI, { activity: e.target.value })} />
              <textarea className="input !py-2 min-h-[40px] text-sm resize-y" placeholder="Detalii (opțional)" value={it.description} onChange={(e) => update(flatI, { description: e.target.value })} />
            </div>
            <div className="flex flex-col items-center gap-2 pt-1">
              <ColorPick value={it.color} onChange={(c) => update(flatI, { color: c })} />
              <button className="btn-ghost !p-1.5 hover:!text-rose" onClick={() => remove(flatI)}><Icon.trash /></button>
            </div>
          </div>
        ))}
        <button className="btn-brand w-full" onClick={add}><Icon.plus /> Adaugă activitate</button>
        <p className="text-sm text-faint text-center pt-1">
          {phaseIdx.length === 0
            ? "Adaugă prima activitate — ora ei devine ora de start. Următoarele continuă automat din durate."
            : "Ora primei activități e ora de start. Poți edita orice oră direct; butonul Auto ore recalculează restul din durate."}
        </p>
      </div>
    </div>
  );
}

function ColorPick({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button className="w-6 h-6 rounded-md border border-line2" style={{ background: value }} onClick={() => setOpen((o) => !o)} title="Culoare" />
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-20 card p-2 grid grid-cols-3 gap-1.5 w-[104px]">
            {COLORS.map((c) => (
              <button key={c} className={cx("w-6 h-6 rounded-md border-2", value === c ? "border-ink" : "border-transparent")} style={{ background: c }} onClick={() => { onChange(c); setOpen(false); }} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
