"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/common";
import { Icon, Modal, useConfirm } from "@/components/ui";
import { InventoryItem, INVENTORY_CATEGORIES } from "@/lib/types";
import { money, cx } from "@/lib/utils";

export default function InventoryPage() {
  const { db, saveInventory, deleteInventory } = useStore();
  const { confirm, node } = useConfirm();
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [catFilter, setCatFilter] = useState<string>("");
  const shownInventory = catFilter ? db.inventory.filter((it) => (it.category || "jocuri") === catFilter) : db.inventory;

  const totals = useMemo(() => {
    const pieces = db.inventory.reduce((s, it) => s + (it.qty || 0), 0);
    const value = db.inventory.reduce((s, it) => s + (it.qty || 0) * (it.cost || 0), 0);
    const priced = db.inventory.filter((it) => it.cost != null && it.cost > 0).length;
    return { pieces, value, priced };
  }, [db.inventory]);

  return (
    <div className="fade-in">
      {node}
      <PageHeader title="Inventar" subtitle="Tot ce ai pe stoc și cât valorează." icon={<Icon.box />}>
        <button className="btn-brand" onClick={() => setEditing({ id: "", name: "", qty: 1, notes: "", category: catFilter || "jocuri", cost: null })}><Icon.plus /> Articol nou</button>
      </PageHeader>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="stat"><span className="text-xs text-muted">Tipuri de articole</span><p className="text-2xl font-bold tracking-tight">{db.inventory.length}</p></div>
        <div className="stat"><span className="text-xs text-muted">Bucăți în total</span><p className="text-2xl font-bold tracking-tight">{totals.pieces}</p></div>
        <div className="stat">
          <div className="flex items-center justify-between"><span className="text-xs text-muted">Valoarea inventarului</span><span className="w-8 h-8 rounded-lg flex items-center justify-center bg-brand/15 text-brand-soft"><Icon.offer /></span></div>
          <p className="text-2xl font-bold tracking-tight text-brand-soft">{money(totals.value, "RON")}</p>
        </div>
        <div className="stat"><span className="text-xs text-muted">Articole cu preț</span><p className="text-2xl font-bold tracking-tight">{totals.priced}<span className="text-lg text-faint">/{db.inventory.length}</span></p><p className="text-xs text-faint">completează costul ca să vezi valoarea reală</p></div>
      </div>

      {/* Filtru pe categorii */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button className={cx("chip", !catFilter ? "bg-brand/15 border-brand/40 text-brand-soft" : "border-line text-muted hover:text-ink")} onClick={() => setCatFilter("")}>Toate <span className="text-faint">{db.inventory.length}</span></button>
        {INVENTORY_CATEGORIES.map((c) => {
          const items = db.inventory.filter((it) => (it.category || "jocuri") === c.key);
          const val = items.reduce((s, it) => s + (it.qty || 0) * (it.cost || 0), 0);
          return <button key={c.key} className={cx("chip", catFilter === c.key ? "bg-brand/15 border-brand/40 text-brand-soft" : "border-line text-muted hover:text-ink")} onClick={() => setCatFilter(catFilter === c.key ? "" : c.key)}>{c.label} <span className="text-faint">{items.length}{val > 0 ? ` · ${money(val, "RON")}` : ""}</span></button>;
        })}
      </div>

      {/* Tabel inventar */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-line">
                <th className="th">Articol</th>
                <th className="th">Categorie</th>
                <th className="th text-center">Cantitate</th>
                <th className="th text-right">Cost/buc.</th>
                <th className="th text-right">Valoare</th>
                <th className="th w-20 text-right">Acțiuni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/50">
              {shownInventory.map((it) => (
                <tr key={it.id} className="hover:bg-panel2/50 transition-colors">
                  <td className="td">
                    <div className="flex items-center gap-2.5">
                      <span className={cx("w-8 h-8 rounded-lg border flex items-center justify-center shrink-0", (it.category || "jocuri") === "flori" ? "bg-rose/12 border-rose/25 text-rose" : "bg-brand/12 border-brand/25 text-brand-soft")}>{(it.category || "jocuri") === "flori" ? <Icon.flower className="w-4 h-4" /> : <Icon.box className="w-4 h-4" />}</span>
                      <div className="min-w-0"><p className="font-medium text-ink truncate">{it.name}</p>{it.notes && <p className="text-xs text-faint truncate">{it.notes}</p>}</div>
                    </div>
                  </td>
                  <td className="td"><span className="badge bg-panel2 border border-line text-muted">{INVENTORY_CATEGORIES.find((c) => c.key === (it.category || "jocuri"))?.label || it.category}</span></td>
                  <td className="td text-center tabular-nums font-semibold text-ink">{it.qty}</td>
                  <td className="td text-right tabular-nums text-muted">{it.cost != null && it.cost > 0 ? money(it.cost, "RON") : <span className="text-faint">—</span>}</td>
                  <td className="td text-right tabular-nums font-semibold text-ink">{it.cost != null && it.cost > 0 ? money((it.qty || 0) * it.cost, "RON") : <span className="text-faint">—</span>}</td>
                  <td className="td text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button className="btn-ghost !p-1.5" onClick={() => setEditing(it)}><Icon.edit /></button>
                      <button className="btn-ghost !p-1.5 hover:!text-rose" onClick={async () => { if (await confirm(`Ștergi „${it.name}”?`)) deleteInventory(it.id); }}><Icon.trash /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {shownInventory.length > 0 && (
                <tr className="bg-panel2/40 font-semibold">
                  <td className="td text-muted" colSpan={4}>Total{catFilter ? ` · ${INVENTORY_CATEGORIES.find((c) => c.key === catFilter)?.label}` : ""}</td>
                  <td className="td text-right tabular-nums text-brand-soft">{money(shownInventory.reduce((s, it) => s + (it.qty || 0) * (it.cost || 0), 0), "RON")}</td>
                  <td className="td"></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {db.inventory.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-sm text-muted mb-3">Inventarul e gol.</p>
            <button className="btn-brand mx-auto" onClick={() => setEditing({ id: "", name: "", qty: 1, notes: "", category: catFilter || "jocuri", cost: null })}><Icon.plus /> Adaugă primul articol</button>
          </div>
        )}
      </div>

      <p className="text-sm text-muted mt-6">Vezi ce e rezervat și disponibilitatea pe date în pagina <Link href="/rentals" className="text-brand-soft">Rentals</Link>. Aloci echipamente unui eveniment din fișa clientului → tab Rentals.</p>

      {editing && <InvEditor key={editing.id || "new"} item={editing} onClose={() => setEditing(null)} onSave={(x) => { saveInventory(x); setEditing(null); }} />}
    </div>
  );
}

function InvEditor({ item, onClose, onSave }: { item: InventoryItem; onClose: () => void; onSave: (x: InventoryItem) => void }) {
  const [x, setX] = useState<InventoryItem>(item);
  const value = (x.qty || 0) * (x.cost || 0);
  return (
    <Modal open onClose={onClose} title={x.id ? "Editează articol" : "Articol nou"}>
      <div className="space-y-4">
        <div><label className="label">Denumire</label><input className="input" value={x.name} onChange={(e) => setX({ ...x, name: e.target.value })} placeholder="ex. Giant Jenga / Vază înaltă / Arcadă pătrată" autoFocus /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Categorie</label>
            <select className="input" value={x.category || "jocuri"} onChange={(e) => setX({ ...x, category: e.target.value })}>
              {INVENTORY_CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
          </div>
          <div><label className="label">Cantitate în stoc</label><input className="input" type="number" min={0} value={x.qty} onChange={(e) => setX({ ...x, qty: Number(e.target.value) || 0 })} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Cost / bucată (RON)</label><input className="input" type="number" min={0} value={x.cost ?? ""} onChange={(e) => setX({ ...x, cost: e.target.value ? Number(e.target.value) : null })} placeholder="opțional" /></div>
          <div><label className="label">Valoare (calculat)</label><div className="input flex items-center bg-panel2 tabular-nums font-semibold">{value > 0 ? money(value, "RON") : "—"}</div></div>
        </div>
        <div><label className="label">Note</label><input className="input" value={x.notes} onChange={(e) => setX({ ...x, notes: e.target.value })} placeholder="detalii, stare, etc." /></div>
        <div className="flex justify-end gap-2"><button className="btn" onClick={onClose}>Anulează</button><button className="btn-brand" disabled={!x.name.trim()} onClick={() => onSave(x)}>Salvează</button></div>
      </div>
    </Modal>
  );
}
