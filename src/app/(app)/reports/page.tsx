"use client";

import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/common";
import { Icon } from "@/components/ui";
import { money, cx, downloadCSV } from "@/lib/utils";

const MONTHS_RO = ["Ian", "Feb", "Mar", "Apr", "Mai", "Iun", "Iul", "Aug", "Sep", "Oct", "Noi", "Dec"];

export default function ReportsPage() {
  const { db } = useStore();

  const R = useMemo(() => {
    const cl = db.clients;
    const withFee = cl.filter((c) => c.fee != null);
    const totalRevenue = withFee.reduce((s, c) => s + (c.fee || 0), 0);
    const avgFee = withFee.length ? Math.round(totalRevenue / withFee.length) : 0;
    const todayISO = new Date().toISOString().slice(0, 10);
    const thisYear = String(new Date().getFullYear());

    // per year
    const byYear: Record<string, { count: number; revenue: number }> = {};
    cl.forEach((c) => {
      const y = c.event_date ? c.event_date.slice(0, 4) : "Fără dată";
      (byYear[y] ||= { count: 0, revenue: 0 });
      byYear[y].count++;
      byYear[y].revenue += c.fee || 0;
    });
    const years = Object.keys(byYear).filter((y) => y !== "Fără dată").sort();

    // per month (seasonality, all years)
    const byMonth = Array(12).fill(0);
    cl.forEach((c) => { if (c.event_date) byMonth[Number(c.event_date.slice(5, 7)) - 1]++; });

    // services attach
    const n = cl.length || 1;
    const svc = [
      { key: "MC", v: cl.filter((c) => c.svc_mc).length, color: "#6d6bff" },
      { key: "Program", v: cl.filter((c) => c.svc_program).length, color: "#33d6c4" },
      { key: "Jocuri", v: cl.filter((c) => c.svc_games).length, color: "#37d399" },
      { key: "Flori", v: cl.filter((c) => c.svc_flowers).length, color: "#ff6b81" },
      { key: "Rentals", v: cl.filter((c) => c.svc_rentals).length, color: "#8b8aff" },
      { key: "Kids", v: cl.filter((c) => c.svc_kids).length, color: "#f5b53d" },
    ];

    // status
    const status = {
      lead: cl.filter((c) => c.status === "lead").length,
      confirmat: cl.filter((c) => c.status === "confirmat").length,
      finalizat: cl.filter((c) => c.status === "finalizat").length,
    };

    // top locations
    const locMap: Record<string, number> = {};
    cl.forEach((c) => { const l = (c.venue || c.city || "").trim(); if (l) locMap[l] = (locMap[l] || 0) + 1; });
    const topLoc = Object.entries(locMap).sort((a, b) => b[1] - a[1]).slice(0, 6);

    // repeat families
    const famMap: Record<string, number> = {};
    cl.forEach((c) => { const f = c.family.trim(); if (f) famMap[f] = (famMap[f] || 0) + 1; });
    const repeatFam = Object.entries(famMap).filter(([, v]) => v > 1).sort((a, b) => b[1] - a[1]);

    // guests avg
    const withGuests = cl.filter((c) => c.guests != null);
    const avgGuests = withGuests.length ? Math.round(withGuests.reduce((s, c) => s + (c.guests || 0), 0) / withGuests.length) : 0;

    // highlights
    const bestYear = years.map((y) => ({ y, ...byYear[y] })).sort((a, b) => b.count - a.count)[0];
    const bestRevYear = years.map((y) => ({ y, ...byYear[y] })).sort((a, b) => b.revenue - a.revenue)[0];
    const busiestMonthIdx = byMonth.indexOf(Math.max(...byMonth));
    const biggest = [...withFee].sort((a, b) => (b.fee || 0) - (a.fee || 0))[0];

    return {
      total: cl.length, totalRevenue, avgFee, avgGuests,
      thisYear, thisYearData: byYear[thisYear] || { count: 0, revenue: 0 },
      upcoming: cl.filter((c) => c.event_date && c.event_date >= todayISO).length,
      past: cl.filter((c) => c.event_date && c.event_date < todayISO).length,
      byYear, years, byMonth, svc, status, topLoc, repeatFam, n,
      bestYear, bestRevYear, busiestMonthIdx, biggest,
    };
  }, [db.clients]);

  function exportReport() {
    downloadCSV("emzee-raport-anual.csv", [
      ["An", "Evenimente", "Venit (RON)"],
      ...R.years.map((y) => [y, R.byYear[y].count, R.byYear[y].revenue]),
      [], ["TOTAL", R.total, R.totalRevenue],
    ]);
  }

  if (R.total === 0) {
    return (
      <div className="fade-in">
        <PageHeader title="Rapoarte" subtitle="Evoluția business-ului tău." icon={<Icon.dashboard />} />
        <div className="card p-12 text-center text-muted">Niciun client încă — adaugă evenimente ca să vezi statistici.</div>
      </div>
    );
  }

  const maxYearCount = Math.max(...R.years.map((y) => R.byYear[y].count), 1);
  const maxYearRev = Math.max(...R.years.map((y) => R.byYear[y].revenue), 1);
  const maxMonth = Math.max(...R.byMonth, 1);

  return (
    <div className="fade-in">
      <PageHeader title="Rapoarte" subtitle="Cum ai stat, cum ai evoluat — imaginea completă." icon={<Icon.dashboard />}>
        <button className="btn" onClick={exportReport}><Icon.download /> Export</button>
      </PageHeader>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Kpi label="Evenimente totale" value={R.total} sub={`${R.past} trecute · ${R.upcoming} viitoare`} icon={<Icon.calendar />} />
        <Kpi label="Venit total" value={money(R.totalRevenue, "RON")} sub="din toate evenimentele" icon={<Icon.offer />} accent />
        <Kpi label="Fee mediu" value={money(R.avgFee, "RON")} sub={`~${R.avgGuests || "—"} invitați/eveniment`} icon={<Icon.spark />} />
        <Kpi label={`Anul ${R.thisYear}`} value={R.thisYearData.count} sub={money(R.thisYearData.revenue, "RON")} icon={<Icon.clock />} />
      </div>

      {/* Evolution */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="card p-5">
          <h3 className="section-title mb-4">Evenimente pe an</h3>
          <VBars data={R.years.map((y) => ({ label: y, value: R.byYear[y].count }))} max={maxYearCount} color="#6d6bff" fmt={(v) => String(v)} />
        </div>
        <div className="card p-5">
          <h3 className="section-title mb-4">Venit pe an</h3>
          <VBars data={R.years.map((y) => ({ label: y, value: R.byYear[y].revenue }))} max={maxYearRev} color="#33d6c4" fmt={(v) => (v >= 1000 ? (v / 1000).toFixed(0) + "k" : String(v))} />
        </div>
      </div>

      {/* Seasonality */}
      <div className="card p-5 mb-6">
        <h3 className="section-title mb-4">Sezonalitate — evenimente pe lună (toți anii)</h3>
        <VBars data={R.byMonth.map((v, i) => ({ label: MONTHS_RO[i], value: v }))} max={maxMonth} color="#8b8aff" fmt={(v) => (v ? String(v) : "")} compact />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Services attach */}
        <div className="card p-5">
          <h3 className="section-title mb-4">Servicii vândute (rată de atașare)</h3>
          <div className="space-y-3">
            {R.svc.sort((a, b) => b.v - a.v).map((s) => {
              const pct = Math.round((s.v / R.n) * 100);
              return (
                <div key={s.key}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-ink font-medium">{s.key}</span>
                    <span className="text-muted tabular-nums">{s.v} · {pct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-panel2 overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: s.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Status + locations */}
        <div className="space-y-6">
          <div className="card p-5">
            <h3 className="section-title mb-4">Status evenimente</h3>
            <div className="flex gap-2 mb-3 h-3 rounded-full overflow-hidden bg-panel2">
              <span style={{ width: `${(R.status.finalizat / R.n) * 100}%`, background: "#6d6bff" }} />
              <span style={{ width: `${(R.status.confirmat / R.n) * 100}%`, background: "#37d399" }} />
              <span style={{ width: `${(R.status.lead / R.n) * 100}%`, background: "#f5b53d" }} />
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              <Legend c="#6d6bff" label="Finalizate" v={R.status.finalizat} />
              <Legend c="#37d399" label="Confirmate" v={R.status.confirmat} />
              <Legend c="#f5b53d" label="Lead-uri" v={R.status.lead} />
            </div>
          </div>
          <div className="card p-5">
            <h3 className="section-title mb-4">Top locații</h3>
            {R.topLoc.length ? (
              <div className="space-y-2">
                {R.topLoc.map(([loc, count]) => (
                  <div key={loc} className="flex items-center justify-between text-sm">
                    <span className="text-ink truncate">{loc}</span>
                    <span className="badge bg-panel2 border border-line text-muted shrink-0 ml-2">{count} {count === 1 ? "eveniment" : "evenimente"}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-muted">Adaugă locații la clienți ca să vezi topul.</p>}
          </div>
        </div>
      </div>

      {/* Highlights */}
      <div className="card p-5">
        <h3 className="section-title mb-4">💡 Insight-uri</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {R.bestYear && <Insight title={`Cel mai bun an: ${R.bestYear.y}`} text={`${R.bestYear.count} evenimente`} />}
          {R.bestRevYear && <Insight title={`Cel mai mare venit: ${R.bestRevYear.y}`} text={money(R.bestRevYear.revenue, "RON")} />}
          <Insight title={`Luna cea mai aglomerată: ${MONTHS_RO[R.busiestMonthIdx]}`} text={`${R.byMonth[R.busiestMonthIdx]} evenimente în total`} />
          {R.biggest && <Insight title="Cel mai mare eveniment" text={`${R.biggest.couple} · ${money(R.biggest.fee, R.biggest.currency)}`} />}
          <Insight title="Invitați în medie" text={R.avgGuests ? `~${R.avgGuests} per eveniment` : "adaugă nr. invitați"} />
          <Insight title="Familii recurente" text={R.repeatFam.length ? R.repeatFam.map(([f, v]) => `${f} (${v})`).join(", ") : "niciuna încă"} />
        </div>
      </div>

      {/* Idea box */}
      <div className="card p-5 mt-6 border-dashed">
        <h3 className="section-title mb-2">Idei de rapoarte viitoare</h3>
        <p className="text-sm text-muted">Pot adăuga: comparație an-la-an (creștere %), rată de conversie lead→confirmat, prognoză venit pe baza rezervărilor, hartă a orașelor, sezon plin vs. gol, venit pe tip de serviciu (flori vs. MC vs. rentals), timp mediu de la ofertă la confirmare. Spune-mi care te interesează.</p>
      </div>
    </div>
  );
}

function Kpi({ label, value, sub, icon, accent }: { label: string; value: React.ReactNode; sub?: string; icon: React.ReactNode; accent?: boolean }) {
  return (
    <div className="stat">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted">{label}</span>
        <span className={cx("w-8 h-8 rounded-lg flex items-center justify-center", accent ? "bg-brand/15 text-brand-soft" : "bg-panel2 text-faint")}>{icon}</span>
      </div>
      <p className={cx("text-2xl font-bold tracking-tight", accent && "text-brand-soft")}>{value}</p>
      {sub && <p className="text-xs text-faint">{sub}</p>}
    </div>
  );
}

function VBars({ data, max, color, fmt, compact }: { data: { label: string; value: number }[]; max: number; color: string; fmt: (v: number) => string; compact?: boolean }) {
  return (
    <div className="flex items-end gap-2">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center min-w-0">
          <span className={cx("mb-1 text-xs font-medium tabular-nums", d.value ? "text-ink" : "text-transparent")}>{fmt(d.value) || "0"}</span>
          <div className="w-full h-32 flex items-end">
            <div className="w-full rounded-t-md transition-all" style={{ height: `${d.value ? Math.max((d.value / max) * 100, 3) : 0}%`, background: color, opacity: d.value ? 1 : 0 }} />
          </div>
          <span className={cx("mt-1.5 text-faint tabular-nums truncate w-full text-center", compact ? "text-[12px]" : "text-xs")}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function Legend({ c, label, v }: { c: string; label: string; v: number }) {
  return <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: c }} /><span className="text-muted">{label}</span> <b className="text-ink tabular-nums">{v}</b></span>;
}

function Insight({ title, text }: { title: string; text: string }) {
  return (
    <div className="card-2 p-3">
      <p className="text-sm font-semibold text-ink">{title}</p>
      <p className="text-xs text-muted mt-0.5">{text}</p>
    </div>
  );
}
