"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/common";
import { Icon, Modal, StatusBadge } from "@/components/ui";
import { ClientForm } from "@/components/ClientForm";
import { fmtDateShort, money, initials, daysUntil, cx, downloadCSV } from "@/lib/utils";

export default function ClientsPage() {
  const { db, saveClient } = useStore();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [adding, setAdding] = useState(false);

  const rows = useMemo(() => {
    const ql = q.toLowerCase();
    return db.clients
      .filter((c) => (!status || c.status === status) && (!ql || c.couple.toLowerCase().includes(ql) || c.family.toLowerCase().includes(ql) || c.city.toLowerCase().includes(ql)))
      .sort((a, b) => (b.event_date || "").localeCompare(a.event_date || ""));
  }, [db.clients, q, status]);

  function exportCSV() {
    downloadCSV("emzee-clienti.csv", [
      ["Miri", "Familie", "Data", "Oras", "Locatie", "Fee", "Moneda", "Status", "Invitati", "MC", "Program", "Jocuri", "Flori"],
      ...rows.map((c) => [c.couple, c.family, c.event_date, c.city, c.venue, c.fee ?? "", c.currency, c.status, c.guests ?? "",
        c.svc_mc ? "DA" : "NU", c.svc_program ? "DA" : "NU", c.svc_games ? "DA" : "NU", c.svc_flowers ? "DA" : "NU"]),
    ]);
  }

  const counts = {
    all: db.clients.length,
    lead: db.clients.filter((c) => c.status === "lead").length,
    confirmat: db.clients.filter((c) => c.status === "confirmat").length,
    finalizat: db.clients.filter((c) => c.status === "finalizat").length,
  };

  return (
    <div className="fade-in">
      <PageHeader title="Clienți" subtitle="Centralizarea tuturor evenimentelor și mirilor." icon={<Icon.users />}>
        <button className="btn" onClick={exportCSV}><Icon.download /> Export</button>
        <button className="btn-brand" onClick={() => setAdding(true)}><Icon.plus /> Client nou</button>
      </PageHeader>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-md">
          <Icon.search className="absolute left-3 top-1/2 -translate-y-1/2 text-faint w-4 h-4" />
          <input className="input pl-9" placeholder="Caută miri, familie, oraș…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="flex gap-2">
          {[["", "Toate", counts.all], ["lead", "Lead", counts.lead], ["confirmat", "Confirmate", counts.confirmat], ["finalizat", "Finalizate", counts.finalizat]].map(([v, label, n]) => (
            <button key={v as string} className={cx("chip", status === v ? "bg-brand/15 border-brand/40 text-brand-soft" : "border-line text-muted hover:text-ink")} onClick={() => setStatus(v as string)}>
              {label} <span className="text-faint">{n as number}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="border-b border-line">
                <th className="th">Miri</th>
                <th className="th">Data</th>
                <th className="th">Locație</th>
                <th className="th">Servicii</th>
                <th className="th text-right">Fee</th>
                <th className="th">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/50">
              {rows.map((c) => {
                const d = c.event_date ? daysUntil(c.event_date) : null;
                return (
                  <tr key={c.id} className="hover:bg-panel2/60 transition-colors">
                    <td className="td">
                      <Link href={`/clients/${c.id}`} className="flex items-center gap-3 group">
                        <span className="w-9 h-9 rounded-lg bg-brand/12 border border-brand/25 flex items-center justify-center text-[11px] font-bold text-brand-soft shrink-0">{initials(c.couple).toUpperCase()}</span>
                        <div>
                          <p className="font-medium text-ink group-hover:text-brand-soft transition-colors">{c.couple}</p>
                          {c.family && <p className="text-xs text-faint">Familia {c.family}</p>}
                        </div>
                      </Link>
                    </td>
                    <td className="td">
                      <p className="text-ink">{c.event_date ? fmtDateShort(c.event_date) : "—"}</p>
                      {d !== null && d >= 0 && <p className={cx("text-xs", d <= 14 ? "text-amber" : "text-faint")}>peste {d}z</p>}
                    </td>
                    <td className="td text-muted">{c.venue || c.city || "—"}</td>
                    <td className="td">
                      <div className="flex gap-1">
                        {c.svc_mc && <Dot title="MC" c="bg-brand" />}
                        {c.svc_program && <Dot title="Program" c="bg-teal" />}
                        {c.svc_games && <Dot title="Jocuri" c="bg-green" />}
                        {c.svc_flowers && <Dot title="Flori" c="bg-rose" />}
                        {c.svc_kids && <Dot title="Kids" c="bg-amber" />}
                        {c.svc_rentals && <Dot title="Rentals" c="bg-brand-soft" />}
                      </div>
                    </td>
                    <td className="td text-right font-medium tabular-nums">{money(c.fee, c.currency)}</td>
                    <td className="td"><StatusBadge status={c.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && (
          <div className="px-5 py-12 text-center">
            <p className="text-sm text-muted mb-3">Niciun client încă.</p>
            <button className="btn-brand mx-auto" onClick={() => setAdding(true)}><Icon.plus /> Adaugă primul client</button>
          </div>
        )}
      </div>

      <Modal open={adding} onClose={() => setAdding(false)} title="Client nou" wide>
        <ClientForm onSave={(c) => { saveClient(c); setAdding(false); }} onCancel={() => setAdding(false)} />
      </Modal>
    </div>
  );
}

function Dot({ title, c }: { title: string; c: string }) {
  return <span title={title} className={cx("w-2.5 h-2.5 rounded-full", c)} />;
}
