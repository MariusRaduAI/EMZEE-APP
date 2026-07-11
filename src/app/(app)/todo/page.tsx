"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/common";
import { Icon, Modal, useConfirm } from "@/components/ui";
import { Task, MEETING_TYPES } from "@/lib/types";
import { fmtDate, fmtDateShort, cx, daysUntil, initials } from "@/lib/utils";

export default function TodoPage() {
  const { db, saveTask, deleteTask } = useStore();
  const { confirm, node } = useConfirm();
  const [editing, setEditing] = useState<Task | null>(null);
  const [quick, setQuick] = useState("");
  const [quickClient, setQuickClient] = useState("");
  const [quickKind, setQuickKind] = useState<"todo" | "meeting">("todo");
  const [hideDone, setHideDone] = useState(false);

  const clientsSorted = useMemo(() => [...db.clients].sort((a, b) => (a.event_date || "9999").localeCompare(b.event_date || "9999")), [db.clients]);
  const clientName = (id: string | null) => db.clients.find((c) => c.id === id)?.couple || "";

  // grupare pe client (+ grup General pentru fără client)
  const groups = useMemo(() => {
    const map = new Map<string, Task[]>();
    db.tasks.forEach((t) => {
      const key = t.client_id || "__none__";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    });
    const order = (arr: Task[]) => arr.sort((a, b) => Number(a.done) - Number(b.done) || (a.date || "9999").localeCompare(b.date || "9999") || (a.time || "").localeCompare(b.time || ""));
    const result: { id: string; label: string; date: string; tasks: Task[] }[] = [];
    // clienți în ordinea datei evenimentului
    clientsSorted.forEach((c) => {
      if (map.has(c.id)) result.push({ id: c.id, label: c.couple, date: c.event_date, tasks: order(map.get(c.id)!) });
    });
    if (map.has("__none__")) result.push({ id: "__none__", label: "General (fără client)", date: "", tasks: order(map.get("__none__")!) });
    return result;
  }, [db.tasks, clientsSorted]);

  const filtered = hideDone ? groups.map((g) => ({ ...g, tasks: g.tasks.filter((t) => !t.done) })).filter((g) => g.tasks.length) : groups;
  const openCount = db.tasks.filter((t) => !t.done).length;

  function addQuick(e: React.FormEvent) {
    e.preventDefault();
    if (!quick.trim()) return;
    saveTask({ kind: quickKind, title: quick.trim(), client_id: quickClient || null, meeting_type: quickKind === "meeting" ? MEETING_TYPES[0] : "", done: false });
    setQuick("");
  }

  return (
    <div className="fade-in">
      {node}
      <PageHeader title="To Do" subtitle={`Task-uri și întâlniri, grupate pe fiecare client. ${openCount} deschise.`} icon={<Icon.agenda />}>
        <button className={cx("btn", hideDone && "!border-brand/50 !text-brand-soft")} onClick={() => setHideDone((v) => !v)}><Icon.check /> {hideDone ? "Arată finalizate" : "Ascunde finalizate"}</button>
        <button className="btn-brand" onClick={() => setEditing(newTask(quickClient))}><Icon.plus /> Detaliat</button>
      </PageHeader>

      {/* Adaugă rapid */}
      <form onSubmit={addQuick} className="card p-3 mb-6 flex flex-col sm:flex-row gap-2">
        <div className="flex rounded-lg border border-line overflow-hidden shrink-0">
          {(["todo", "meeting"] as const).map((k) => (
            <button type="button" key={k} onClick={() => setQuickKind(k)} className={cx("px-3.5 py-2 text-sm font-semibold transition-colors", quickKind === k ? "bg-brand text-white" : "text-muted hover:text-ink")}>
              {k === "todo" ? "Task" : "Întâlnire"}
            </button>
          ))}
        </div>
        <input className="input flex-1" placeholder={quickKind === "todo" ? "ex. Cumpăr premii pentru jocuri" : "ex. Discuție concept & flori"} value={quick} onChange={(e) => setQuick(e.target.value)} />
        <select className="input sm:max-w-[220px]" value={quickClient} onChange={(e) => setQuickClient(e.target.value)}>
          <option value="">— fără client —</option>
          {clientsSorted.map((c) => <option key={c.id} value={c.id}>{c.couple}</option>)}
        </select>
        <button className="btn-brand shrink-0" disabled={!quick.trim()}><Icon.plus /> Adaugă</button>
      </form>

      {filtered.length === 0 ? (
        <div className="card p-12 text-center text-muted text-[15px]">Nicio sarcină. Adaugă mai sus un task sau o întâlnire pentru un client.</div>
      ) : (
        <div className="space-y-5">
          {filtered.map((g) => {
            const d = g.date ? daysUntil(g.date) : null;
            return (
              <div key={g.id} className="card overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-3.5 border-b border-line bg-panel2/50">
                  {g.id !== "__none__" ? (
                    <>
                      <span className="w-8 h-8 rounded-lg bg-brand/12 border border-brand/25 flex items-center justify-center text-[12px] font-bold text-brand-soft shrink-0">{initials(g.label).toUpperCase()}</span>
                      <Link href={`/clients/${g.id}`} className="font-bold text-ink hover:text-brand-soft">{g.label}</Link>
                      {g.date && <span className="text-sm text-muted">{fmtDate(g.date)}{d !== null && d >= 0 ? ` · peste ${d}z` : ""}</span>}
                    </>
                  ) : <span className="font-bold text-muted">{g.label}</span>}
                  <span className="ml-auto text-sm text-faint">{g.tasks.filter((t) => !t.done).length} deschise</span>
                  <button className="btn-ghost !p-1.5" title="Adaugă pentru acest client" onClick={() => setEditing(newTask(g.id === "__none__" ? "" : g.id))}><Icon.plus /></button>
                </div>
                <div className="divide-y divide-line/50">
                  {g.tasks.map((t) => (
                    <div key={t.id} className={cx("flex items-center gap-3 px-5 py-3", t.done && "opacity-55")}>
                      <button onClick={() => saveTask({ ...t, done: !t.done })} className={cx("w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors", t.done ? "bg-green border-green text-white" : "border-line2 hover:border-brand")}>
                        {t.done && <Icon.check className="w-4 h-4" />}
                      </button>
                      <span className={cx("badge shrink-0", t.kind === "meeting" ? "bg-brand/12 border border-brand/25 text-brand-soft" : "bg-panel2 border border-line text-muted")}>
                        {t.kind === "meeting" ? (t.meeting_type || "Întâlnire") : "Task"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className={cx("font-medium text-ink", t.done && "line-through text-muted")}>{t.title || "—"}</p>
                        {(t.date || t.notes) && <p className="text-sm text-muted">{t.date ? fmtDateShort(t.date) : ""}{t.time ? ` · ${t.time}` : ""}{t.notes ? ` · ${t.notes}` : ""}</p>}
                      </div>
                      <button className="btn-ghost !p-1.5 shrink-0" onClick={() => setEditing(t)}><Icon.edit /></button>
                      <button className="btn-ghost !p-1.5 shrink-0 hover:!text-rose" onClick={async () => { if (t.kind === "meeting" ? await confirm("Ștergi întâlnirea?") : true) deleteTask(t.id); }}><Icon.trash /></button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing && <TaskEditor key={editing.id || "new"} task={editing} clients={clientsSorted} onClose={() => setEditing(null)} onSave={(t) => { saveTask(t); setEditing(null); }} />}
    </div>
  );
}

function newTask(clientId: string): Task {
  return { id: "", kind: "todo", title: "", client_id: clientId || null, meeting_type: "", date: "", time: "", done: false, notes: "", created_at: "" };
}

function TaskEditor({ task, clients, onClose, onSave }: { task: Task; clients: { id: string; couple: string }[]; onClose: () => void; onSave: (t: Task) => void }) {
  const [t, setT] = useState<Task>(task);
  const isMeeting = t.kind === "meeting";
  const set = (p: Partial<Task>) => setT((x) => ({ ...x, ...p }));
  return (
    <Modal open onClose={onClose} title={t.id ? "Editează" : "Adaugă"}>
      <div className="space-y-4">
        <div>
          <label className="label">Tip</label>
          <div className="flex rounded-lg border border-line overflow-hidden w-max">
            {(["todo", "meeting"] as const).map((k) => (
              <button key={k} onClick={() => set({ kind: k, meeting_type: k === "meeting" ? (t.meeting_type || MEETING_TYPES[0]) : "" })} className={cx("px-5 py-2 text-sm font-semibold", t.kind === k ? "bg-brand text-white" : "text-muted hover:text-ink")}>
                {k === "todo" ? "Task" : "Întâlnire"}
              </button>
            ))}
          </div>
        </div>
        {isMeeting && (
          <div>
            <label className="label">Tip întâlnire</label>
            <select className="input" value={t.meeting_type} onChange={(e) => set({ meeting_type: e.target.value })}>{MEETING_TYPES.map((m) => <option key={m}>{m}</option>)}</select>
          </div>
        )}
        <div>
          <label className="label">{isMeeting ? "Titlu / detalii" : "Task"}</label>
          <input className="input" value={t.title} onChange={(e) => set({ title: e.target.value })} placeholder={isMeeting ? "ex. Discutăm conceptul și jocurile" : "ex. Cumpăr flori"} autoFocus />
        </div>
        <div>
          <label className="label">Client</label>
          <select className="input" value={t.client_id || ""} onChange={(e) => set({ client_id: e.target.value || null })}>
            <option value="">— fără client —</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.couple}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Data</label><input className="input" type="date" value={t.date} onChange={(e) => set({ date: e.target.value })} /></div>
          {isMeeting && <div><label className="label">Ora</label><input className="input" type="time" value={t.time} onChange={(e) => set({ time: e.target.value })} /></div>}
        </div>
        {isMeeting && <div><label className="label">Note</label><textarea className="input min-h-[60px] resize-y" value={t.notes} onChange={(e) => set({ notes: e.target.value })} /></div>}
        <div className="flex justify-end gap-2 pt-1">
          <button className="btn" onClick={onClose}>Anulează</button>
          <button className="btn-brand" disabled={!t.title.trim()} onClick={() => onSave(t)}>Salvează</button>
        </div>
      </div>
    </Modal>
  );
}
