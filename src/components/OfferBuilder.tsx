"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { Icon, useConfirm } from "./ui";
import { Offer, OfferItem } from "@/lib/types";
import { uid, money, fmtDate, cx, downloadCSV } from "@/lib/utils";

const CATS = ["MC", "Program", "Jocuri", "Flori", "Rentals", "Kids", "Corporate", "Altele"];

const PACKAGES: { name: string; items: Omit<OfferItem, "id">[] }[] = [
  { name: "Experience Compact", items: [
    { category: "MC", description: "Moderare profesionistă & flow management", qty: 1, unit_price: 800 },
    { category: "Jocuri", description: "2-3 momente interactive personalizate", qty: 1, unit_price: 0 },
  ]},
  { name: "Experience Full", items: [
    { category: "MC", description: "Moderare profesionistă & coordonare completă", qty: 1, unit_price: 1500 },
    { category: "Program", description: "Program complet pe intervale de 15 min + recap", qty: 1, unit_price: 0 },
    { category: "Jocuri", description: "4+ jocuri personalizate + sistem de premii", qty: 1, unit_price: 0 },
  ]},
  { name: "Flowers Experience", items: [
    { category: "Flori", description: "Decor floral (flori naturale) — setup mese & prezidiu", qty: 1, unit_price: 1500 },
    { category: "Flori", description: "Buchet mireasă + cocarde", qty: 1, unit_price: 0 },
  ]},
  { name: "Rentals — Pachet Basic", items: [
    { category: "Rentals", description: "Giant Jenga (1) + Tir cu arcul (2) + Cornhole (2)", qty: 1, unit_price: 500 },
  ]},
  { name: "Kids Experience", items: [
    { category: "Kids", description: "2 animatori + kit personalizat/copil + mini-jocuri", qty: 1, unit_price: 0 },
  ]},
];

export function OfferBuilder({ initial, onSaved }: { initial: Offer; onSaved?: (o: Offer) => void }) {
  const { saveOffer, deleteOffer, db } = useStore();
  const { confirm, node } = useConfirm();
  const [o, setO] = useState<Offer>(initial);
  const [dirty, setDirty] = useState(false);
  const set = (patch: Partial<Offer>) => { setO((p) => ({ ...p, ...patch })); setDirty(true); };

  const subtotal = useMemo(() => o.items.reduce((s, it) => s + it.qty * it.unit_price, 0), [o.items]);
  const discountVal = subtotal * (o.discount || 0) / 100;
  const total = subtotal - discountVal;

  const addItem = (preset?: Omit<OfferItem, "id">) => set({ items: [...o.items, { id: uid(), category: preset?.category || "Altele", description: preset?.description || "", qty: preset?.qty ?? 1, unit_price: preset?.unit_price ?? 0 }] });
  const addPackage = (pkg: typeof PACKAGES[number]) => set({ items: [...o.items, ...pkg.items.map((it) => ({ ...it, id: uid() }))] });
  const updItem = (id: string, patch: Partial<OfferItem>) => set({ items: o.items.map((it) => it.id === id ? { ...it, ...patch } : it) });
  const delItem = (id: string) => set({ items: o.items.filter((it) => it.id !== id) });

  const save = async () => { const saved = await saveOffer(o); setO(saved); setDirty(false); onSaved?.(saved); };
  function exportExcel() {
    downloadCSV(`oferta-${o.couple || "eveniment"}.csv`, [
      ["Categorie", "Descriere", "Cant.", "Preț unitar", "Total"],
      ...o.items.map((it) => [it.category, it.description, it.qty, it.unit_price, it.qty * it.unit_price]),
      [], ["", "", "", "Subtotal", subtotal], ["", "", "", `Discount ${o.discount}%`, -discountVal], ["", "", "", "TOTAL", total],
    ]);
  }

  return (
    <div>
      {node}
      <div className="no-print flex flex-wrap items-center justify-end gap-2 mb-4">
        {initial.id && db.offers.some((x) => x.id === initial.id) && (
          <button className="btn-danger mr-auto" onClick={async () => { if (await confirm("Ștergi această ofertă?")) { deleteOffer(o.id); onSaved?.(o); } }}><Icon.trash /> Șterge</button>
        )}
        <button className="btn" onClick={exportExcel}><Icon.download /> Excel</button>
        <button className="btn" onClick={() => window.print()}><Icon.print /> PDF</button>
        <button className={cx("btn-brand", !dirty && "opacity-60")} onClick={save}><Icon.check /> {dirty ? "Salvează" : "Salvat"}</button>
      </div>

      {/* Meta */}
      <div className="no-print card p-5 mb-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div><label className="label">Nume miri</label><input className="input" value={o.couple} onChange={(e) => set({ couple: e.target.value })} /></div>
        <div><label className="label">Data</label><input className="input" type="date" value={o.event_date} onChange={(e) => set({ event_date: e.target.value })} /></div>
        <div><label className="label">Locație</label><input className="input" value={o.venue} onChange={(e) => set({ venue: e.target.value })} /></div>
        <div><label className="label">Invitați</label><input className="input" type="number" value={o.guests ?? ""} onChange={(e) => set({ guests: e.target.value ? Number(e.target.value) : null })} /></div>
      </div>

      {/* Packages */}
      <div className="no-print mb-4">
        <label className="label">Adaugă rapid pachet</label>
        <div className="flex flex-wrap gap-2">
          {PACKAGES.map((p) => <button key={p.name} className="chip border-line text-muted hover:text-ink hover:border-brand/40" onClick={() => addPackage(p)}><Icon.plus className="w-3.5 h-3.5" /> {p.name}</button>)}
        </div>
      </div>

      {/* Items */}
      <div className="no-print card overflow-hidden mb-4">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead><tr className="border-b border-line">
              <th className="th w-32">Categorie</th><th className="th">Descriere</th><th className="th w-20">Cant.</th><th className="th w-28">Preț unit.</th><th className="th w-28 text-right">Total</th><th className="th w-10"></th>
            </tr></thead>
            <tbody className="divide-y divide-line/50">
              {o.items.map((it) => (
                <tr key={it.id}>
                  <td className="td"><select className="input !py-1.5" value={it.category} onChange={(e) => updItem(it.id, { category: e.target.value })}>{CATS.map((c) => <option key={c}>{c}</option>)}</select></td>
                  <td className="td"><input className="input !py-1.5" value={it.description} onChange={(e) => updItem(it.id, { description: e.target.value })} placeholder="Descriere serviciu" /></td>
                  <td className="td"><input className="input !py-1.5 !w-16" type="number" value={it.qty} onChange={(e) => updItem(it.id, { qty: Number(e.target.value) || 0 })} /></td>
                  <td className="td"><input className="input !py-1.5 !w-24" type="number" value={it.unit_price} onChange={(e) => updItem(it.id, { unit_price: Number(e.target.value) || 0 })} /></td>
                  <td className="td text-right font-medium tabular-nums">{money(it.qty * it.unit_price, o.currency)}</td>
                  <td className="td"><button className="btn-ghost !p-1.5 hover:!text-rose" onClick={() => delItem(it.id)}><Icon.trash /></button></td>
                </tr>
              ))}
              {o.items.length === 0 && <tr><td colSpan={6} className="td text-center text-muted py-8">Niciun serviciu. Adaugă un pachet sau o linie.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="p-3 border-t border-line"><button className="btn border-dashed w-full" onClick={() => addItem()}><Icon.plus /> Adaugă linie</button></div>
      </div>

      {/* Totals + notes */}
      <div className="no-print grid lg:grid-cols-2 gap-4">
        <div className="card p-5 space-y-3">
          <div><label className="label">Note</label><textarea className="input min-h-[70px] resize-y" value={o.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="Detalii personalizate pentru miri…" /></div>
          <div><label className="label">Termeni</label><textarea className="input min-h-[60px] resize-y" value={o.terms} onChange={(e) => set({ terms: e.target.value })} placeholder="Avans, valabilitate ofertă, condiții…" /></div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between py-2"><span className="text-muted">Subtotal</span><span className="font-medium tabular-nums">{money(subtotal, o.currency)}</span></div>
          <div className="flex items-center justify-between py-2 border-t border-line/60">
            <div className="flex items-center gap-2"><span className="text-muted">Discount</span><input className="input !py-1 !w-16" type="number" value={o.discount} onChange={(e) => set({ discount: Number(e.target.value) || 0 })} /><span className="text-muted">%</span></div>
            <span className="font-medium tabular-nums text-rose">−{money(discountVal, o.currency)}</span>
          </div>
          <div className="flex items-center justify-between py-3 border-t border-line mt-1">
            <span className="font-semibold text-lg">Total</span>
            <span className="font-bold text-2xl text-brand-soft tabular-nums">{money(total, o.currency)}</span>
          </div>
          <div className="flex items-center gap-2 mt-2"><span className="text-xs text-muted">Monedă</span><select className="input !py-1 !w-24" value={o.currency} onChange={(e) => set({ currency: e.target.value })}><option>EUR</option><option>RON</option></select></div>
        </div>
      </div>

      <PrintOffer o={o} subtotal={subtotal} discountVal={discountVal} total={total} />
    </div>
  );
}

function PrintOffer({ o, subtotal, discountVal, total }: { o: Offer; subtotal: number; discountVal: number; total: number }) {
  return (
    <div className="print-only" style={{ color: "#111" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "3px solid #6d6bff", paddingBottom: 14, marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 12, letterSpacing: 2, color: "#6d6bff", fontWeight: 700 }}>OFERTĂ WEDDING EXPERIENCE</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: "6px 0 2px" }}>{o.couple || "Eveniment"}</h1>
          <div style={{ fontSize: 13, color: "#555" }}>{o.event_date ? fmtDate(o.event_date) : ""}{o.venue ? ` · ${o.venue}` : ""}{o.guests ? ` · ${o.guests} invitați` : ""}</div>
        </div>
        <div style={{ textAlign: "right", fontWeight: 800, fontSize: 20 }}>EMZEE</div>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead><tr style={{ borderBottom: "1.5px solid #ddd", textAlign: "left" }}>
          <th style={{ padding: "8px 6px" }}>Serviciu</th><th style={{ padding: "8px 6px", width: 50 }}>Cant.</th><th style={{ padding: "8px 6px", width: 90, textAlign: "right" }}>Preț</th><th style={{ padding: "8px 6px", width: 90, textAlign: "right" }}>Total</th>
        </tr></thead>
        <tbody>
          {o.items.map((it) => (
            <tr key={it.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: "9px 6px" }}><b style={{ color: "#6d6bff", fontSize: 11 }}>{it.category}</b><div>{it.description}</div></td>
              <td style={{ padding: "9px 6px" }}>{it.qty}</td>
              <td style={{ padding: "9px 6px", textAlign: "right" }}>{money(it.unit_price, o.currency)}</td>
              <td style={{ padding: "9px 6px", textAlign: "right", fontWeight: 600 }}>{money(it.qty * it.unit_price, o.currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 14, marginLeft: "auto", width: 260 }}>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", color: "#555" }}><span>Subtotal</span><span>{money(subtotal, o.currency)}</span></div>
        {o.discount > 0 && <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", color: "#c0392b" }}><span>Discount {o.discount}%</span><span>−{money(discountVal, o.currency)}</span></div>}
        <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: "2px solid #111", marginTop: 4, fontWeight: 800, fontSize: 16 }}><span>TOTAL</span><span>{money(total, o.currency)}</span></div>
      </div>
      {o.notes && <div style={{ marginTop: 20, fontSize: 12.5 }}><b>Note:</b> {o.notes}</div>}
      {o.terms && <div style={{ marginTop: 8, fontSize: 12, color: "#666" }}><b>Termeni:</b> {o.terms}</div>}
      <div style={{ marginTop: 28, fontSize: 11, color: "#aaa", textAlign: "center" }}>EMZEE · Wedding & Event Experience</div>
    </div>
  );
}
