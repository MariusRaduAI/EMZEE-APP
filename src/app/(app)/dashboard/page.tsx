"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/common";
import { Icon, StatusBadge } from "@/components/ui";
import { fmtDate, fmtDateShort, daysUntil, money, initials, cx } from "@/lib/utils";

const QUICK = [
  { href: "/clients", icon: Icon.plus, title: "Client nou", color: "bg-brand" },
  { href: "/calendar", icon: Icon.calendar, title: "Calendar", color: "bg-teal" },
  { href: "/todo", icon: Icon.agenda, title: "To Do", color: "bg-green" },
  { href: "/program", icon: Icon.clock, title: "Program", color: "bg-amber" },
  { href: "/offers", icon: Icon.offer, title: "Ofertă", color: "bg-rose" },
  { href: "/checklist", icon: Icon.check, title: "Checklist", color: "bg-brand-soft" },
  { href: "/profile", icon: Icon.rings, title: "Profil miri", color: "bg-teal" },
  { href: "/flori", icon: Icon.flower, title: "Brief Flori", color: "bg-rose" },
  { href: "/games", icon: Icon.games, title: "Jocuri", color: "bg-brand" },
  { href: "/inventory", icon: Icon.box, title: "Inventar", color: "bg-green" },
  { href: "/reports", icon: Icon.chart, title: "Rapoarte", color: "bg-amber" },
  { href: "/corporate", icon: Icon.building, title: "Corporate", color: "bg-brand-soft" },
];

export default function Dashboard() {
  const { db } = useStore();

  const s = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const year = new Date().getFullYear();
    const upcoming = db.clients.filter((c) => c.event_date && c.event_date >= today).sort((a, b) => a.event_date.localeCompare(b.event_date));
    const thisYear = db.clients.filter((c) => c.event_date?.startsWith(String(year)));
    const revenue = thisYear.reduce((sum, c) => sum + (c.fee || 0), 0);
    const outstanding = db.clients.filter((c) => c.status !== "finalizat").reduce((sum, c) => sum + Math.max(0, (c.fee || 0) - (c.paid || 0)), 0);
    const collected = db.clients.reduce((sum, c) => sum + (c.paid || 0), 0);
    const openTasks = db.tasks.filter((t) => !t.done).sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999") || (a.time || "").localeCompare(b.time || ""));
    return {
      total: db.clients.length, upcoming, revenue, outstanding, collected, year,
      confirmed: db.clients.filter((c) => c.status === "confirmat").length,
      leads: db.clients.filter((c) => c.status === "lead").length,
      games: db.games.length, openTasks,
    };
  }, [db]);

  const next = s.upcoming[0];
  const nextDays = next ? daysUntil(next.event_date) : null;
  const clientName = (id: string | null) => db.clients.find((c) => c.id === id)?.couple || "";

  return (
    <div className="fade-in">
      <PageHeader title="Dashboard" subtitle="Imaginea completă a business-ului tău, într-un singur loc.">
        <Link href="/clients" className="btn-brand"><Icon.plus /> Client nou</Link>
      </PageHeader>

      {/* KPI + cashflow */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat href="/clients" label="Evenimente" value={s.total} sub={`${s.confirmed} confirmate · ${s.leads} lead`} icon={<Icon.users />} />
        <Stat href="/reports" label={`Venit ${s.year}`} value={money(s.revenue, "RON")} icon={<Icon.chart />} />
        <Stat href="/clients" label="De încasat" value={money(s.outstanding, "RON")} icon={<Icon.offer />} accent="amber" />
        <Stat href="/reports" label="Total încasat" value={money(s.collected, "RON")} icon={<Icon.check />} accent="green" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Next event hero */}
        <div className="lg:col-span-2 card p-6 relative overflow-hidden">
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-brand/10 blur-3xl" />
          {next ? (
            <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div>
                <p className="section-title mb-2">Următorul eveniment</p>
                <div className="flex items-center gap-3">
                  <span className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand to-teal flex items-center justify-center text-white font-bold">{initials(next.couple).toUpperCase()}</span>
                  <div>
                    <h2 className="text-xl font-bold text-ink">{next.couple}</h2>
                    <p className="text-muted text-sm">{fmtDate(next.event_date)}{next.venue ? ` · ${next.venue}` : ""}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  {next.svc_mc && <Tag>MC</Tag>}{next.svc_program && <Tag>Program</Tag>}{next.svc_games && <Tag>Jocuri</Tag>}
                  {next.svc_flowers && <Tag>Flori</Tag>}{next.svc_kids && <Tag>Kids</Tag>}{next.svc_rentals && <Tag>Rentals</Tag>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-center px-6 py-4 rounded-xl bg-panel2 border border-line">
                  <p className="text-4xl font-black text-brand-soft tabular-nums">{nextDays}</p>
                  <p className="text-xs text-muted mt-1">{nextDays === 1 ? "zi" : "zile"}</p>
                </div>
                <Link href={`/clients/${next.id}`} className="btn">Deschide <Icon.chevron /></Link>
              </div>
            </div>
          ) : <p className="text-muted">Niciun eveniment programat. <Link href="/clients" className="text-brand-soft">Adaugă primul client →</Link></p>}
        </div>

        {/* Upcoming To-Do */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-line">
            <h3 className="font-bold text-ink">Urmează</h3>
            <Link href="/todo" className="btn-ghost !text-sm">To Do <Icon.chevron className="w-4 h-4" /></Link>
          </div>
          <div className="divide-y divide-line/60 max-h-72 overflow-y-auto">
            {s.openTasks.slice(0, 6).map((t) => (
              <div key={t.id} className="flex items-center gap-2.5 px-5 py-3">
                <span className={cx("w-2 h-2 rounded-full shrink-0", t.kind === "meeting" ? "bg-brand" : "bg-teal")} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink truncate">{t.title}</p>
                  <p className="text-xs text-muted truncate">{t.client_id ? clientName(t.client_id) : "General"}{t.date ? ` · ${fmtDateShort(t.date)}` : ""}</p>
                </div>
              </div>
            ))}
            {s.openTasks.length === 0 && <p className="px-5 py-8 text-center text-sm text-muted">Nimic de făcut. 🎉</p>}
          </div>
        </div>
      </div>

      {/* Quick actions — toate paginile */}
      <h2 className="text-lg font-bold text-ink mb-3">Acțiuni rapide</h2>
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
        {QUICK.map((q) => (
          <Link key={q.href} href={q.href} className="card p-4 flex flex-col items-start gap-2.5 hover:border-brand/50 hover:-translate-y-0.5 transition-all">
            <span className={cx("w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0", q.color)}><q.icon /></span>
            <p className="font-bold text-ink text-sm leading-tight">{q.title}</p>
          </Link>
        ))}
      </div>

      {/* Upcoming events */}
      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <h3 className="font-bold text-ink">Evenimente viitoare</h3>
          <Link href="/calendar" className="btn-ghost !text-sm">Calendar <Icon.chevron className="w-4 h-4" /></Link>
        </div>
        <div className="divide-y divide-line/60">
          {s.upcoming.slice(0, 6).map((c) => {
            const d = daysUntil(c.event_date);
            const rest = (c.fee || 0) - (c.paid || 0);
            return (
              <Link key={c.id} href={`/clients/${c.id}`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-panel2 transition-colors">
                <span className="w-9 h-9 rounded-lg bg-brand/12 border border-brand/25 flex items-center justify-center text-[13px] font-bold text-brand-soft shrink-0">{initials(c.couple).toUpperCase()}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink truncate">{c.couple}</p>
                  <p className="text-sm text-muted">{fmtDate(c.event_date)}{c.venue ? ` · ${c.venue}` : ""}</p>
                </div>
                {rest > 0 && <span className="badge bg-amber/15 text-amber hidden sm:inline-flex">−{money(rest, "RON")}</span>}
                <StatusBadge status={c.status} />
                <span className={cx("text-sm font-semibold tabular-nums w-14 text-right", d !== null && d <= 14 ? "text-amber" : "text-faint")}>{d}z</span>
              </Link>
            );
          })}
          {s.upcoming.length === 0 && <p className="px-5 py-8 text-center text-[15px] text-muted">Niciun eveniment viitor.</p>}
        </div>
      </div>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return <span className="badge bg-panel2 border border-line text-muted">{children}</span>;
}

function Stat({ href, label, value, sub, icon, accent }: { href: string; label: string; value: React.ReactNode; sub?: string; icon: React.ReactNode; accent?: "green" | "amber" }) {
  return (
    <Link href={href} className="stat hover:border-brand/50 hover:-translate-y-0.5 transition-all">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-muted">{label}</span>
        <span className={cx("w-9 h-9 rounded-lg flex items-center justify-center", accent === "green" ? "bg-green/15 text-green" : accent === "amber" ? "bg-amber/15 text-amber" : "bg-panel2 text-faint")}>{icon}</span>
      </div>
      <p className={cx("text-2xl font-bold tracking-tight", accent === "green" ? "text-green" : accent === "amber" ? "text-amber" : "text-ink")}>{value}</p>
      {sub && <p className="text-sm text-faint">{sub}</p>}
    </Link>
  );
}
