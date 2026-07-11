"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { Icon } from "./ui";
import { cx, downloadCSV } from "@/lib/utils";
import { exportFloralPDF } from "@/lib/pdf";

type F = Record<string, any>;

const STYLES = ["Elegant / Clasic", "Modern / Minimalist", "Romantic", "Rustic / Boho", "Luxury / Glam", "Natural / Grădină", "Vintage"];
const FLOWERS = ["Trandafiri", "Bujori", "Hortensii", "Lisianthus", "Eucalipt / verdeață", "Garoafe", "Lalele", "Orhidee", "Floarea-soarelui", "Frezii", "Gypsophila", "Ranunculus"];
const TABLE_STYLE = ["Vaze înalte", "Centerpiece jos", "Runner / alergător", "Minimalist", "Mix înalt + jos"];
const ARCH_SHAPE = ["Pătrată", "Triunghiulară", "Rotundă", "Asimetrică"];
const EXTRAS = ["Lumânări", "Petale", "Verdeață suspendată", "Aranjamente scaune", "Covor / intrare florală", "Photo corner"];

export function FloralForm({ clientId }: { clientId: string }) {
  const { db, saveFloral } = useStore();
  const client = db.clients.find((c) => c.id === clientId);
  const [d, setD] = useState<F>(db.florals[clientId] || {});
  const [dirty, setDirty] = useState(false);

  useEffect(() => { setD(db.florals[clientId] || {}); setDirty(false); }, [clientId, db.florals]);
  const set = (patch: F) => { setD((p) => ({ ...p, ...patch })); setDirty(true); };
  const toggle = (key: string, val: string) => { const a: string[] = d[key] || []; set({ [key]: a.includes(val) ? a.filter((x) => x !== val) : [...a, val] }); };
  const save = () => { saveFloral(clientId, d); setDirty(false); };

  function exportExcel() {
    downloadCSV(`flori-${client?.couple || "eveniment"}.csv`, [
      ["Câmp", "Valoare"],
      ["Miri", client?.couple || ""], ["Data", client?.event_date || ""],
      ["Stil", (d.styles || []).join(", ")], ["Culoare principală", d.main_color || ""], ["Culori accent", d.accent_colors || ""],
      ["Mood / cuvinte-cheie", d.mood || ""], ["Link inspirație", d.inspo || ""],
      ["Flori dorite", (d.flowers || []).join(", ")], ["De evitat", d.avoid || ""],
      ["Nr. mese", d.tables ?? ""], ["Aranjament mese", (d.table_style || []).join(", ")],
      ["Prezidiu", d.presidiu || ""], ["Arcadă", d.arch || ""], ["Formă arcadă", (d.arch_shape || []).join(", ")], ["Arcadă închiriere/full", d.arch_mode || ""],
      ["Buchet mireasă", d.bride_bouquet || ""], ["Buchet nașă", d.godmother_bouquet || ""], ["Brățară nașă", d.godmother_bracelet || ""],
      ["Cocarde", d.boutonnieres || ""], ["Decor ceremonie", d.ceremony || ""], ["Alte zone", d.other_areas || ""],
      ["Elemente extra", (d.extras || []).join(", ")], ["Buget flori", d.budget ?? ""],
      ["Reutilizare ceremonie→petrecere", d.reuse || ""], ["Locație & acces", d.access || ""], ["Note", d.notes || ""],
    ]);
  }

  const Chip = ({ list, val, on, color = "brand" }: { list: string; val: string; on: boolean; color?: string }) => (
    <button onClick={() => toggle(list, val)} className={cx("chip", on ? colorCls(color) : "border-line text-muted hover:text-ink")}>{val}</button>
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
        <p className="text-sm text-muted max-w-xl">Brief de discovery pentru aranjamentele florale — completează-l în întâlnirea cu mirii ca să știi exact ce livrezi și ce ofertezi.</p>
        <div className="flex gap-2">
          <button className="btn" onClick={exportExcel}><Icon.download /> Excel</button>
          <button className="btn" onClick={() => exportFloralPDF(client, d)}><Icon.download /> PDF</button>
          <button className={cx("btn-brand", !dirty && "opacity-60")} onClick={save}><Icon.check /> {dirty ? "Salvează" : "Salvat"}</button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Stil & viziune */}
        <div className="card p-5 space-y-4">
          <h3 className="section-title">Stil & viziune</h3>
          <div>
            <label className="label">Stil dorit</label>
            <div className="flex flex-wrap gap-1.5">{STYLES.map((s) => <Chip key={s} list="styles" val={s} on={(d.styles || []).includes(s)} />)}</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Culoare principală</label><input className="input" value={d.main_color || ""} onChange={(e) => set({ main_color: e.target.value })} placeholder="ex. alb + verde" /></div>
            <div><label className="label">Culori accent</label><input className="input" value={d.accent_colors || ""} onChange={(e) => set({ accent_colors: e.target.value })} placeholder="ex. burgundy, auriu" /></div>
          </div>
          <div><label className="label">Mood / cuvinte-cheie <span className="text-faint font-normal">· ce simțire vor</span></label><input className="input" value={d.mood || ""} onChange={(e) => set({ mood: e.target.value })} placeholder="ex. luminos, aerisit, romantic" /></div>
          <div><label className="label">Link inspirație <span className="text-faint font-normal">· Pinterest / Instagram</span></label><input className="input" value={d.inspo || ""} onChange={(e) => set({ inspo: e.target.value })} placeholder="lipește link-ul lor" /></div>
          <div>
            <label className="label">Flori dorite</label>
            <div className="flex flex-wrap gap-1.5">{FLOWERS.map((f) => <Chip key={f} list="flowers" val={f} on={(d.flowers || []).includes(f)} color="rose" />)}</div>
          </div>
          <div><label className="label">De evitat <span className="text-faint font-normal">· alergii, flori nedorite</span></label><input className="input" value={d.avoid || ""} onChange={(e) => set({ avoid: e.target.value })} placeholder="ex. crini, polen puternic" /></div>
        </div>

        {/* Elemente & cantități */}
        <div className="card p-5 space-y-4">
          <h3 className="section-title">Elemente & cantități</h3>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Nr. mese invitați</label><input className="input" type="number" value={d.tables ?? ""} onChange={(e) => set({ tables: numOrNull(e.target.value) })} placeholder="ex. 15" /></div>
            <div><label className="label">Buget flori (RON)</label><input className="input" type="number" value={d.budget ?? ""} onChange={(e) => set({ budget: numOrNull(e.target.value) })} placeholder="ex. 4000" /></div>
          </div>
          <div>
            <label className="label">Aranjament mese</label>
            <div className="flex flex-wrap gap-1.5">{TABLE_STYLE.map((s) => <Chip key={s} list="table_style" val={s} on={(d.table_style || []).includes(s)} color="teal" />)}</div>
          </div>
          <YesNoText label="Prezidiu" value={d.presidiu} onChange={(v) => set({ presidiu: v })} placeholder="detalii aranjament prezidiu" />
          <div>
            <YesNoText label="Arcadă" value={d.arch} onChange={(v) => set({ arch: v })} placeholder="detalii arcadă" />
            {(d.arch || "").startsWith("DA") && (
              <div className="mt-2 space-y-2 pl-1">
                <div className="flex flex-wrap gap-1.5">{ARCH_SHAPE.map((s) => <Chip key={s} list="arch_shape" val={s} on={(d.arch_shape || []).includes(s)} color="teal" />)}</div>
                <div className="flex gap-2">
                  {["Închiriere", "Full (cu flori)"].map((m) => <button key={m} onClick={() => set({ arch_mode: d.arch_mode === m ? "" : m })} className={cx("chip", d.arch_mode === m ? "bg-brand/15 border-brand/40 text-brand-soft" : "border-line text-muted")}>{m}</button>)}
                </div>
              </div>
            )}
          </div>
          <YesNoText label="Buchet mireasă" value={d.bride_bouquet} onChange={(v) => set({ bride_bouquet: v })} placeholder="stil buchet (cascadă, rotund, câmpenesc…)" />
          <div className="grid grid-cols-2 gap-3">
            <YesNo label="Buchet nașă" value={d.godmother_bouquet} onChange={(v) => set({ godmother_bouquet: v })} />
            <YesNo label="Brățară nașă" value={d.godmother_bracelet} onChange={(v) => set({ godmother_bracelet: v })} />
          </div>
          <div><label className="label">Cocarde <span className="text-faint font-normal">· miri, nași, cavaleri</span></label><input className="input" value={d.boutonnieres || ""} onChange={(e) => set({ boutonnieres: e.target.value })} placeholder="ex. 2 miri + 2 nași + 4 cavaleri" /></div>
          <YesNoText label="Decor ceremonie" value={d.ceremony} onChange={(v) => set({ ceremony: v })} placeholder="unde, ce anume" />
          <div><label className="label">Alte zone <span className="text-faint font-normal">· candy-bar, intrare, cort, scaune</span></label><input className="input" value={d.other_areas || ""} onChange={(e) => set({ other_areas: e.target.value })} /></div>
          <div>
            <label className="label">Elemente extra</label>
            <div className="flex flex-wrap gap-1.5">{EXTRAS.map((x) => <Chip key={x} list="extras" val={x} on={(d.extras || []).includes(x)} color="amber" />)}</div>
          </div>
        </div>

        {/* Logistică & note */}
        <div className="card p-5 space-y-4 lg:col-span-2">
          <h3 className="section-title">Logistică & note</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="label">Locație setup & oră acces</label><input className="input" value={d.access || ""} onChange={(e) => set({ access: e.target.value })} placeholder="ex. Lagoo Snagov, acces de la 10:00" /></div>
            <YesNo label="Reutilizare de la ceremonie la petrecere?" value={d.reuse} onChange={(v) => set({ reuse: v })} />
          </div>
          <div>
            <label className="label">Note libere <span className="text-faint font-normal">· dacă nu au un stil exact, scrie aici tot ce vor / referințe / detalii</span></label>
            <textarea className="input min-h-[110px] resize-y" value={d.notes || ""} onChange={(e) => set({ notes: e.target.value })} placeholder="Orice detaliu discutat: preferințe, restricții, obiecte la care țin, așteptări…" />
          </div>
        </div>
      </div>
    </div>
  );
}

function YesNo({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="flex gap-2">
        {["DA", "NU"].map((o) => <button key={o} onClick={() => onChange(value === o ? "" : o)} className={cx("flex-1 py-2 rounded-lg text-sm font-semibold border", value === o ? (o === "DA" ? "bg-green/15 border-green/40 text-green" : "bg-rose/15 border-rose/40 text-rose") : "border-line text-muted hover:text-ink")}>{o}</button>)}
      </div>
    </div>
  );
}

function YesNoText({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  const isDa = (value || "").startsWith("DA");
  const detail = isDa ? value.slice(2).trim() : "";
  return (
    <div>
      <label className="label">{label}</label>
      <div className="flex gap-2">
        {["DA", "NU"].map((o) => <button key={o} onClick={() => onChange(value?.startsWith(o) ? "" : (o === "DA" ? "DA " + detail : "NU"))} className={cx("px-4 py-2 rounded-lg text-sm font-semibold border", value?.startsWith(o) ? (o === "DA" ? "bg-green/15 border-green/40 text-green" : "bg-rose/15 border-rose/40 text-rose") : "border-line text-muted hover:text-ink")}>{o}</button>)}
        {isDa && <input className="input flex-1" value={detail} onChange={(e) => onChange("DA " + e.target.value)} placeholder={placeholder} />}
      </div>
    </div>
  );
}

function colorCls(color: string) {
  return color === "rose" ? "bg-rose/15 border-rose/40 text-rose"
    : color === "teal" ? "bg-teal/15 border-teal/40 text-teal"
    : color === "amber" ? "bg-amber/15 border-amber/40 text-amber"
    : "bg-brand/15 border-brand/40 text-brand-soft";
}
function numOrNull(v: string): number | null { return v ? Number(v) : null; }
