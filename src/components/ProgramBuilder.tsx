"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { Icon } from "./ui";
import { ProgramItem, PROGRAM_PHASES } from "@/lib/types";
import { addMinutes, fmtDuration, uid, cx, downloadCSV } from "@/lib/utils";
import { exportProgramPDF } from "@/lib/pdf";

const COLORS = ["#5b57f0", "#0d9488", "#15935f", "#b45309", "#e11d48", "#7c3aed", "#0284c7", "#db2777", "#64748b"];

export function ProgramBuilder({ clientId }: { clientId: string }) {
  const { db, saveProgram, saveClient } = useStore();
  const client = db.clients.find((c) => c.id === clientId);
  const saved = useMemo(() => db.program_items.filter((p) => p.client_id === clientId).sort((a, b) => a.position - b.position), [db.program_items, clientId]);

  const [items, setItems] = useState<ProgramItem[]>(saved);
  const [starts, setStarts] = useState<Record<string, string>>({});
  const [phase, setPhase] = useState<string>("petrecere");
  const [dirty, setDirty] = useState(false);
  const dragIndex = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  useEffect(() => { setItems(saved.map((it) => ({ ...it, phase: it.phase || "petrecere" }))); setDirty(false); }, [saved]);
  useEffect(() => {
    const base: Record<string, string> = {};
    PROGRAM_PHASES.forEach((p) => { base[p.key] = client?.program_starts?.[p.key] || (p.key === "petrecere" ? client?.program_start || p.defaultStart : p.defaultStart); });
    setStarts(base);
  }, [client?.program_starts, client?.program_start]);

  const start = starts[phase] || PROGRAM_PHASES.find((p) => p.key === phase)?.defaultStart || "16:00";

  // indici în array-ul plat pentru faza curentă
  const phaseIdx = useMemo(() => items.map((it, i) => ({ it, i })).filter((x) => (x.it.phase || "petrecere") === phase), [items, phase]);

  const times = useMemo(() => {
    let clock = start;
    return phaseIdx.map(({ it }) => {
      const t = it.start_time && it.start_time.length ? it.start_time : clock;
      clock = addMinutes(t, it.duration_min);
      return t;
    });
  }, [phaseIdx, start]);
  const endTime = phaseIdx.length ? addMinutes(times[times.length - 1], phaseIdx[phaseIdx.length - 1].it.duration_min) : start;
  const totalMin = phaseIdx.reduce((s, x) => s + x.it.duration_min, 0);

  const countByPhase = useMemo(() => {
    const m: Record<string, number> = {};
    items.forEach((it) => { const p = it.phase || "petrecere"; m[p] = (m[p] || 0) + 1; });
    return m;
  }, [items]);

  const update = (flatI: number, patch: Partial<ProgramItem>) => { setItems((p) => p.map((it, idx) => idx === flatI ? { ...it, ...patch } : it)); setDirty(true); };
  const add = () => setItems((p) => { setDirty(true); return [...p, { id: uid(), client_id: clientId, position: p.length, duration_min: 15, activity: "", description: "", color: COLORS[phaseIdx.length % COLORS.length], start_time: "", phase }]; });
  const remove = (flatI: number) => { setItems((p) => p.filter((_, idx) => idx !== flatI)); setDirty(true); };
  const setStart = (v: string) => { setStarts((s) => ({ ...s, [phase]: v })); setDirty(true); };
  const autoRecalc = () => { setItems((p) => p.map((it) => (it.phase || "petrecere") === phase ? { ...it, start_time: "" } : it)); setDirty(true); };

  function onDrop(targetFlatI: number) {
    const from = dragIndex.current;
    setDragOver(null); dragIndex.current = null;
    if (from === null || from === targetFlatI) return;
    setItems((p) => {
      const arr = [...p];
      const [m] = arr.splice(from, 1);
      const insertAt = targetFlatI > from ? targetFlatI - 1 : targetFlatI;
      arr.splice(insertAt, 0, m);
      return arr;
    });
    setDirty(true);
  }

  function save() {
    saveProgram(clientId, items);
    if (client) saveClient({ ...client, program_starts: starts });
    setDirty(false);
  }
  function exportExcel() {
    const label = PROGRAM_PHASES.find((p) => p.key === phase)?.short || "program";
    downloadCSV(`program-${label}-${client?.couple || "eveniment"}.csv`, [
      ["Ordine", "Ora", "Durata (min)", "Activitate", "Descriere"],
      ...phaseIdx.map((x, i) => [i + 1, times[i], x.it.duration_min, x.it.activity, x.it.description]),
    ]);
  }
  function exportPdf() {
    const label = PROGRAM_PHASES.find((p) => p.key === phase)?.label || "Program";
    exportProgramPDF(client, label, phaseIdx.map((x, i) => ({ time: times[i], duration_min: x.it.duration_min, activity: x.it.activity, description: x.it.description, color: x.it.color })), start, endTime);
  }

  return (
    <div>
      {/* Phase tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {PROGRAM_PHASES.map((p) => (
          <button key={p.key} onClick={() => setPhase(p.key)}
            className={cx("px-4 py-2.5 rounded-xl text-[15px] font-bold border transition-colors",
              phase === p.key ? "bg-brand text-white border-brand" : "bg-panel border-line text-muted hover:text-ink hover:border-line2")}>
            {p.label}
            <span className={cx("ml-2 text-sm", phase === p.key ? "text-white/80" : "text-faint")}>{countByPhase[p.key] || 0}</span>
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-end gap-3 mb-4">
        <div>
          <label className="label">Ora de start</label>
          <input className="input !w-32" type="time" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div className="flex-1 card-2 px-4 py-3 flex items-center gap-5 text-[15px]">
          <span className="text-muted">Total: <b className="text-ink">{fmtDuration(totalMin)}</b></span>
          <span className="text-muted">Final: <b className="text-ink">{endTime}</b></span>
          <span className="text-muted">{phaseIdx.length} activități</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn" onClick={autoRecalc} title="Recalculează orele automat din durate"><Icon.clock /> Auto ore</button>
          <button className="btn" onClick={exportExcel}><Icon.download /> Excel</button>
          <button className="btn" onClick={exportPdf}><Icon.download /> PDF</button>
          <button className={cx("btn-brand", !dirty && "opacity-60")} onClick={save}><Icon.check /> {dirty ? "Salvează" : "Salvat"}</button>
        </div>
      </div>

      {/* Editable list */}
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
            <div className="flex flex-col items-center gap-1 pt-1.5 cursor-grab active:cursor-grabbing text-faint">
              <Icon.grip />
              <span className="text-[13px] font-bold text-muted tabular-nums">{i + 1}</span>
            </div>
            <div className="w-[104px] shrink-0 space-y-1.5">
              <div>
                <label className="block text-[12px] font-semibold text-faint mb-0.5">Ora</label>
                <input className="input !py-1.5 !px-2 !text-[15px] font-bold text-brand-soft" type="time" value={times[i]} onChange={(e) => update(flatI, { start_time: e.target.value })} />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-faint mb-0.5">Durată (min)</label>
                <input className="input !py-1.5 !px-2 !text-[15px]" type="number" min={0} step={5} value={it.duration_min} onChange={(e) => update(flatI, { duration_min: Number(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              <input className="input font-semibold" placeholder="Nume activitate (ex. Intrarea mirilor)" value={it.activity} onChange={(e) => update(flatI, { activity: e.target.value })} />
              <textarea className="input !py-2 min-h-[42px] text-sm resize-y" placeholder="Descriere / detalii (opțional)" value={it.description} onChange={(e) => update(flatI, { description: e.target.value })} />
            </div>
            <div className="flex flex-col items-center gap-2 pt-1">
              <ColorPick value={it.color} onChange={(c) => update(flatI, { color: c })} />
              <button className="btn-ghost !p-1.5 hover:!text-rose" onClick={() => remove(flatI)}><Icon.trash /></button>
            </div>
          </div>
        ))}
        <button className="btn w-full border-dashed" onClick={add}><Icon.plus /> Adaugă activitate</button>
        {phaseIdx.some((x) => x.it.start_time) && (
          <p className="text-sm text-faint text-center pt-1">Ai ore setate manual. Cele fără oră proprie se calculează automat după activitatea dinainte. „Auto ore" resetează totul la calcul automat.</p>
        )}
      </div>
    </div>
  );
}

function ColorPick({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button className="w-6 h-6 rounded-md border border-line2" style={{ background: value }} onClick={() => setOpen((o) => !o)} />
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
