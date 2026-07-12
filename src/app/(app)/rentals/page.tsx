"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/common";
import { Icon } from "@/components/ui";
import { fmtDateShort, cx } from "@/lib/utils";

export default function RentalsPage() {
  const { db } = useStore();
  const [checkDate, setCheckDate] = useState<string>(new Date().toISOString().slice(0, 10));

  // rezervat pe data aleasă
  const reservedOn = useMemo(() => {
    const clientIds = new Set(db.clients.filter((c) => c.event_date === checkDate).map((c) => c.id));
    const m: Record<string, number> = {};
    db.allocations.forEach((a) => { if (clientIds.has(a.client_id)) m[a.inventory_id] = (m[a.inventory_id] || 0) + a.qty; });
    return m;
  }, [db.allocations, db.clients, checkDate]);

  const eventsOnDate = db.clients.filter((c) => c.event_date === checkDate);

  // toate rezervările viitoare, grupate pe eveniment
  const upcomingByEvent = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const map: Record<string, { couple: string; clientId: string; date: string; items: { name: string; qty: number }[] }> = {};
    db.allocations.forEach((a) => {
      const c = db.clients.find((x) => x.id === a.client_id);
      const it = db.inventory.find((x) => x.id === a.inventory_id);
      if (!c || !it || !c.event_date || c.event_date < today) return;
      (map[c.id] ||= { couple: c.couple, clientId: c.id, date: c.event_date, items: [] }).items.push({ name: it.name, qty: a.qty });
    });
    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  }, [db.allocations, db.clients, db.inventory]);

  return (
    <div className="fade-in">
      <PageHeader title="Rentals" subtitle="Ce e rezervat și ce ai liber, pe orice dată." icon={<Icon.box />} />

      {/* Verificare disponibilitate pe dată */}
      <div className="card p-5 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Icon.calendar className="text-brand-soft" />
            <span className="font-bold text-ink">Disponibilitate la data</span>
          </div>
          <input className="input !w-44" type="date" value={checkDate} onChange={(e) => setCheckDate(e.target.value)} />
          <span className="text-sm text-muted">{eventsOnDate.length ? `${eventsOnDate.length} eveniment(e): ${eventsOnDate.map((c) => c.couple).join(", ")}` : "Niciun eveniment în această zi — tot stocul e liber."}</span>
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
              {db.inventory.length === 0 && <tr><td colSpan={4} className="td text-center text-muted py-6">Niciun articol în inventar. Adaugă din pagina <Link href="/inventory" className="text-brand-soft">Inventar</Link>.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rezervări viitoare pe eveniment */}
      <h3 className="section-title mb-3">Rezervări viitoare ({upcomingByEvent.length})</h3>
      {upcomingByEvent.length === 0 ? (
        <div className="card p-10 text-center text-sm text-muted">Nicio rezervare viitoare. Aloci echipamente unui eveniment din fișa clientului → tab <span className="text-brand-soft">Rentals</span>.</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {upcomingByEvent.map((e) => (
            <Link key={e.clientId} href={`/clients/${e.clientId}`} className="card p-5 hover:border-brand/40 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-ink truncate">{e.couple}</p>
                <span className="badge bg-panel2 border border-line text-muted shrink-0 ml-2">{fmtDateShort(e.date)}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {e.items.map((it, i) => (
                  <span key={i} className="badge bg-brand/10 border border-brand/20 text-brand-soft"><b className="text-ink">{it.qty}×</b> {it.name}</span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      )}

      <p className="text-sm text-muted mt-6">Catalogul complet, costurile și valoarea stocului sunt în pagina <Link href="/inventory" className="text-brand-soft">Inventar</Link>.</p>
    </div>
  );
}
