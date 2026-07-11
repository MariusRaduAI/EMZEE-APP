"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { InfoRow } from "@/components/common";
import { Icon, Modal, StatusBadge, useConfirm } from "@/components/ui";
import { ClientForm } from "@/components/ClientForm";
import { ProgramBuilder } from "@/components/ProgramBuilder";
import { ChecklistForm } from "@/components/ChecklistForm";
import { ProfileForm } from "@/components/ProfileForm";
import { OfferBuilder } from "@/components/OfferBuilder";
import { RentalsAllocator } from "@/components/RentalsAllocator";
import { fmtDate, money, initials, daysUntil, cx, uid, nowISO } from "@/lib/utils";
import { Offer } from "@/lib/types";

const TABS = [
  { k: "overview", label: "Prezentare", icon: Icon.users },
  { k: "program", label: "Program", icon: Icon.clock },
  { k: "checklist", label: "Checklist", icon: Icon.check },
  { k: "profile", label: "Profil miri", icon: Icon.heart },
  { k: "offer", label: "Ofertă", icon: Icon.offer },
  { k: "rentals", label: "Rentals", icon: Icon.box },
] as const;

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { db, saveClient, deleteClient } = useStore();
  const { confirm, node } = useConfirm();
  const [tab, setTab] = useState<(typeof TABS)[number]["k"]>("overview");
  const [editing, setEditing] = useState(false);

  const client = db.clients.find((c) => c.id === id);
  if (!client) {
    return (
      <div className="card p-12 text-center">
        <p className="text-muted mb-3">Clientul nu a fost găsit.</p>
        <Link href="/clients" className="btn mx-auto w-max"><Icon.back /> Înapoi la clienți</Link>
      </div>
    );
  }

  const d = daysUntil(client.event_date);
  const services = [
    client.svc_mc && "MC", client.svc_program && "Program", client.svc_games && "Jocuri",
    client.svc_flowers && "Flori", client.svc_kids && "Kids", client.svc_rentals && "Rentals", client.svc_corporate && "Corporate",
  ].filter(Boolean) as string[];

  const existingOffer = db.offers.find((o) => o.client_id === id);
  const offerSeed: Offer = existingOffer || {
    id: uid(), client_id: id, couple: client.couple, event_date: client.event_date, venue: client.venue,
    guests: client.guests, currency: client.currency, discount: 0, notes: "", terms: "", items: [], created_at: nowISO(),
  };

  return (
    <div className="fade-in">
      {node}
      <Link href="/clients" className="btn-ghost mb-4 no-print"><Icon.back /> Toți clienții</Link>

      {/* Header */}
      <div className="card p-5 sm:p-6 mb-5 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand to-teal flex items-center justify-center text-white font-bold text-lg shrink-0">{initials(client.couple).toUpperCase()}</span>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold tracking-tight">{client.couple}</h1>
                <StatusBadge status={client.status} />
              </div>
              <p className="text-muted text-sm mt-0.5">
                {client.event_date ? fmtDate(client.event_date) : "Fără dată"}
                {client.venue ? ` · ${client.venue}` : ""}{client.city ? `, ${client.city}` : ""}
                {client.family ? ` · Familia ${client.family}` : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {d !== null && d >= 0 && <div className="text-center px-4 py-2 rounded-xl bg-panel2 border border-line"><p className="text-xl font-bold text-brand-soft tabular-nums leading-none">{d}</p><p className="text-[12px] text-muted mt-1">zile</p></div>}
            <button className="btn" onClick={() => setEditing(true)}><Icon.edit /> Editează</button>
            <button className="btn-danger !px-2.5" onClick={async () => { if (await confirm(`Ștergi clientul „${client.couple}” și toate datele aferente?`)) { await deleteClient(client.id); router.push("/clients"); } }}><Icon.trash /></button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 overflow-x-auto no-print border-b border-line">
        {TABS.map((t) => (
          <button key={t.k} onClick={() => setTab(t.k)}
            className={cx("flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap",
              tab === t.k ? "border-brand text-ink" : "border-transparent text-muted hover:text-ink")}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === "overview" && (
        <div className="grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            <div className="card p-5">
              <h3 className="section-title mb-3">Detalii eveniment</h3>
              <InfoRow label="Miri" value={client.couple} />
              <InfoRow label="Familie" value={client.family || "—"} />
              <InfoRow label="Data" value={client.event_date ? fmtDate(client.event_date) : "—"} />
              <InfoRow label="Oraș" value={client.city || "—"} />
              <InfoRow label="Locație" value={client.venue || "—"} />
              <InfoRow label="Invitați" value={client.guests ?? "—"} />
              <InfoRow label="Fee" value={money(client.fee, client.currency)} />
            </div>
            {client.notes && (
              <div className="card p-5"><h3 className="section-title mb-2">Note</h3><p className="text-sm text-ink/90 whitespace-pre-wrap">{client.notes}</p></div>
            )}
          </div>
          <div className="space-y-5">
            <div className="card p-5">
              <h3 className="section-title mb-3">Servicii</h3>
              {services.length ? (
                <div className="flex flex-wrap gap-2">{services.map((s) => <span key={s} className="badge bg-brand/12 border border-brand/25 text-brand-soft">{s}</span>)}</div>
              ) : <p className="text-sm text-muted">Niciun serviciu selectat.</p>}
            </div>
            <div className="card p-5">
              <h3 className="section-title mb-3">Scurtături</h3>
              <div className="space-y-1.5">
                <button className="navlink w-full" onClick={() => setTab("program")}><Icon.clock className="w-4 h-4 text-faint" /> Program eveniment</button>
                <button className="navlink w-full" onClick={() => setTab("checklist")}><Icon.check className="w-4 h-4 text-faint" /> Checklist</button>
                <button className="navlink w-full" onClick={() => setTab("offer")}><Icon.offer className="w-4 h-4 text-faint" /> Ofertă</button>
                <button className="navlink w-full" onClick={() => setTab("rentals")}><Icon.box className="w-4 h-4 text-faint" /> Rentals</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "program" && <ProgramBuilder key={id} clientId={id} />}
      {tab === "checklist" && <ChecklistForm key={id} clientId={id} />}
      {tab === "profile" && <ProfileForm key={id} clientId={id} />}
      {tab === "offer" && <OfferBuilder key={offerSeed.id} initial={offerSeed} />}
      {tab === "rentals" && <RentalsAllocator key={id} clientId={id} />}

      <Modal open={editing} onClose={() => setEditing(false)} title="Editează client" wide>
        <ClientForm key={client.id} initial={client} onSave={async (c) => { await saveClient(c); setEditing(false); }} onCancel={() => setEditing(false)} />
      </Modal>
    </div>
  );
}
