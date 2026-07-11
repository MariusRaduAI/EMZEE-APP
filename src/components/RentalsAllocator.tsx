"use client";

import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { Icon } from "./ui";
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

  const setQty = (id: string, qty: number) => { setAlloc((p) => ({ ...p, [id]: Math.max(0, qty) })); setDirty(true); };
  const save = () => { setAllocations(clientId, Object.entries(alloc).map(([inventory_id, qty]) => ({ inventory_id, qty }))); setDirty(false); };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-muted">Rezervă echipamente pentru acest eveniment{client?.event_date ? "" : " (setează o dată pentru verificare disponibilitate)"}.</p>
        <button className={cx("btn-brand", !dirty && "opacity-60")} onClick={save}><Icon.check /> {dirty ? "Salvează" : "Salvat"}</button>
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
        {db.inventory.length === 0 && <p className="text-sm text-muted text-center py-6">Niciun articol în inventar. Adaugă din pagina Inventar & Rentals.</p>}
      </div>
    </div>
  );
}
