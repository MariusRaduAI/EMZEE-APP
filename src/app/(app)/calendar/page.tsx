"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/common";
import { Icon } from "@/components/ui";
import { cx, initials, money, fmtDate } from "@/lib/utils";

const MONTHS = ["Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie", "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie"];
const DOW = ["Lun", "Mar", "Mie", "Joi", "Vin", "Sâm", "Dum"];

export default function CalendarPage() {
  const { db } = useStore();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selected, setSelected] = useState<string | null>(null);

  const byDate = useMemo(() => {
    const m: Record<string, typeof db.clients> = {};
    db.clients.forEach((c) => { if (c.event_date) (m[c.event_date] ||= []).push(c); });
    return m;
  }, [db.clients]);

  const grid = useMemo(() => {
    const first = new Date(year, month, 1);
    const startDow = (first.getDay() + 6) % 7; // Monday=0
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (string | null)[] = [];
    for (let i = 0; i < startDow; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(`${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [year, month]);

  const todayISO = now.toISOString().slice(0, 10);
  const monthEvents = db.clients.filter((c) => c.event_date?.startsWith(`${year}-${String(month + 1).padStart(2, "0")}`)).sort((a, b) => a.event_date.localeCompare(b.event_date));
  const monthRevenue = monthEvents.reduce((s, c) => s + (c.fee || 0), 0);

  function shift(delta: number) {
    let m = month + delta, y = year;
    if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; }
    setMonth(m); setYear(y); setSelected(null);
  }

  const selectedEvents = selected ? byDate[selected] || [] : [];

  return (
    <div className="fade-in">
      <PageHeader title="Calendar" subtitle="Toate evenimentele tale, luna cu luna." icon={<Icon.calendar />}>
        <div className="flex items-center gap-1">
          <button className="btn !px-2.5" onClick={() => shift(-1)}><Icon.back /></button>
          <button className="btn" onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth()); }}>Azi</button>
          <button className="btn !px-2.5" onClick={() => shift(1)}><Icon.chevron /></button>
        </div>
      </PageHeader>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <div className="card p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">{MONTHS[month]} {year}</h2>
            <span className="text-sm text-muted">{monthEvents.length} evenimente · {money(monthRevenue, "RON")}</span>
          </div>
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {DOW.map((d) => <div key={d} className="text-center text-[11px] font-semibold text-faint uppercase py-1">{d}</div>)}
            {grid.map((iso, i) => {
              if (!iso) return <div key={i} />;
              const day = Number(iso.slice(-2));
              const events = byDate[iso] || [];
              const isToday = iso === todayISO;
              const isSel = iso === selected;
              return (
                <button key={iso} onClick={() => setSelected(iso === selected ? null : iso)}
                  className={cx("aspect-square sm:aspect-[4/5] rounded-lg border p-1.5 flex flex-col items-start text-left transition-colors relative overflow-hidden",
                    isSel ? "border-brand bg-brand/10" : events.length ? "border-line2 bg-panel2 hover:border-brand/40" : "border-line/60 hover:bg-panel2/60")}>
                  <span className={cx("text-xs font-medium tabular-nums", isToday ? "w-5 h-5 rounded-full bg-brand text-white flex items-center justify-center" : "text-muted")}>{day}</span>
                  <div className="mt-1 space-y-0.5 w-full">
                    {events.slice(0, 2).map((e) => (
                      <div key={e.id} className="text-[10px] leading-tight truncate px-1 py-0.5 rounded bg-brand/15 text-brand-soft font-medium">{e.couple}</div>
                    ))}
                    {events.length > 2 && <div className="text-[10px] text-faint px-1">+{events.length - 2}</div>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Side: selected day or month list */}
        <div className="card p-5">
          {selected ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">{fmtDate(selected)}</h3>
                <button className="btn-ghost !p-1.5" onClick={() => setSelected(null)}><Icon.close /></button>
              </div>
              {selectedEvents.length === 0 ? (
                <p className="text-sm text-muted">Niciun eveniment în această zi.</p>
              ) : (
                <div className="space-y-2">{selectedEvents.map((c) => <EventCard key={c.id} c={c} />)}</div>
              )}
            </>
          ) : (
            <>
              <h3 className="font-semibold mb-4">Evenimente în {MONTHS[month]}</h3>
              {monthEvents.length === 0 ? (
                <p className="text-sm text-muted">Nicio nuntă luna aceasta.</p>
              ) : (
                <div className="space-y-2">{monthEvents.map((c) => <EventCard key={c.id} c={c} />)}</div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function EventCard({ c }: { c: any }) {
  return (
    <Link href={`/clients/${c.id}`} className="flex items-center gap-3 p-2.5 rounded-lg border border-line hover:border-brand/40 hover:bg-panel2 transition-colors">
      <span className="w-9 h-9 rounded-lg bg-brand/12 border border-brand/25 flex items-center justify-center text-[11px] font-bold text-brand-soft shrink-0">{initials(c.couple).toUpperCase()}</span>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-ink text-sm truncate">{c.couple}</p>
        <p className="text-xs text-muted truncate">{c.venue || c.city || "—"}</p>
      </div>
      <div className="flex flex-col items-end gap-1">
        <div className="flex gap-1">
          {c.svc_mc && <span title="MC" className="w-2 h-2 rounded-full bg-brand" />}
          {c.svc_flowers && <span title="Flori" className="w-2 h-2 rounded-full bg-rose" />}
          {c.svc_games && <span title="Jocuri" className="w-2 h-2 rounded-full bg-green" />}
        </div>
        <span className="text-xs text-faint tabular-nums">{money(c.fee, c.currency)}</span>
      </div>
    </Link>
  );
}
