"use client";

import { useStore } from "@/lib/store";
import { Client } from "@/lib/types";
import { fmtDateShort } from "@/lib/utils";
import { Icon } from "./ui";

export function PageHeader({ title, subtitle, children, icon }: { title: string; subtitle?: string; children?: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div className="flex items-start gap-3">
        {icon && <div className="w-10 h-10 rounded-xl bg-brand/12 border border-brand/25 flex items-center justify-center text-brand-soft shrink-0">{icon}</div>}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">{title}</h1>
          {subtitle && <p className="text-muted text-sm mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {children && <div className="flex items-center gap-2 shrink-0">{children}</div>}
    </div>
  );
}

export function ClientSelect({ value, onChange, placeholder }: { value: string; onChange: (id: string) => void; placeholder?: string }) {
  const { db } = useStore();
  const sorted = [...db.clients].sort((a, b) => (a.event_date || "9999").localeCompare(b.event_date || "9999"));
  return (
    <select className="input max-w-xs" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{placeholder || "— Alege un client —"}</option>
      {sorted.map((c) => (
        <option key={c.id} value={c.id}>
          {c.couple}{c.event_date ? ` · ${fmtDateShort(c.event_date)}` : ""}
        </option>
      ))}
    </select>
  );
}

export function ClientChip({ client }: { client: Client }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-7 h-7 rounded-lg bg-brand/12 border border-brand/25 flex items-center justify-center text-[11px] font-bold text-brand-soft">
        {client.couple.slice(0, 2).toUpperCase()}
      </span>
      <span className="font-medium text-ink">{client.couple}</span>
      {client.event_date && <span className="text-faint">· {fmtDateShort(client.event_date)}</span>}
    </div>
  );
}

export function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-line/60 last:border-0">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-sm font-medium text-ink text-right">{value}</span>
    </div>
  );
}

export function EmptyPick({ label }: { label: string }) {
  return (
    <div className="card p-10 flex flex-col items-center text-center gap-2">
      <div className="w-11 h-11 rounded-xl bg-panel2 border border-line flex items-center justify-center text-faint"><Icon.users /></div>
      <p className="font-semibold text-ink">Alege un client</p>
      <p className="text-sm text-muted max-w-xs">{label}</p>
    </div>
  );
}
