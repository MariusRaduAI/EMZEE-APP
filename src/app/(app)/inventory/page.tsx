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

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {db.inventory.map((it) => {
          const uses = usage[it.id] || [];
          const upcomingQty = uses[0]?.qty || 0;
          return (
            <div key={it.id} className="card p-5 group">
              <div className="flex items-start justify-between mb-3">
                <span className="w-10 h-10 rounded-xl bg-brand/12 border border-brand/25 flex items-center justify-center text-brand-soft"><Icon.box /></span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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

      <p className="text-sm text-muted mt-6">💡 Rezervi echipamente pentru un eveniment din pagina clientului → tab <Link href="/clients" className="text-brand-soft">Rentals</Link>.</p>

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
