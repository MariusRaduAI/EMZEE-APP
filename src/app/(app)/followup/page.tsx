"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/common";
import { Icon } from "@/components/ui";
import { Client } from "@/lib/types";
import { cx, fmtDate, initials } from "@/lib/utils";

const LS_FORMS = "emzee_forms_v1";
const LS_STATUS = "emzee_followup_status_v1";

type Status = { google?: boolean; feedback?: boolean };
type StatusMap = Record<string, Status>;

export default function FollowupPage() {
  const { db } = useStore();
  const [feedbackUrl, setFeedbackUrl] = useState("");
  const [reviewUrl, setReviewUrl] = useState("");
  const [status, setStatus] = useState<StatusMap>({});

  useEffect(() => {
    try {
      const f = localStorage.getItem(LS_FORMS);
      if (f) { const o = JSON.parse(f); setFeedbackUrl(o.feedbackUrl || ""); setReviewUrl(o.reviewUrl || ""); }
      const s = localStorage.getItem(LS_STATUS);
      if (s) setStatus(JSON.parse(s) || {});
    } catch {}
  }, []);

  const persistForms = (fb: string, rv: string) => { try { localStorage.setItem(LS_FORMS, JSON.stringify({ feedbackUrl: fb, reviewUrl: rv })); } catch {} };
  const toggle = (clientId: string, key: keyof Status) => {
    setStatus((prev) => {
      const next = { ...prev, [clientId]: { ...prev[clientId], [key]: !prev[clientId]?.[key] } };
      try { localStorage.setItem(LS_STATUS, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const todayISO = new Date().toISOString().slice(0, 10);
  const withDate = db.clients.filter((c) => c.event_date);
  const past = useMemo(() => withDate.filter((c) => c.event_date < todayISO).sort((a, b) => b.event_date.localeCompare(a.event_date)), [withDate, todayISO]);
  const upcoming = useMemo(() => withDate.filter((c) => c.event_date >= todayISO).sort((a, b) => a.event_date.localeCompare(b.event_date)), [withDate, todayISO]);

  const googleDone = past.filter((c) => status[c.id]?.google).length;
  const feedbackDone = past.filter((c) => status[c.id]?.feedback).length;

  return (
    <div className="fade-in">
      <PageHeader title="Follow-up & Recenzii" subtitle="Bifează pentru fiecare eveniment ce ai obținut: recenzie Google și feedback / testimonial." icon={<Icon.send />} />

      {/* Linkuri formulare (opțional, pentru acces rapid) */}
      <div className="card p-5 mb-6">
        <h3 className="section-title mb-1">Linkurile tale (opțional)</h3>
        <p className="text-sm text-muted mb-4">Ține la îndemână formularul de feedback și pagina de recenzie Google. Le deschizi cu un click când le trimiți clienților.</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Formular feedback / testimonial</label>
            <div className="flex gap-2">
              <input className="input" value={feedbackUrl} onChange={(e) => { setFeedbackUrl(e.target.value); persistForms(e.target.value, reviewUrl); }} placeholder="https://forms.gle/..." />
              {feedbackUrl && <a className="btn shrink-0" href={feedbackUrl} target="_blank" rel="noreferrer">Deschide</a>}
            </div>
          </div>
          <div>
            <label className="label">Recenzie Google</label>
            <div className="flex gap-2">
              <input className="input" value={reviewUrl} onChange={(e) => { setReviewUrl(e.target.value); persistForms(feedbackUrl, e.target.value); }} placeholder="https://g.page/r/..." />
              {reviewUrl && <a className="btn shrink-0" href={reviewUrl} target="_blank" rel="noreferrer">Deschide</a>}
            </div>
          </div>
        </div>
      </div>

      {/* Sumar */}
      {past.length > 0 && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="stat">
            <span className="text-xs text-muted">Recenzii Google</span>
            <p className="text-2xl font-bold tracking-tight text-green">{googleDone}<span className="text-lg text-faint">/{past.length}</span></p>
            <p className="text-xs text-faint">din evenimentele trecute</p>
          </div>
          <div className="stat">
            <span className="text-xs text-muted">Feedback / testimonial</span>
            <p className="text-2xl font-bold tracking-tight text-brand-soft">{feedbackDone}<span className="text-lg text-faint">/{past.length}</span></p>
            <p className="text-xs text-faint">din evenimentele trecute</p>
          </div>
        </div>
      )}

      {past.length > 0 && (
        <section className="mb-8">
          <h3 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">Evenimente trecute ({past.length})</h3>
          <div className="space-y-2.5">{past.map((c) => <EventRow key={c.id} c={c} st={status[c.id]} onToggle={toggle} />)}</div>
        </section>
      )}

      {upcoming.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">Ce urmează ({upcoming.length})</h3>
          <div className="space-y-2.5">{upcoming.map((c) => <EventRow key={c.id} c={c} st={status[c.id]} onToggle={toggle} />)}</div>
        </section>
      )}

      {withDate.length === 0 && (
        <div className="card p-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-brand/12 border border-brand/25 flex items-center justify-center text-brand-soft mx-auto mb-3"><Icon.send /></div>
          <p className="font-semibold text-ink">Niciun eveniment cu dată</p>
          <p className="text-[15px] text-muted mt-1">Adaugă data evenimentului la clienți ca să le poți bifa aici.</p>
        </div>
      )}
    </div>
  );
}

function EventRow({ c, st, onToggle }: { c: Client; st?: Status; onToggle: (id: string, k: keyof Status) => void }) {
  return (
    <div className="card p-3.5 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <span className="w-10 h-10 rounded-xl bg-brand/12 border border-brand/25 flex items-center justify-center text-[13px] font-bold text-brand-soft shrink-0">{initials(c.couple).toUpperCase()}</span>
        <div className="min-w-0">
          <Link href={`/clients/${c.id}`} className="font-semibold text-ink hover:text-brand-soft truncate block">{c.couple}</Link>
          <p className="text-xs text-muted truncate">{fmtDate(c.event_date)}{c.venue ? ` · ${c.venue}` : ""}</p>
        </div>
      </div>
      <div className="flex gap-2 shrink-0">
        <CheckBox label="Recenzie Google" checked={!!st?.google} accent="green" onClick={() => onToggle(c.id, "google")} />
        <CheckBox label="Feedback / testimonial" checked={!!st?.feedback} accent="brand" onClick={() => onToggle(c.id, "feedback")} />
      </div>
    </div>
  );
}

function CheckBox({ label, checked, accent, onClick }: { label: string; checked: boolean; accent: "green" | "brand"; onClick: () => void }) {
  const on = accent === "green"
    ? "border-green/50 bg-green/12 text-green"
    : "border-brand/50 bg-brand/12 text-brand-soft";
  return (
    <button type="button" onClick={onClick} aria-pressed={checked}
      className={cx("flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors select-none",
        checked ? on : "border-line text-muted hover:text-ink hover:border-line2")}>
      <span className={cx("w-[18px] h-[18px] rounded-[5px] border flex items-center justify-center shrink-0 transition-colors",
        checked ? (accent === "green" ? "bg-green border-green text-white" : "bg-brand border-brand text-white") : "border-line2")}>
        {checked && <Icon.check className="w-3 h-3" />}
      </span>
      {label}
    </button>
  );
}
