"use client";

import React, { useEffect } from "react";
import { cx } from "@/lib/utils";

/* ---------------- Icons (inline SVG, no deps) ---------------- */
type IconProps = { className?: string };
const S = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={cx("w-[18px] h-[18px]", className)}>{children}</svg>
);
export const Icon = {
  dashboard: (p: IconProps) => <S {...p}><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></S>,
  calendar: (p: IconProps) => <S {...p}><rect x="3" y="4.5" width="18" height="16" rx="2.5" /><path d="M3 9h18M8 2.5v4M16 2.5v4" /></S>,
  users: (p: IconProps) => <S {...p}><circle cx="9" cy="8" r="3.2" /><path d="M3.5 20a5.5 5.5 0 0 1 11 0M16 5.5a3 3 0 0 1 0 5.8M20.5 20a5.2 5.2 0 0 0-3.5-4.9" /></S>,
  games: (p: IconProps) => <S {...p}><rect x="2.5" y="6.5" width="19" height="11" rx="3.5" /><path d="M7 11v3M5.5 12.5h3M15.5 12h.01M18 14h.01M17 10.5h.01" /></S>,
  clock: (p: IconProps) => <S {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7.5V12l3 2" /></S>,
  check: (p: IconProps) => <S {...p}><path d="M20 6.5 9.5 17.5 4 12" /></S>,
  heart: (p: IconProps) => <S {...p}><path d="M12 20s-7-4.35-9.2-8.5C1.3 8.6 2.6 5.5 5.8 5.5c2 0 3.2 1.3 4.2 2.6 1-1.3 2.2-2.6 4.2-2.6 3.2 0 4.5 3.1 3 6C19 15.65 12 20 12 20Z" /></S>,
  offer: (p: IconProps) => <S {...p}><path d="M4 4h11l5 5v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" /><path d="M8 12h8M8 16h6M8 8h3" /></S>,
  box: (p: IconProps) => <S {...p}><path d="m12 2.5 8.5 4.5v10L12 21.5 3.5 17V7Z" /><path d="M3.7 7 12 11.5 20.3 7M12 11.5V21" /></S>,
  building: (p: IconProps) => <S {...p}><rect x="4" y="3" width="16" height="18" rx="1.5" /><path d="M8 7h.01M12 7h.01M16 7h.01M8 11h.01M12 11h.01M16 11h.01M8 15h.01M16 15h.01M10 21v-3.5h4V21" /></S>,
  plus: (p: IconProps) => <S {...p}><path d="M12 5v14M5 12h14" /></S>,
  search: (p: IconProps) => <S {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" /></S>,
  trash: (p: IconProps) => <S {...p}><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13M10 11v6M14 11v6" /></S>,
  edit: (p: IconProps) => <S {...p}><path d="M4 20h4L18.5 9.5a2 2 0 0 0 0-2.8l-1.2-1.2a2 2 0 0 0-2.8 0L4 16v4Z" /></S>,
  close: (p: IconProps) => <S {...p}><path d="M6 6l12 12M18 6 6 18" /></S>,
  chevron: (p: IconProps) => <S {...p}><path d="m9 6 6 6-6 6" /></S>,
  back: (p: IconProps) => <S {...p}><path d="M15 6 9 12l6 6" /></S>,
  download: (p: IconProps) => <S {...p}><path d="M12 3v12m0 0 4-4m-4 4-4-4M4 19h16" /></S>,
  print: (p: IconProps) => <S {...p}><path d="M6 9V3h12v6M6 18H4a1 1 0 0 1-1-1v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5a1 1 0 0 1-1 1h-2M7 14h10v7H7z" /></S>,
  grip: (p: IconProps) => <S {...p}><circle cx="9" cy="6" r="1" /><circle cx="15" cy="6" r="1" /><circle cx="9" cy="12" r="1" /><circle cx="15" cy="12" r="1" /><circle cx="9" cy="18" r="1" /><circle cx="15" cy="18" r="1" /></S>,
  logout: (p: IconProps) => <S {...p}><path d="M15 4h3a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-3M10 12H3m0 0 3.5-3.5M3 12l3.5 3.5" /></S>,
  spark: (p: IconProps) => <S {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" /></S>,
  flower: (p: IconProps) => <S {...p}><circle cx="12" cy="12" r="2.5" /><path d="M12 9.5c0-3 3.5-3 3.5 0M12 14.5c0 3-3.5 3-3.5 0M9.5 12c-3 0-3-3.5 0-3.5M14.5 12c3 0 3 3.5 0 3.5" /></S>,
  mic: (p: IconProps) => <S {...p}><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M6 11a6 6 0 0 0 12 0M12 17v4M9 21h6" /></S>,
  filter: (p: IconProps) => <S {...p}><path d="M3 5h18l-7 8v6l-4-2v-4Z" /></S>,
  copy: (p: IconProps) => <S {...p}><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M4 16V5a1 1 0 0 1 1-1h11" /></S>,
  chart: (p: IconProps) => <S {...p}><path d="M4 20V4M4 20h16M8 20v-6M12 20V9M16 20v-9M20 20V6" /></S>,
};

/* ---------------- Modal ---------------- */
export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title?: string; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", h); document.body.style.overflow = ""; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-8 overflow-y-auto no-print" onMouseDown={onClose}>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
      <div className={cx("relative card w-full my-4 fade-in", wide ? "max-w-3xl" : "max-w-lg")} onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <h3 className="font-semibold text-ink">{title}</h3>
          <button className="btn-ghost !p-1.5" onClick={onClose}><Icon.close /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

/* ---------------- Confirm ---------------- */
export function useConfirm() {
  const [state, setState] = React.useState<{ msg: string; resolve: (v: boolean) => void } | null>(null);
  const confirm = (msg: string) => new Promise<boolean>((resolve) => setState({ msg, resolve }));
  const node = state ? (
    <Modal open onClose={() => { state.resolve(false); setState(null); }} title="Confirmare">
      <p className="text-sm text-muted mb-5">{state.msg}</p>
      <div className="flex justify-end gap-2">
        <button className="btn" onClick={() => { state.resolve(false); setState(null); }}>Anulează</button>
        <button className="btn-danger" onClick={() => { state.resolve(true); setState(null); }}>Șterge</button>
      </div>
    </Modal>
  ) : null;
  return { confirm, node };
}

/* ---------------- Empty ---------------- */
export function Empty({ icon, title, hint, action }: { icon?: React.ReactNode; title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="card p-10 flex flex-col items-center text-center gap-3">
      <div className="w-12 h-12 rounded-xl bg-panel2 border border-line flex items-center justify-center text-faint">{icon}</div>
      <div>
        <p className="font-semibold text-ink">{title}</p>
        {hint && <p className="text-sm text-muted mt-1 max-w-sm">{hint}</p>}
      </div>
      {action}
    </div>
  );
}

/* ---------------- Toggle ---------------- */
export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="flex items-center gap-2.5 text-sm text-ink select-none">
      <span className={cx("w-9 h-5 rounded-full transition-colors relative shrink-0", checked ? "bg-brand" : "bg-line2")}>
        <span className={cx("absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all", checked ? "left-[18px]" : "left-0.5")} />
      </span>
      {label && <span>{label}</span>}
    </button>
  );
}

/* ---------------- StatusBadge ---------------- */
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    lead: "bg-amber/15 text-amber",
    confirmat: "bg-green/15 text-green",
    finalizat: "bg-brand/15 text-brand-soft",
  };
  const label: Record<string, string> = { lead: "Lead", confirmat: "Confirmat", finalizat: "Finalizat" };
  return <span className={cx("badge", map[status] || "bg-panel2 text-muted")}>{label[status] || status}</span>;
}
