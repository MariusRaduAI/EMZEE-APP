"use client";

import { PageHeader } from "@/components/common";
import { Icon } from "@/components/ui";

const PACKAGES = [
  { tier: "At Office", name: "Sesiune la birou", price: "799 €", dur: "2-3 ore", feats: ["2 activități / jocuri", "MC inclus", "Ideal team-dinner / after-work", "Raport post-eveniment"] },
  { tier: "Team-building", name: "Full-Day", price: "1.599 €", dur: "Full-Day", feats: ["3 activități", "MC inclus toată perioada", "Scavenger Hunt Urban", "Raport post-eveniment"], featured: true },
  { tier: "Team-building", name: "Program 3 zile", price: "8.000–10.000 €", dur: "3 zile", feats: ["Team-Building Session", "MC + facilitare", "Diagnostic + KPI mapping", "Raport complet"] },
];

const METHOD = ["Diagnostic — evaluări scurte cu managerii, analiza dinamicii", "Sesiuni MBTI", "Brainstorming metoda Walt Disney", "Team-board vizual cu plan de acțiune", "Suport dezvoltare procese & proceduri, mapare fluxuri, KPI", "Cele 5 disfuncții ale unei echipe (Lencioni)"];

const PROCESS = [
  { t: "Un apel", d: "Fără formulare de 3 pagini. Înțelegem echipa, obiectivul și energia grupului." },
  { t: "Propunere în 48h", d: "Concept personalizat (nu PDF generic): format, activități, logistică, buget." },
  { t: "Noi ne ocupăm de tot", d: "Materiale, locație dacă e cazul, echipă de animatori și arbitri." },
  { t: "Raport post-eveniment", d: "Fotografii, feedback colectat, observații despre dinamica echipei." },
];

export default function CorporatePage() {
  return (
    <div className="fade-in">
      <PageHeader title="Corporate" subtitle="Echipa ta merită mai mult decât un bowling." icon={<Icon.building />}>
        <span className="badge bg-amber/15 text-amber">În lucru</span>
      </PageHeader>

      <div className="card p-6 mb-6 relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-72 h-72 rounded-full bg-teal/10 blur-3xl" />
        <div className="relative">
          <p className="section-title mb-2">Metodologia EMZEE</p>
          <p className="text-lg text-ink max-w-2xl">HR vrea engagement, managerii vor coeziune, directorii vor să arate că le pasă de oameni. <b className="text-brand-soft">EMZEE este soluția.</b></p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
            {PROCESS.map((p, i) => (
              <div key={i} className="card-2 p-4">
                <span className="w-7 h-7 rounded-lg bg-brand/15 text-brand-soft flex items-center justify-center text-sm font-bold mb-2">{i + 1}</span>
                <p className="font-semibold text-ink text-sm">{p.t}</p>
                <p className="text-xs text-muted mt-1">{p.d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="section-title mb-3">Pachete</p>
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        {PACKAGES.map((p) => (
          <div key={p.name} className={cx2("card p-5 relative", p.featured && "border-brand/50 shadow-glow")}>
            {p.featured && <span className="absolute -top-2.5 left-5 badge bg-brand text-white">Recomandat</span>}
            <p className="text-xs text-faint uppercase tracking-wide">{p.tier}</p>
            <p className="font-bold text-lg text-ink mt-0.5">{p.name}</p>
            <p className="text-2xl font-black text-brand-soft mt-2">{p.price}</p>
            <p className="text-xs text-muted mb-4">{p.dur}</p>
            <ul className="space-y-2">
              {p.feats.map((f) => <li key={f} className="flex items-start gap-2 text-sm text-ink/90"><Icon.check className="w-4 h-4 text-green shrink-0 mt-0.5" />{f}</li>)}
            </ul>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <p className="section-title mb-3">Instrumente & activități</p>
          <div className="flex flex-wrap gap-2">
            {["Jocul cu prezentarea slide-urilor", "Jackbox — Drawful", "Scavenger hunt urban", "Blind Tent", "Board of Directors", "Startup Wars", "Kahoot — Istoria Firmei"].map((x) => (
              <span key={x} className="chip border-line text-muted cursor-default">{x}</span>
            ))}
          </div>
        </div>
        <div className="card p-5">
          <p className="section-title mb-3">Metodologie (deep-dive)</p>
          <ul className="space-y-2">
            {METHOD.map((m) => <li key={m} className="flex items-start gap-2 text-sm text-ink/90"><Icon.spark className="w-4 h-4 text-teal shrink-0 mt-0.5" />{m}</li>)}
          </ul>
        </div>
      </div>

      <div className="card p-5 mt-6 border-dashed">
        <p className="text-sm text-muted">🚧 Această secțiune e în dezvoltare. Pachetele și prețurile de mai sus sunt draft din planul tău de business și pot fi ajustate.</p>
      </div>
    </div>
  );
}

function cx2(...c: (string | false | undefined)[]) { return c.filter(Boolean).join(" "); }
