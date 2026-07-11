"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { Icon } from "./ui";
import { ProgramItem } from "@/lib/types";
import { addMinutes, fmtDuration, uid, cx, downloadCSV, fmtDate } from "@/lib/utils";

const COLORS = ["#5b57f0", "#0d9488", "#15935f", "#b45309", "#e11d48", "#7c3aed", "#0284c7", "#db2777", "#64748b"];

export function ProgramBuilder({ clientId }: { clientId: string }) {
  const { db, saveProgram, saveClient } = useStore();
  const client = db.clients.find((c) => c.id === clientId);
  const saved = useMemo(() => db.program_items.filter((p) => p.client_id === clientId).sort((a, b) => a.position - b.position), [db.program_items, clientId]);

  const [items, setItems] = useState<ProgramItem[]>(saved);
  const [start, setStart] = useState(client?.program_start || "16:00");
  const [dirty, setDirty] = useState(false);
  const dragIndex = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  useEffect(() => { setItems(saved); setDirty(false); }, [saved]);
  useEffect(() => { setStart(client?.program_start || "16:00"); }, [client?.program_start]);

  // Ora efectivă: dacă activitatea are oră proprie, o folosește; altfel se calculează automat.
  const times = useMemo(() => {
    let clock = start;
    return items.map((it) => {
      const t = it.start_time && it.start_time.length ? it.start_time : clock;
      clock = addMinutes(t, it.duration_min);
      return t;
    });
  }, [items, start]);
  const endTime = items.length ? addMinutes(times[times.length - 1], items[items.length - 1].duration_min) : start;
  const totalMin = items.reduce((s, i) => s + i.duration_min, 0);

  const update = (i: number, patch: Partial<ProgramItem>) => { setItems((p) => p.map((it, idx) => idx === i ? { ...it, ...patch } : it)); setDirty(true); };
  const add = () => setItems((p) => { setDirty(true); return [...p, { id: uid(), client_id: clientId, position: p.length, duration_min: 15, activity: "", description: "", color: COLORS[p.length % COLORS.length], start_time: "" }]; });
  const remove = (i: number) => { setItems((p) => p.filter((_, idx) => idx !== i)); setDirty(true); };
  const autoRecalc = () => { setItems((p) => p.map((it) => ({ ...it, start_time: "" }))); setDirty(true); };

  function onDrop(target: number) {
    const from = dragIndex.current;
    setDragOver(null);
    dragIndex.current = null;
    if (from === null || from === target) return;
    setItems((p) => { const arr = [...p]; const [m] = arr.splice(from, 1); arr.splice(target, 0, m); return arr; });
    setDirty(true);
  }

  function save() { saveProgram(clientId, items); if (start !== client?.program_start) saveClient({ ...client!, program_start: start }); setDirty(false); }
  function exportExcel() {
    downloadCSV(`program-${client?.couple || "eveniment"}.csv`, [
      ["Ordine", "Ora", "Durata (min)", "Activitate", "Descriere"],
      ...items.map((it, i) => [i + 1, times[i], it.duration_min, it.activity, it.description]),
    ]);
  }

  return (
    <div>
      {/* Controls */}
      <div className="no-print flex flex-col sm:flex-row sm:items-end gap-3 mb-4">
        <div>
          <label className="label">Ora de start</label>
          <input className="input !w-32" type="time" value={start} onChange={(e) => { setStart(e.target.value); setDirty(true); }} />
        </div>
        <div className="flex-1 card-2 px-4 py-3 flex items-center gap-5 text-[15px]">
          <span className="text-muted">Total: <b className="text-ink">{fmtDuration(totalMin)}</b></span>
          <span className="text-muted">Final: <b className="text-ink">{endTime}</b></span>
          <span className="text-muted">{items.length} activități</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn" onClick={autoRecalc} title="Recalculează orele automat din durate"><Icon.clock /> Auto ore</button>
          <button className="btn" onClick={exportExcel}><Icon.download /> Excel</button>
          <button className="btn" onClick={() => window.print()}><Icon.print /> PDF</button>
          <button className={cx("btn-brand", !dirty && "opacity-60")} onClick={save}><Icon.check /> {dirty ? "Salvează" : "Salvat"}</button>
        </div>
      </div>

      {/* Editable list */}
      <div className="no-print space-y-2">
        {items.map((it, i) => (
          <div key={it.id}
            draggable
            onDragStart={() => (dragIndex.current = i)}
            onDragOver={(e) => { e.preventDefault(); setDragOver(i); }}
            onDragLeave={() => setDragOver((o) => (o === i ? null : o))}
            onDrop={() => onDrop(i)}
            onDragEnd={() => { setDragOver(null); dragIndex.current = null; }}
            className={cx("card-2 p-3 flex gap-3 items-stretch transition-all", dragOver === i && "drop-target", dragIndex.current === i && "dragging")}
          >
            <span className="w-1 self-stretch rounded-full shrink-0" style={{ background: it.color }} />
            <div className="flex flex-col items-center gap-1 pt-1.5 cursor-grab active:cursor-grabbing text-faint">
              <Icon.grip />
              <span className="text-[13px] font-bold text-muted tabular-nums">{i + 1}</span>
            </div>
            <div className="w-[104px] shrink-0 space-y-1.5">
              <div>
                <label className="block text-[12px] font-semibold text-faint mb-0.5">Ora</label>
                <input className="input !py-1.5 !px-2 !text-[15px] font-bold text-brand-soft" type="time" value={times[i]} onChange={(e) => update(i, { start_time: e.target.value })} />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-faint mb-0.5">Durată (min)</label>
                <input className="input !py-1.5 !px-2 !text-[15px]" type="number" min={0} step={5} value={it.duration_min} onChange={(e) => update(i, { duration_min: Number(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              <input className="input font-semibold" placeholder="Nume activitate (ex. Intrarea mirilor)" value={it.activity} onChange={(e) => update(i, { activity: e.target.value })} />
              <textarea className="input !py-2 min-h-[42px] text-sm resize-y" placeholder="Descriere / detalii (opțional)" value={it.description} onChange={(e) => update(i, { description: e.target.value })} />
            </div>
            <div className="flex flex-col items-center gap-2 pt-1">
              <ColorPick value={it.color} onChange={(c) => update(i, { color: c })} />
              <button className="btn-ghost !p-1.5 hover:!text-rose" onClick={() => remove(i)}><Icon.trash /></button>
            </div>
          </div>
        ))}
        <button className="btn w-full border-dashed" onClick={add}><Icon.plus /> Adaugă activitate</button>
        {items.some((it) => it.start_time) && (
          <p className="text-sm text-faint text-center pt-1">Ai ore setate manual. Cele fără oră proprie se calculează automat după activitatea dinainte. „Auto ore" resetează totul la calcul automat.</p>
        )}
      </div>

      {/* Print layout */}
      <PrintProgram client={client} items={items} times={times} start={start} endTime={endTime} />
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

function PrintProgram({ client, items, times, start, endTime }: { client: any; items: ProgramItem[]; times: string[]; start: string; endTime: string }) {
  return (
    <div className="print-only" style={{ color: "#111" }}>
      <div style={{ borderBottom: "3px solid #5b57f0", paddingBottom: 12, marginBottom: 20 }}>
        <div style={{ fontSize: 12, letterSpacing: 2, color: "#5b57f0", fontWeight: 700 }}>PROGRAM EVENIMENT · EMZEE</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: "6px 0 2px" }}>{client?.couple || "Eveniment"}</h1>
        <div style={{ fontSize: 13, color: "#555" }}>
          {client?.event_date ? fmtDate(client.event_date) : ""}{client?.venue ? ` · ${client.venue}` : ""}{client?.city ? `, ${client.city}` : ""}
          {"  ·  "}{start}–{endTime}
        </div>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: "1.5px solid #ddd", textAlign: "left" }}>
            <th style={{ padding: "8px 6px", width: 30 }}>#</th>
            <th style={{ padding: "8px 6px", width: 60 }}>Ora</th>
            <th style={{ padding: "8px 6px", width: 60 }}>Durată</th>
            <th style={{ padding: "8px 6px" }}>Activitate</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, i) => (
            <tr key={it.id} style={{ borderBottom: "1px solid #eee", pageBreakInside: "avoid" }}>
              <td style={{ padding: "9px 6px", color: "#999" }}>{i + 1}</td>
              <td style={{ padding: "9px 6px", fontWeight: 700, color: "#5b57f0" }}>{times[i]}</td>
              <td style={{ padding: "9px 6px", color: "#666" }}>{fmtDuration(it.duration_min)}</td>
              <td style={{ padding: "9px 6px", borderLeft: `4px solid ${it.color}`, paddingLeft: 10 }}>
                <div style={{ fontWeight: 600 }}>{it.activity || "—"}</div>
                {it.description && <div style={{ color: "#777", fontSize: 12, marginTop: 2 }}>{it.description}</div>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 24, fontSize: 11, color: "#aaa", textAlign: "center" }}>Generat cu EMZEE OS</div>
    </div>
  );
}
