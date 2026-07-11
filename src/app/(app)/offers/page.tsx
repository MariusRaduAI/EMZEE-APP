"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { PageHeader, ClientSelect } from "@/components/common";
import { OfferBuilder } from "@/components/OfferBuilder";
import { Icon } from "@/components/ui";
import { Offer } from "@/lib/types";
import { uid, money, fmtDateShort, nowISO } from "@/lib/utils";

function blankOffer(): Offer {
  return { id: uid(), client_id: null, couple: "", event_date: "", venue: "", guests: null, currency: "RON", discount: 0, notes: "", terms: "", items: [], created_at: nowISO() };
}

export default function OffersPage() {
  const { db } = useStore();
  const [view, setView] = useState<{ mode: "list" } | { mode: "edit"; offer: Offer } | { mode: "new"; seed: Offer }>({ mode: "list" });

  if (view.mode !== "list") {
    const initial = view.mode === "edit" ? view.offer : view.seed;
    return (
      <div className="fade-in">
        <button className="btn-ghost mb-4" onClick={() => setView({ mode: "list" })}><Icon.back /> Toate ofertele</button>
        {view.mode === "new" && (
          <div className="no-print card p-4 mb-4 flex items-center gap-3">
            <span className="text-sm text-muted">Preia date din client:</span>
            <ClientSelect value={initial.client_id || ""} onChange={(id) => {
              const c = db.clients.find((x) => x.id === id);
              setView({ mode: "new", seed: { ...initial, client_id: id || null, couple: c?.couple || "", event_date: c?.event_date || "", venue: c?.venue || "", guests: c?.guests ?? null } });
            }} placeholder="— fără client —" />
          </div>
        )}
        <PageHeader title={view.mode === "edit" ? "Editează ofertă" : "Ofertă nouă"} icon={<Icon.offer />} />
        <OfferBuilder key={initial.id + (initial.client_id || "")} initial={initial} onSaved={() => setView({ mode: "list" })} />
      </div>
    );
  }

  const offers = [...db.offers].sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));

  return (
    <div className="fade-in">
      <PageHeader title="Generator oferte" subtitle="Oferte personalizate: MC, flori, rentals — total calculat automat." icon={<Icon.offer />}>
        <button className="btn-brand" onClick={() => setView({ mode: "new", seed: blankOffer() })}><Icon.plus /> Ofertă nouă</button>
      </PageHeader>

      {offers.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-panel2 border border-line flex items-center justify-center text-faint mx-auto mb-3"><Icon.offer /></div>
          <p className="font-semibold">Nicio ofertă încă</p>
          <p className="text-sm text-muted mt-1 mb-4">Creează prima ofertă cu pachete gata făcute.</p>
          <button className="btn-brand mx-auto" onClick={() => setView({ mode: "new", seed: blankOffer() })}><Icon.plus /> Ofertă nouă</button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {offers.map((o) => {
            const total = o.items.reduce((s, it) => s + it.qty * it.unit_price, 0) * (1 - (o.discount || 0) / 100);
            return (
              <button key={o.id} className="card p-5 text-left hover:border-brand/40 transition-colors" onClick={() => setView({ mode: "edit", offer: o })}>
                <div className="flex items-start justify-between mb-3">
                  <span className="w-9 h-9 rounded-lg bg-brand/12 border border-brand/25 flex items-center justify-center text-brand-soft"><Icon.offer className="w-4 h-4" /></span>
                  <span className="text-xs text-faint">{o.items.length} servicii</span>
                </div>
                <p className="font-semibold text-ink truncate">{o.couple || "Ofertă fără nume"}</p>
                <p className="text-xs text-muted">{o.event_date ? fmtDateShort(o.event_date) : "Fără dată"}{o.venue ? ` · ${o.venue}` : ""}</p>
                <p className="text-2xl font-bold text-brand-soft mt-3 tabular-nums">{money(total, o.currency)}</p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
