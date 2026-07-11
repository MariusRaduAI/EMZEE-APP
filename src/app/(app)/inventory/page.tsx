"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/common";
import { Icon, Modal, useConfirm } from "@/components/ui";
import { InventoryItem } from "@/lib/types";
import { fmtDateShort, cx } from "@/lib/utils";

export default function InventoryPage() {
  const { db, saveInventory, deleteInventory } = useStore();
  const { confirm, node } = useConfirm();
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [checkDate, setCheckDate] = useState<string>(new Date().toISOString().slice(0, 10));

  // rezervat pe data aleasă (sumă alocări pt clienți cu event_date === checkDate)
  const reservedOn = useMemo(() => {
    const clientIds = new Set(db.clients.filter((c) => c.event_date === checkDate).map((c) => c.id));
    const m: Record<string, number> = {};
    db.allocations.forEach((a) => { if (clientIds.has(a.client_id)) m[a.inventory_id] = (m[a.inventory_id] || 0) + a.qty; });
    return m;
  }, [db.allocations, db.clients, checkDate]);

  // toate rezervările viitoare (pentru listă)
  const upcoming = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const rows: { item: string; couple: string; date: string; qty: number }[] = [];
    db.allocations.forEach((a) => {
      const c = db.clients.find((x) => x.id === a.client_id);
      const it = db.inventory.find((x) => x.id === a.inventory_id);
      if (!c || !it || !c.event_date || c.event_date < today) return;
      rows.push({ item: it.name, couple: c.couple, date: c.event_date, qty: a.qty });
    });
    return rows.sort((x, y) => x.date.localeCompare(y.date));
  }, [db.allocations, db.clients, db.inventory]);

  // usage per item: list of upcoming events using it
  const usage = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const map: Record<string, { couple: string; date: string; qty: number }[]> = {};
    db.allocations.forEach((a) => {
      const c = db.clients.find((x) => x.id === a.client_id);
      if (!c || !c.event_date || c.event_date < today) return;
      (map[a.inventory_id] ||= []).push({ couple: c.couple, date: c.event_date, qty: a.qty });
    });
    Object.values(map).forEach((arr) => arr.sort((x, y) => x.date.localeCompare(y.date)));
    return map;
  }, [db.allocations, db.clients]);

  return (
    <div className="fade-in">
      {node}
      <PageHeader title="Inventar & Rentals" subtitle="Ce ai pe stoc și când e ocupat la evenimente." icon={<Icon.box />}>
        <button className="btn-brand" onClick={() => setEditing({ id: "", name: "", qty: 1, notes: "" })}><Icon.plus /> Articol nou</button>
      </PageHeader>

      {/* Verificare disponibilitate pe dată */}
      <div className="card p-5 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Icon.calendar className="text-brand-soft" />
            <span className="font-bold text-ink">Disponibilitate la data</span>
          </div>
          <input className="input !w-44" type="date" value={checkDate} onChange={(e) => setCheckDate(e.target.value)} />
          <span className="text-sm text-muted">Ce ai liber ca să poți răspunde rapid.</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px]">
            <thead><tr className="border-b border-line">
              <th className="th">Articol</th><th className="th text-center">Stoc</th><th className="th text-center">Rezervat</th><th className="th text-center">Liber</th>
            </tr></thead>
            <tbody className="divide-y divide-line/50">
              {db.inventory.map((it) => {
                const res = reservedOn[it.id] || 0;
                const free = it.qty - res;
                return (
                  <tr key={it.id}>
                    <td className="td font-medium">{it.name}</td>
                    <td className="td text-center text-muted">{it.qty}</td>
                    <td className="td text-center">{res > 0 ? <span className="font-semibold text-amber">{res}</span> : <span className="text-faint">0</span>}</td>
                    <td className="td text-center">
                      <span className={cx("badge", free <= 0 ? "bg-rose/15 text-rose" : "bg-green/15 text-green")}>{free <= 0 ? "Ocupat" : `${free} liber${free === 1 ? "" : "e"}`}</span>
                    </td>
                  </tr>
                );
              })}
              {db.inventory.length === 0 && <tr><td colSpan={4} className="td text-center text-muted py-6">Niciun articol în inventar.</td></tr>}
            </tbody>
          </table>
        </div>
        {upcoming.length > 0 && (
          <div className="mt-5 pt-4 border-t border-line">
            <p className="section-title mb-2">Rezervări viitoare</p>
            <div className="flex flex-wrap gap-2">
              {upcoming.slice(0, 12).map((r, i) => (
                <span key={i} className="badge bg-panel2 border border-line text-muted">
                  <b className="text-ink">{r.item}</b> ×{r.qty} · {r.couple} · {fmtDateShort(r.date)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {db.inventory.map((it) => {
          const uses = usage[it.id] || [];
          const upcomingQty = uses[0]?.qty || 0;
          return (
            <div key={it.id} className="card p-5 group">
              <div className="flex items-start justify-between mb-3">
                <span className="w-10 h-10 rounded-xl bg-brand/12 border border-brand/25 flex items-center justify-center text-brand-soft"><Icon.box /></span>
                <div className="flex items-center gap-1">
                  <button className="btn-ghost !p-1.5" onClick={() => setEditing(it)}><Icon.edit /></button>
                  <button className="btn-ghost !p-1.5 hover:!text-rose" onClick={async () => { if (await confirm(`Ștergi „${it.name}”?`)) deleteInventory(it.id); }}><Icon.trash /></button>
                </div>
              </div>
              <p className="font-semibold text-ink">{it.name}</p>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-3xl font-bold text-brand-soft tabular-nums">{it.qty}</span>
                <span className="text-sm text-muted">buc. în stoc</span>
              </div>
              {it.notes && <p className="text-xs text-muted mt-2">{it.notes}</p>}
              <div className="mt-4 pt-3 border-t border-line/60">
                <p className="section-title mb-2">Programat la</p>
                {uses.length === 0 ? (
                  <p className="text-xs text-faint">Neangajat — tot stocul liber.</p>
                ) : (
                  <div className="space-y-1.5">
                    {uses.slice(0, 3).map((u, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="text-ink truncate">{u.couple}</span>
                        <span className="text-faint shrink-0 ml-2">{fmtDateShort(u.date)} · {u.qty}buc</span>
                      </div>
                    ))}
                    {uses.length > 3 && <p className="text-xs text-faint">+{uses.length - 3} evenimente</p>}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {db.inventory.length === 0 && (
        <div className="card p-12 text-center">
          <p className="text-sm text-muted mb-3">Inventarul e gol.</p>
          <button className="btn-brand mx-auto" onClick={() => setEditing({ id: "", name: "", qty: 1, notes: "" })}><Icon.plus /> Adaugă primul articol</button>
        </div>
      )}

      <p className="text-sm text-muted mt-6">Aloci echipamente unui eveniment din pagina clientului → tab <Link href="/clients" className="text-brand-soft">Rentals</Link>. Aici vezi rapid ce e liber pe orice dată.</p>

      {editing && <InvEditor key={editing.id || "new"} item={editing} onClose={() => setEditing(null)} onSave={(x) => { saveInventory(x); setEditing(null); }} />}
    </div>
  );
}

function InvEditor({ item, onClose, onSave }: { item: InventoryItem; onClose: () => void; onSave: (x: InventoryItem) => void }) {
  const [x, setX] = useState<InventoryItem>(item);
  return (
    <Modal open onClose={onClose} title={x.id ? "Editează articol" : "Articol nou"}>
      <div className="space-y-4">
        <div><label className="label">Denumire</label><input className="input" value={x.name} onChange={(e) => setX({ ...x, name: e.target.value })} placeholder="ex. Giant Jenga" autoFocus /></div>
        <div><label className="label">Cantitate în stoc</label><input className="input" type="number" min={0} value={x.qty} onChange={(e) => setX({ ...x, qty: Number(e.target.value) || 0 })} /></div>
        <div><label className="label">Note</label><input className="input" value={x.notes} onChange={(e) => setX({ ...x, notes: e.target.value })} placeholder="detalii, stare, etc." /></div>
        <div className="flex justify-end gap-2"><button className="btn" onClick={onClose}>Anulează</button><button className="btn-brand" disabled={!x.name.trim()} onClick={() => onSave(x)}>Salvează</button></div>
      </div>
    </Modal>
  );
}
