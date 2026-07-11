"use client";

import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { Icon } from "./ui";
import { cx } from "@/lib/utils";

type Field = { k: string; label: string; type: "text" | "time" | "number" | "yesno" | "textarea"; hint?: string };
type Section = { title: string; icon?: keyof typeof Icon; fields: Field[] };

const SCHEMA: Section[] = [
  { title: "Miri & locație", fields: [
    { k: "nume_mireasa", label: "Nume mireasă", type: "text" },
    { k: "nume_mire", label: "Nume mire", type: "text" },
    { k: "nume_familie", label: "Nume familie", type: "text" },
    { k: "locatie_salon", label: "Locație salon", type: "text" },
    { k: "denumire_salon", label: "Denumire salon", type: "text" },
    { k: "data_eveniment", label: "Data eveniment", type: "text" },
  ]},
  { title: "Orar cheie", fields: [
    { k: "ora_apus", label: "Ora apus soare", type: "time", hint: "pentru pozele cu toți invitații" },
    { k: "ora_intrare_invitati", label: "Ora intrare invitați", type: "time" },
    { k: "ora_intrare_miri", label: "Ora intrare miri", type: "time" },
    { k: "ora_aperitiv", label: "Ora aperitiv", type: "time" },
    { k: "ora_candybar", label: "Ora deschidere candy-bar", type: "time" },
    { k: "ora_fel1", label: "Ora fel 1", type: "time" },
    { k: "ora_fel2", label: "Ora fel 2", type: "time" },
    { k: "ora_tort", label: "Ora tort", type: "time" },
    { k: "ora_inchidere", label: "Ora închidere", type: "time" },
  ]},
  { title: "Ceremonie religioasă", fields: [
    { k: "cerem_aceeasi_zi", label: "Are loc în aceeași zi?", type: "yesno" },
    { k: "cerem_start", label: "Ora start ceremonie", type: "time" },
    { k: "cerem_end", label: "Ora închidere ceremonie", type: "time" },
    { k: "cerem_locatie", label: "Locația ceremoniei", type: "text" },
  ]},
  { title: "Invitați", fields: [
    { k: "nr_invitati", label: "Număr invitați (estimativ)", type: "number" },
    { k: "varsta_medie", label: "Vârsta medie invitați", type: "number" },
    { k: "dom_cav", label: "Domnișoare și cavaleri de onoare?", type: "yesno" },
    { k: "nr_perechi", label: "Câte perechi?", type: "number" },
    { k: "nasi_prezidiu", label: "Nașii stau la prezidiu?", type: "yesno" },
    { k: "nume_nasi", label: "Numele nașilor", type: "text" },
  ]},
  { title: "Contacte & echipă", fields: [
    { k: "contact_urgente_nume", label: "Contact urgențe — nume", type: "text" },
    { k: "contact_urgente_tel", label: "Contact urgențe — telefon", type: "text" },
    { k: "fotograf", label: "Nume fotograf/i", type: "text" },
    { k: "videograf", label: "Nume videograf/i", type: "text" },
    { k: "sunetist", label: "Nume sunetist", type: "text" },
    { k: "event_planner", label: "Nume event planner", type: "text" },
    { k: "sef_sala", label: "Șef de sală", type: "text" },
    { k: "hostess", label: "Hostess", type: "text" },
  ]},
  { title: "Tehnic", fields: [
    { k: "has_sunetist", label: "Există sunetist?", type: "yesno" },
    { k: "has_mic", label: "Microfon wireless?", type: "yesno" },
    { k: "has_playlist", label: "Playlist muzică de fundal?", type: "yesno" },
    { k: "has_proiector", label: "Videoproiector?", type: "yesno" },
    { k: "has_wifi", label: "WIFI la locație?", type: "yesno" },
    { k: "band", label: "Band-uri (membri & instrumente)", type: "textarea" },
  ]},
  { title: "Momente speciale", fields: [
    { k: "intampinare", label: "Persoane care întâmpină invitații?", type: "yesno" },
    { k: "alte_momente", label: "Alte momente (artificii, toast-uri, dansul mirilor)", type: "textarea" },
    { k: "aruncare_buchet", label: "Aruncarea buchetului/papionului?", type: "yesno" },
    { k: "pastrare_buchet", label: "Păstrarea buchetului/papionului?", type: "yesno" },
    { k: "photobooth", label: "Există photobooth?", type: "yesno" },
    { k: "photobooth_ore", label: "Interval photobooth", type: "text" },
  ]},
  { title: "Jocuri, băuturi & buget", fields: [
    { k: "preferinte_jocuri", label: "Preferințe jocuri (ex. jocul cu pantofii)", type: "textarea" },
    { k: "bauturi", label: "Băuturi disponibile pentru invitați", type: "textarea" },
    { k: "buget_moderare", label: "Buget estimativ moderare", type: "text" },
    { k: "buget_jocuri", label: "Buget estimativ jocuri/premii", type: "text" },
    { k: "alte_detalii", label: "Alte detalii de menționat", type: "textarea" },
  ]},
];

const ALL_FIELDS = SCHEMA.flatMap((s) => s.fields);

export function ChecklistForm({ clientId }: { clientId: string }) {
  const { db, saveChecklist } = useStore();
  const stored = db.checklists[clientId] || {};
  const [data, setData] = useState<Record<string, unknown>>(stored);
  const [dirty, setDirty] = useState(false);
  const [savedTick, setSavedTick] = useState(false);

  useEffect(() => { setData(db.checklists[clientId] || {}); setDirty(false); }, [clientId, db.checklists]);

  const set = (k: string, v: unknown) => { setData((p) => ({ ...p, [k]: v })); setDirty(true); setSavedTick(false); };
  const save = () => { saveChecklist(clientId, data); setDirty(false); setSavedTick(true); };

  const filled = useMemo(() => ALL_FIELDS.filter((f) => { const v = data[f.k]; return v !== undefined && v !== "" && v !== null; }).length, [data]);
  const pct = Math.round((filled / ALL_FIELDS.length) * 100);

  return (
    <div>
      <div className="no-print sticky top-0 z-10 -mx-1 mb-4 flex items-center gap-4 bg-panel/80 backdrop-blur px-1 py-2 rounded-lg">
        <div className="flex-1">
          <div className="flex items-center justify-between text-xs text-muted mb-1"><span>Completat</span><span className="tabular-nums">{filled}/{ALL_FIELDS.length} · {pct}%</span></div>
          <div className="h-1.5 rounded-full bg-panel2 overflow-hidden"><div className="h-full bg-gradient-to-r from-brand to-teal transition-all" style={{ width: `${pct}%` }} /></div>
        </div>
        <button className="btn" onClick={() => window.print()}><Icon.print /> PDF</button>
        <button className={cx("btn-brand", !dirty && "opacity-60")} onClick={save}><Icon.check /> {dirty ? "Salvează" : savedTick ? "Salvat ✓" : "Salvat"}</button>
      </div>

      <div className="space-y-5">
        {SCHEMA.map((section) => (
          <div key={section.title} className="card p-5">
            <h3 className="section-title mb-4">{section.title}</h3>
            <div className="grid sm:grid-cols-2 gap-x-5 gap-y-4">
              {section.fields.map((f) => (
                <div key={f.k} className={cx(f.type === "textarea" && "sm:col-span-2")}>
                  <label className="label">{f.label}{f.hint && <span className="text-faint font-normal ml-1">· {f.hint}</span>}</label>
                  <FieldInput field={f} value={data[f.k]} onChange={(v) => set(f.k, v)} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <PrintChecklist data={data} />
    </div>
  );
}

function FieldInput({ field, value, onChange }: { field: Field; value: unknown; onChange: (v: unknown) => void }) {
  if (field.type === "yesno") {
    return (
      <div className="flex gap-2">
        {["DA", "NU"].map((opt) => (
          <button key={opt} type="button" onClick={() => onChange(value === opt ? "" : opt)}
            className={cx("flex-1 py-2 rounded-lg text-sm font-medium border transition-colors",
              value === opt ? (opt === "DA" ? "bg-green/15 border-green/40 text-green" : "bg-rose/15 border-rose/40 text-rose") : "border-line text-muted hover:text-ink")}>
            {opt}
          </button>
        ))}
      </div>
    );
  }
  if (field.type === "textarea") return <textarea className="input min-h-[70px] resize-y" value={(value as string) || ""} onChange={(e) => onChange(e.target.value)} />;
  return <input className="input" type={field.type === "number" ? "number" : field.type === "time" ? "time" : "text"} value={(value as string) || ""} onChange={(e) => onChange(e.target.value)} />;
}

function PrintChecklist({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="print-only" style={{ color: "#111" }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, borderBottom: "3px solid #6d6bff", paddingBottom: 10, marginBottom: 16 }}>Event Checklist</h1>
      {SCHEMA.map((s) => (
        <div key={s.title} style={{ marginBottom: 14, pageBreakInside: "avoid" }}>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "#6d6bff", marginBottom: 6 }}>{s.title}</div>
          <table style={{ width: "100%", fontSize: 12.5 }}>
            <tbody>
              {s.fields.map((f) => (
                <tr key={f.k}>
                  <td style={{ padding: "3px 8px 3px 0", color: "#666", width: "45%" }}>{f.label}</td>
                  <td style={{ padding: "3px 0", fontWeight: 600 }}>{(data[f.k] as string) || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
