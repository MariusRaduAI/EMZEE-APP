"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/common";
import { Icon } from "@/components/ui";
import { Client } from "@/lib/types";
import { cx, fmtDate, initials } from "@/lib/utils";

const LS_FORMS = "emzee_forms_v1";

function firstNames(couple: string): string {
  // „Alexandra & George Popescu” -> „Alexandra & George”
  const noFamily = couple.replace(/\s+\S+$/, (m) => (couple.includes("&") ? "" : m));
  return (noFamily || couple).trim();
}

function addDays(iso: string, days: number): string {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function FollowupPage() {
  const { db, saveTask } = useStore();
  const [feedbackUrl, setFeedbackUrl] = useState("");
  const [reviewUrl, setReviewUrl] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_FORMS);
      if (raw) { const o = JSON.parse(raw); setFeedbackUrl(o.feedbackUrl || ""); setReviewUrl(o.reviewUrl || ""); }
    } catch {}
  }, []);
  const persist = (fb: string, rv: string) => { try { localStorage.setItem(LS_FORMS, JSON.stringify({ feedbackUrl: fb, reviewUrl: rv })); } catch {} };

  const todayISO = new Date().toISOString().slice(0, 10);
  const withDate = db.clients.filter((c) => c.event_date);
  const past = useMemo(() => withDate.filter((c) => c.event_date < todayISO).sort((a, b) => b.event_date.localeCompare(a.event_date)), [withDate, todayISO]);
  const upcoming = useMemo(() => withDate.filter((c) => c.event_date >= todayISO).sort((a, b) => a.event_date.localeCompare(b.event_date)), [withDate, todayISO]);

  return (
    <div className="fade-in">
      <PageHeader title="Follow-up & Recenzii" subtitle="Trimite formulare de feedback după eveniment și strânge recenzii — mesaje gata de copiat, fără trimitere automată." icon={<Icon.send />} />

      {/* Config formulare */}
      <div className="card p-5 mb-6">
        <h3 className="section-title mb-1">Linkurile tale de formular</h3>
        <p className="text-sm text-muted mb-4">Lipește aici link-urile Google Forms (sau orice formular). Se folosesc automat în mesaje.</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Formular feedback</label>
            <input className="input" value={feedbackUrl} onChange={(e) => { setFeedbackUrl(e.target.value); persist(e.target.value, reviewUrl); }} placeholder="https://forms.gle/..." />
          </div>
          <div>
            <label className="label">Formular recenzie / testimonial</label>
            <input className="input" value={reviewUrl} onChange={(e) => { setReviewUrl(e.target.value); persist(feedbackUrl, e.target.value); }} placeholder="https://g.page/r/... sau forms.gle/..." />
          </div>
        </div>
      </div>

      {past.length > 0 && (
        <section className="mb-8">
          <h3 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">De trimis feedback · evenimente trecute ({past.length})</h3>
          <div className="space-y-3">{past.map((c) => <EventFollowup key={c.id} c={c} feedbackUrl={feedbackUrl} reviewUrl={reviewUrl} tasks={db.tasks} saveTask={saveTask} phase="past" />)}</div>
        </section>
      )}

      {upcoming.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">Ce urmează ({upcoming.length})</h3>
          <div className="space-y-3">{upcoming.map((c) => <EventFollowup key={c.id} c={c} feedbackUrl={feedbackUrl} reviewUrl={reviewUrl} tasks={db.tasks} saveTask={saveTask} phase="upcoming" />)}</div>
        </section>
      )}

      {withDate.length === 0 && (
        <div className="card p-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-brand/12 border border-brand/25 flex items-center justify-center text-brand-soft mx-auto mb-3"><Icon.send /></div>
          <p className="font-semibold text-ink">Niciun eveniment cu dată</p>
          <p className="text-[15px] text-muted mt-1">Adaugă data evenimentului la clienți ca să programezi follow-up-ul.</p>
        </div>
      )}
    </div>
  );
}

function EventFollowup({ c, feedbackUrl, reviewUrl, tasks, saveTask, phase }: { c: Client; feedbackUrl: string; reviewUrl: string; tasks: any[]; saveTask: (t: any) => Promise<any>; phase: "past" | "upcoming" }) {
  const names = firstNames(c.couple);
  const defaultMsg = `Bună, ${names}! 💛\nSperăm că v-ați bucurat de eveniment. Ne-ar ajuta enorm un scurt feedback (2 minute):\n${feedbackUrl || "[adaugă link formular feedback]"}${reviewUrl ? `\n\nDacă v-a plăcut, o recenzie ar însemna mult pentru noi:\n${reviewUrl}` : ""}\n\nVă mulțumim și vă dorim numai bine!\n— EMZEE`;
  const [msg, setMsg] = useState(defaultMsg);
  useEffect(() => { setMsg(defaultMsg); /* re-seed când se schimbă linkurile */ }, [feedbackUrl, reviewUrl]); // eslint-disable-line react-hooks/exhaustive-deps
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  // Eveniment trecut → task azi; eveniment viitor → a doua zi după eveniment.
  const todayISO = new Date().toISOString().slice(0, 10);
  const followupDate = phase === "past" ? todayISO : addDays(c.event_date, 1);
  const existingTask = tasks.find((t) => t.client_id === c.id && t.kind === "todo" && (t.title || "").toLowerCase().includes("feedback"));

  const copy = async () => { try { await navigator.clipboard.writeText(msg); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch {} };
  const makeTask = async () => {
    await saveTask({ kind: "todo", title: `Trimite formular feedback către ${c.couple}`, client_id: c.id, date: followupDate, notes: "Follow-up — feedback & recenzie după eveniment.", done: false });
  };

  return (
    <div className="card p-4">
      <div className="flex items-center gap-3">
        <span className="w-10 h-10 rounded-xl bg-brand/12 border border-brand/25 flex items-center justify-center text-[13px] font-bold text-brand-soft shrink-0">{initials(c.couple).toUpperCase()}</span>
        <div className="min-w-0 flex-1">
          <Link href={`/clients/${c.id}`} className="font-semibold text-ink hover:text-brand-soft truncate block">{c.couple}</Link>
          <p className="text-xs text-muted truncate">{fmtDate(c.event_date)}{c.venue ? ` · ${c.venue}` : ""}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {existingTask ? (
            <span className="badge bg-green/15 text-green flex items-center gap-1"><Icon.check className="w-3.5 h-3.5" /> Task creat</span>
          ) : (
            <button className="btn !py-1.5" onClick={makeTask} title={`Creează task pentru ${fmtDate(followupDate)}`}><Icon.plus /> Task {phase === "past" ? "azi" : "post-eveniment"}</button>
          )}
          <button className="btn !py-1.5" onClick={() => setOpen((o) => !o)}><Icon.send /> Mesaj</button>
        </div>
      </div>

      {open && (
        <div className="mt-3 pt-3 border-t border-line">
          <textarea className="input min-h-[130px] resize-y text-sm" value={msg} onChange={(e) => setMsg(e.target.value)} />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-faint">{feedbackUrl ? "Link feedback inclus." : "⚠ Adaugă link-ul formularului mai sus."}</span>
            <button className="btn-brand !py-1.5" onClick={copy}><Icon.copy /> {copied ? "Copiat ✓" : "Copiază pentru WhatsApp"}</button>
          </div>
        </div>
      )}
    </div>
  );
}
