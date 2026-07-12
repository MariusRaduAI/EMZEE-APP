"use client";

import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { Icon } from "./ui";
import { exportPackingPDF } from "@/lib/pdf";
import { cx } from "@/lib/utils";

export function RentalsAllocator({ clientId }: { clientId: string }) {
  const { db, setAllocations } = useStore();
  const client = db.clients.find((c) => c.id === clientId);
  const current = useMemo(() => {
    const m: Record<string, number> = {};
    db.allocations.filter((a) => a.client_id === clientId).forEach((a) => { m[a.inventory_id] = a.qty; });
    return m;
  }, [db.allocations, clientId]);

  const [alloc, setAlloc] = useState<Record<string, number>>(current);
  const [dirty, setDirty] = useState(false);
  useEffect(() => { setAlloc(current); setDirty(false); }, [current]);

  // reserved by OTHER events on the same date
  const reservedElsewhere = useMemo(() => {
    const m: Record<string, number> = {};
    if (!client?.event_date) return m;
    const sameDayClientIds = new Set(db.clients.filter((c) => c.id !== clientId && c.event_date === client.event_date).map((c) => c.id));
    db.allocations.filter((a) => sameDayClientIds.has(a.client_id)).forEach((a) => { m[a.inventory_id] = (m[a.inventory_id] || 0) + a.qty; });
    return m;
  }, [db.allocations, db.clients, client, clientId]);

  const [extras, setExtras] = useState("");

  const setQty = (id: string, qty: number) => { setAlloc((p) => ({ ...p, [id]: Math.max(0, qty) })); setDirty(true); };
  const save = () => { setAllocations(clientId, Object.entries(alloc).map(([inventory_id, qty]) => ({ inventory_id, qty }))); setDirty(false); };

  const packing = () => {
    const rows = db.inventory
      .filter((it) => (alloc[it.id] || 0) > 0)
      .map((it) => ({ name: it.name, qty: alloc[it.id], category: it.category || "altele" }));
    const extraList = extras.split("\n").map((s) => s.trim()).filter(Boolean);
    exportPackingPDF(client, rows, extraList);
  };
  const totalItems = Object.values(alloc).reduce((s, q) => s + (q || 0), 0);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <p className="text-sm text-muted">Rezervă echipamente pentru acest eveniment{client?.event_date ? "" : " (setează o dată pentru verificare disponibilitate)"}.</p>
        <div className="flex items-center gap-2">
          <button className="btn" onClick={packing} disabled={totalItems === 0} title={totalItems === 0 ? "Alocă articole mai întâi" : "Checklist inventar printabil pentru acest eveniment"}><Icon.print /> Checklist inventar</button>
          <button className={cx("btn-brand", !dirty && "opacity-60")} onClick={save}><Icon.check /> {dirty ? "Salvează" : "Salvat"}</button>
        </div>
      </div>
      <div className="space-y-2">
        {db.inventory.map((it) => {
          const chosen = alloc[it.id] || 0;
          const busy = reservedElsewhere[it.id] || 0;
          const available = it.qty - busy;
          const over = chosen > available;
          return (
            <div key={it.id} className="card-2 p-3 flex items-center gap-3">
              <span className="w-9 h-9 rounded-lg bg-panel border border-line flex items-center justify-center text-faint shrink-0"><Icon.box className="w-4 h-4" /></span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-ink text-sm">{it.name}</p>
                <p className="text-xs text-faint">Stoc total: {it.qty}{busy > 0 && <span className="text-amber"> · {busy} ocupate în aceeași zi</span>} · <span className={over ? "text-rose" : "text-green"}>{available} disponibile</span></p>
              </div>
              <div className="flex items-center gap-1.5">
                <button className="btn !px-2.5 !py-1.5" onClick={() => setQty(it.id, chosen - 1)} disabled={chosen <= 0}>−</button>
                <span className={cx("w-8 text-center font-semibold tabular-nums", over && "text-rose")}>{chosen}</span>
                <button className="btn !px-2.5 !py-1.5" onClick={() => setQty(it.id, chosen + 1)}>+</button>
              </div>
            </div>
          );
        })}
        {db.inventory.length === 0 && <p className="text-sm text-muted text-center py-6">Niciun articol în inventar. Adaugă din pagina Inventar.</p>}
      </div>

      <div className="card-2 p-4 mt-4">
        <label className="label">De luat cu mine la acest eveniment (câte unul pe rând)</label>
        <textarea className="input min-h-[90px] resize-y" value={extras} onChange={(e) => setExtras(e.target.value)} placeholder={"Prelungitoare\nBandă adezivă\nTrusă de rezervă\nBonuri / contract\nÎncărcătoare"} />
        <p className="text-xs text-faint mt-1.5">Scrie orice ai nevoie special pentru acest eveniment — apar în checklist separat de inventar. Bifezi pe hârtie „Luat" și „Retur" pentru fiecare.</p>
      </div>
    </div>
  );
}
