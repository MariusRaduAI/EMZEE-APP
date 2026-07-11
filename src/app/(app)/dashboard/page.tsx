"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/common";
import { Icon, StatusBadge } from "@/components/ui";
import { fmtDate, daysUntil, money, initials, cx } from "@/lib/utils";

export default function Dashboard() {
  const { db } = useStore();

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const year = new Date().getFullYear();
    const upcoming = db.clients
      .filter((c) => c.event_date && c.event_date >= today)
      .sort((a, b) => a.event_date.localeCompare(b.event_date));
    const thisYear = db.clients.filter((c) => c.event_date?.startsWith(String(year)));
    const revenue = thisYear.reduce((s, c) => s + (c.fee || 0), 0);
    const flowersRevenue = db.clients.filter((c) => c.svc_flowers).length;
    return {
      total: db.clients.length,
      upcoming,
      leads: db.clients.filter((c) => c.status === "lead").length,
      confirmed: db.clients.filter((c) => c.status === "confirmat").length,
      revenue,
      games: db.games.length,
      flowers: flowersRevenue,
      year,
    };
  }, [db]);

  const next = stats.upcoming[0];
  const nextDays = next ? daysUntil(next.event_date) : null;

  return (
    <div className="fade-in">
      <PageHeader title="Panou principal" subtitle="Imaginea completă a business-ului tău de evenimente.">
        <Link href="/clients" className="btn-brand"><Icon.plus /> Client nou</Link>
      </PageHeader>

      {/* Hero: next event */}
      {next ? (
        <div className="card p-6 mb-6 relative overflow-hidden">
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-brand/10 blur-3xl" />
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div>
              <p className="section-title mb-2">Următorul eveniment</p>
              <div className="flex items-center gap-3">
                <span className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand to-teal flex items-center justify-center text-white font-bold">{initials(next.couple).toUpperCase()}</span>
                <div>
                  <h2 className="text-xl font-bold text-ink">{next.couple}</h2>
                  <p className="text-muted text-sm">{fmtDate(next.event_date)}{next.venue ? ` · ${next.venue}` : ""}{next.city ? `, ${next.city}` : ""}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                {next.svc_mc && <Tag icon={<Icon.mic className="w-3.5 h-3.5" />}>MC</Tag>}
                {next.svc_program && <Tag icon={<Icon.clock className="w-3.5 h-3.5" />}>Program</Tag>}
                {next.svc_games && <Tag icon={<Icon.games className="w-3.5 h-3.5" />}>Jocuri</Tag>}
                {next.svc_flowers && <Tag icon={<Icon.flower className="w-3.5 h-3.5" />}>Flori</Tag>}
                {next.svc_kids && <Tag>Kids</Tag>}
                {next.svc_rentals && <Tag icon={<Icon.box className="w-3.5 h-3.5" />}>Rentals</Tag>}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center px-6 py-4 rounded-xl bg-panel2 border border-line">
                <p className="text-4xl font-black text-brand-soft tabular-nums">{nextDays}</p>
                <p className="text-xs text-muted mt-1">{nextDays === 1 ? "zi rămasă" : "zile rămase"}</p>
              </div>
              <Link href={`/clients/${next.id}`} className="btn">Deschide <Icon.chevron /></Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="card p-6 mb-6 text-center text-muted">Niciun eveniment programat. <Link href="/clients" className="text-brand-soft">Adaugă primul client →</Link></div>
      )}

      {/* Quick actions — proeminente */}
      <h2 className="text-lg font-bold text-ink mb-3">Acțiuni rapide</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        <BigAction href="/clients" icon={<Icon.plus />} title="Client nou" hint="Adaugă eveniment" color="bg-brand" />
        <BigAction href="/program" icon={<Icon.clock />} title="Program" hint="Timeline + PDF" color="bg-teal" />
        <BigAction href="/offers" icon={<Icon.offer />} title="Ofertă" hint="Total automat" color="bg-green" />
        <BigAction href="/checklist" icon={<Icon.check />} title="Checklist" hint="Planificare" color="bg-amber" />
        <BigAction href="/profile" icon={<Icon.heart />} title="Profil miri" hint="Demografie" color="bg-rose" />
        <BigAction href="/games" icon={<Icon.games />} title="Jocuri" hint={`${stats.games} jocuri`} color="bg-brand-soft" />
      </div>

      {/* Stats — clickabile */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat href="/clients" label="Evenimente totale" value={stats.total} icon={<Icon.users />} />
        <Stat href="/reports" label={`Venit ${stats.year}`} value={money(stats.revenue, "RON")} icon={<Icon.offer />} accent />
        <Stat href="/clients" label="Confirmate" value={stats.confirmed} sub={`${stats.leads} lead-uri`} icon={<Icon.check />} />
        <Stat href="/games" label="Jocuri în bancă" value={stats.games} icon={<Icon.games />} />
      </div>

      {/* Upcoming list */}
      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <h3 className="font-bold text-ink">Evenimente viitoare</h3>
          <Link href="/calendar" className="btn-ghost !text-sm">Vezi calendar <Icon.chevron className="w-4 h-4" /></Link>
        </div>
        <div className="divide-y divide-line/60">
          {stats.upcoming.slice(0, 6).map((c) => {
            const d = daysUntil(c.event_date);
            return (
              <Link key={c.id} href={`/clients/${c.id}`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-panel2 transition-colors">
                <span className="w-9 h-9 rounded-lg bg-brand/12 border border-brand/25 flex items-center justify-center text-[13px] font-bold text-brand-soft shrink-0">{initials(c.couple).toUpperCase()}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink truncate">{c.couple}</p>
                  <p className="text-sm text-muted">{fmtDate(c.event_date)}{c.city ? ` · ${c.city}` : ""}</p>
                </div>
                <StatusBadge status={c.status} />
                <span className={cx("text-sm font-semibold tabular-nums w-16 text-right", d !== null && d <= 14 ? "text-amber" : "text-faint")}>{d}z</span>
              </Link>
            );
          })}
          {stats.upcoming.length === 0 && <p className="px-5 py-8 text-center text-[15px] text-muted">Niciun eveniment viitor.</p>}
        </div>
      </div>
    </div>
  );
}

function BigAction({ href, icon, title, hint, color }: { href: string; icon: React.ReactNode; title: string; hint: string; color: string }) {
  return (
    <Link href={href} className="card p-4 flex flex-col gap-2.5 hover:border-brand/50 hover:-translate-y-0.5 transition-all">
      <span className={cx("w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0", color)}>{icon}</span>
      <div>
        <p className="font-bold text-ink text-[15px] leading-tight">{title}</p>
        <p className="text-sm text-muted">{hint}</p>
      </div>
    </Link>
  );
}

function Stat({ href, label, value, sub, icon, accent }: { href: string; label: string; value: React.ReactNode; sub?: string; icon: React.ReactNode; accent?: boolean }) {
  return (
    <Link href={href} className="stat hover:border-brand/50 hover:-translate-y-0.5 transition-all">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-muted">{label}</span>
        <span className={cx("w-9 h-9 rounded-lg flex items-center justify-center", accent ? "bg-brand/15 text-brand-soft" : "bg-panel2 text-faint")}>{icon}</span>
      </div>
      <p className={cx("text-3xl font-bold tracking-tight", accent && "text-brand-soft")}>{value}</p>
      {sub ? <p className="text-sm text-faint">{sub}</p> : <p className="text-sm text-brand-soft font-semibold">Deschide →</p>}
    </Link>
  );
}

function Tag({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return <span className="badge bg-panel2 border border-line text-muted">{icon}{children}</span>;
}
