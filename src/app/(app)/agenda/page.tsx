"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/common";
import { Icon, Modal, useConfirm } from "@/components/ui";
import { Task, MEETING_TYPES } from "@/lib/types";
import { fmtDate, fmtDateShort, cx, daysUntil } from "@/lib/utils";

export default function AgendaPage() {
  const { db, saveTask, deleteTask } = useStore();
  const { confirm, node } = useConfirm();
  const [editing, setEditing] = useState<Task | null>(null);
  const [todoText, setTodoText] = useState("");

  const meetings = useMemo(() => db.tasks.filter((t) => t.kind === "meeting").sort(byDate), [db.tasks]);
  const todos = useMemo(() => db.tasks.filter((t) => t.kind === "todo").sort((a, b) => Number(a.done) - Number(b.done) || byDate(a, b)), [db.tasks]);
  const clientName = (id: string | null) => db.clients.find((c) => c.id === id)?.couple || "";

  function quickTodo(e: React.FormEvent) {
    e.preventDefault();
    if (!todoText.trim()) return;
    saveTask({ kind: "todo", title: todoText.trim(), done: false });
    setTodoText("");
  }

  const openMeetings = meetings.filter((m) => !m.done).length;
  const openTodos = todos.filter((t) => !t.done).length;

  return (
    <div className="fade-in">
      {node}
      <PageHeader title="Agenda" subtitle="Întâlnirile tale și lista personală de sarcini — într-un singur loc." icon={<Icon.agenda />} />

      <div className="grid lg:grid-cols-2 gap-6">
        {/* ---- ÎNTÂLNIRI ---- */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-ink">Întâlniri <span className="text-faint text-base font-semibold">{openMeetings}</span></h2>
            <button className="btn-brand" onClick={() => setEditing(newMeeting())}><Icon.plus /> Întâlnire</button>
          </div>
          <div className="space-y-2.5">
            {meetings.map((m) => {
              const d = m.date ? daysUntil(m.date) : null;
              return (
                <div key={m.id} className={cx("card p-4 flex gap-3", m.done && "opacity-60")}>
                  <button onClick={() => saveTask({ ...m, done: !m.done })} className={cx("w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors", m.done ? "bg-green border-green text-white" : "border-line2 hover:border-brand")}>
                    {m.done && <Icon.check className="w-4 h-4" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="badge bg-brand/12 border border-brand/25 text-brand-soft">{m.meeting_type || "Întâlnire"}</span>
                      {m.client_id && <Link href={`/clients/${m.client_id}`} className="text-sm font-semibold text-teal hover:underline">{clientName(m.client_id)}</Link>}
                    </div>
                    <p className={cx("font-semibold text-ink mt-1.5", m.done && "line-through")}>{m.title || "—"}</p>
                    {m.date && (
                      <p className="text-sm text-muted mt-0.5">
                        {fmtDate(m.date)}{m.time ? ` · ${m.time}` : ""}
                        {d !== null && d >= 0 && !m.done && <span className={cx("ml-2 font-semibold", d <= 3 ? "text-amber" : "text-faint")}>· peste {d}z</span>}
                      </p>
                    )}
                    {m.notes && <p className="text-sm text-muted mt-1">{m.notes}</p>}
                  </div>
                  <div className="flex flex-col gap-1">
                    <button className="btn-ghost !p-1.5" onClick={() => setEditing(m)}><Icon.edit /></button>
                    <button className="btn-ghost !p-1.5 hover:!text-rose" onClick={async () => { if (await confirm("Ștergi întâlnirea?")) deleteTask(m.id); }}><Icon.trash /></button>
                  </div>
                </div>
              );
            })}
            {meetings.length === 0 && <div className="card p-8 text-center text-muted text-[15px]">Nicio întâlnire încă. Adaugă prima întâlnire cu un client.</div>}
          </div>
        </div>

        {/* ---- TO-DO ---- */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-ink">To-do <span className="text-faint text-base font-semibold">{openTodos}</span></h2>
          </div>
          <form onSubmit={quickTodo} className="flex gap-2 mb-3">
            <input className="input" placeholder="Adaugă rapid o sarcină… (ex. Cumpăr flori pentru sâmbătă)" value={todoText} onChange={(e) => setTodoText(e.target.value)} />
            <button className="btn-brand shrink-0" disabled={!todoText.trim()}><Icon.plus /></button>
          </form>
          <div className="space-y-2">
            {todos.map((t) => (
              <div key={t.id} className={cx("card p-3.5 flex items-center gap-3", t.done && "opacity-60")}>
                <button onClick={() => saveTask({ ...t, done: !t.done })} className={cx("w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors", t.done ? "bg-green border-green text-white" : "border-line2 hover:border-brand")}>
                  {t.done && <Icon.check className="w-4 h-4" />}
                </button>
                <div className="min-w-0 flex-1">
                  <p className={cx("font-medium text-ink", t.done && "line-through text-muted")}>{t.title}</p>
                  {(t.date || t.client_id) && (
                    <p className="text-sm text-muted">
                      {t.client_id && <span className="text-teal font-semibold">{clientName(t.client_id)}</span>}
                      {t.client_id && t.date ? " · " : ""}{t.date ? fmtDateShort(t.date) : ""}
                    </p>
                  )}
                </div>
                <button className="btn-ghost !p-1.5" onClick={() => setEditing(t)}><Icon.edit /></button>
                <button className="btn-ghost !p-1.5 hover:!text-rose" onClick={() => deleteTask(t.id)}><Icon.trash /></button>
              </div>
            ))}
            {todos.length === 0 && <div className="card p-8 text-center text-muted text-[15px]">Nicio sarcină. Scrie mai sus ce ai de făcut.</div>}
          </div>
        </div>
      </div>

      {editing && <TaskEditor key={editing.id || "new"} task={editing} clients={db.clients} onClose={() => setEditing(null)} onSave={(t) => { saveTask(t); setEditing(null); }} />}
    </div>
  );
}

function byDate(a: Task, b: Task) {
  return (a.date || "9999").localeCompare(b.date || "9999") || (a.time || "").localeCompare(b.time || "");
}
function newMeeting(): Task {
  return { id: "", kind: "meeting", title: "", client_id: null, meeting_type: MEETING_TYPES[0], date: "", time: "", done: false, notes: "", created_at: "" };
}

function TaskEditor({ task, clients, onClose, onSave }: { task: Task; clients: { id: string; couple: string }[]; onClose: () => void; onSave: (t: Task) => void }) {
  const [t, setT] = useState<Task>(task);
  const isMeeting = t.kind === "meeting";
  return (
    <Modal open onClose={onClose} title={isMeeting ? (t.id ? "Editează întâlnire" : "Întâlnire nouă") : "Editează sarcină"}>
      <div className="space-y-4">
        {isMeeting && (
          <div>
            <label className="label">Tip întâlnire</label>
            <select className="input" value={t.meeting_type} onChange={(e) => setT({ ...t, meeting_type: e.target.value })}>
              {MEETING_TYPES.map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>
        )}
        <div>
          <label className="label">{isMeeting ? "Titlu / detalii" : "Sarcină"}</label>
          <input className="input" value={t.title} onChange={(e) => setT({ ...t, title: e.target.value })} placeholder={isMeeting ? "ex. Discutăm conceptul și jocurile" : "ex. Cumpăr flori"} autoFocus />
        </div>
        <div>
          <label className="label">Client (opțional)</label>
          <select className="input" value={t.client_id || ""} onChange={(e) => setT({ ...t, client_id: e.target.value || null })}>
            <option value="">— fără client —</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.couple}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Data</label><input className="input" type="date" value={t.date} onChange={(e) => setT({ ...t, date: e.target.value })} /></div>
          {isMeeting && <div><label className="label">Ora</label><input className="input" type="time" value={t.time} onChange={(e) => setT({ ...t, time: e.target.value })} /></div>}
        </div>
        {isMeeting && <div><label className="label">Note</label><textarea className="input min-h-[60px] resize-y" value={t.notes} onChange={(e) => setT({ ...t, notes: e.target.value })} /></div>}
        <div className="flex justify-end gap-2 pt-1">
          <button className="btn" onClick={onClose}>Anulează</button>
          <button className="btn-brand" disabled={!t.title.trim()} onClick={() => onSave(t)}>Salvează</button>
        </div>
      </div>
    </Modal>
  );
}
