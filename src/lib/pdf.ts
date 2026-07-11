import { jsPDF } from "jspdf";
import { fmtDate, money } from "./utils";
import { ROBOTO_REGULAR, ROBOTO_BOLD } from "./robotoFont";

const FONT = "Roboto";
function registerFont(doc: jsPDF) {
  doc.addFileToVFS("Roboto-Regular.ttf", ROBOTO_REGULAR);
  doc.addFont("Roboto-Regular.ttf", FONT, "normal");
  doc.addFileToVFS("Roboto-Bold.ttf", ROBOTO_BOLD);
  doc.addFont("Roboto-Bold.ttf", FONT, "bold");
}

type RGB = [number, number, number];
const C = {
  brand: [91, 87, 240] as RGB,
  teal: [13, 148, 136] as RGB,
  green: [21, 147, 95] as RGB,
  amber: [180, 83, 9] as RGB,
  rose: [225, 29, 72] as RGB,
  slate: [100, 116, 139] as RGB,
  ink: [17, 23, 38] as RGB,
  muted: [82, 90, 110] as RGB,
  faint: [130, 138, 156] as RGB,
  track: [230, 233, 240] as RGB,
  white: [255, 255, 255] as RGB,
};

const PAGE_W = 210;
const PAGE_H = 297;
const M = 16; // margin
const CW = PAGE_W - M * 2; // content width

interface PdfCtx { doc: jsPDF; y: number; }

function nowStamp(): string {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}

function ensure(ctx: PdfCtx, need: number) {
  if (ctx.y + need > PAGE_H - 18) {
    footer(ctx.doc);
    ctx.doc.addPage();
    ctx.y = 20;
  }
}

function footer(doc: jsPDF) {
  doc.setFont(FONT, "normal");
  doc.setFontSize(8);
  doc.setTextColor(...C.faint);
  doc.text("Generat cu EMZEE OS", M, PAGE_H - 10);
  doc.text(nowStamp(), PAGE_W - M, PAGE_H - 10, { align: "right" });
  doc.setDrawColor(...C.track);
  doc.setLineWidth(0.2);
  doc.line(M, PAGE_H - 14, PAGE_W - M, PAGE_H - 14);
}

function sectionTitle(ctx: PdfCtx, title: string, color: RGB = C.brand) {
  ensure(ctx, 14);
  ctx.y += 4;
  ctx.doc.setFillColor(...color);
  ctx.doc.roundedRect(M, ctx.y - 3.2, 3, 3.2, 0.6, 0.6, "F");
  ctx.doc.setFont(FONT, "bold");
  ctx.doc.setFontSize(11.5);
  ctx.doc.setTextColor(...C.ink);
  ctx.doc.text(title.toUpperCase(), M + 5.5, ctx.y);
  ctx.y += 2.5;
  ctx.doc.setDrawColor(...C.track);
  ctx.doc.setLineWidth(0.3);
  ctx.doc.line(M, ctx.y, PAGE_W - M, ctx.y);
  ctx.y += 6;
}

function labelValue(ctx: PdfCtx, label: string, value: string) {
  if (!value) return;
  const doc = ctx.doc;
  const labelW = 46;
  doc.setFont(FONT, "bold");
  doc.setFontSize(10);
  const lines = doc.splitTextToSize(value, CW - labelW) as string[];
  ensure(ctx, Math.max(lines.length * 5, 6) + 2); // rezervă spațiu pentru etichetă + valoare împreună
  doc.setFont(FONT, "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...C.muted);
  doc.text(label, M, ctx.y);
  doc.setFont(FONT, "bold");
  doc.setFontSize(10);
  doc.setTextColor(...C.ink);
  doc.text(lines, M + labelW, ctx.y);
  ctx.y += Math.max(lines.length * 5, 6) + 1.5;
}

function splitBar(ctx: PdfCtx, label: string, leftLabel: string, rightLabel: string, leftPct: number, colL: RGB, colR: RGB) {
  const doc = ctx.doc;
  ensure(ctx, 16);
  doc.setFont(FONT, "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...C.ink);
  doc.text(label, M, ctx.y);
  ctx.y += 4;
  const barY = ctx.y;
  const h = 5.5;
  const lw = (CW * leftPct) / 100;
  doc.setFillColor(...colL);
  doc.roundedRect(M, barY, lw, h, 1, 1, "F");
  doc.setFillColor(...colR);
  doc.roundedRect(M + lw, barY, CW - lw, h, 1, 1, "F");
  ctx.y += h + 4;
  doc.setFont(FONT, "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...colL);
  doc.text(`${leftLabel} · ${leftPct}%`, M, ctx.y);
  doc.setTextColor(...colR);
  doc.text(`${rightLabel} · ${100 - leftPct}%`, PAGE_W - M, ctx.y, { align: "right" });
  ctx.y += 5;
}

function agesBar(ctx: PdfCtx, ages: { copii: number; tineri: number; adulti: number; seniori: number }) {
  const doc = ctx.doc;
  ensure(ctx, 22);
  doc.setFont(FONT, "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...C.ink);
  doc.text("Distribuția pe vârste", M, ctx.y);
  ctx.y += 4;
  const parts: { v: number; c: RGB; l: string }[] = [
    { v: ages.copii, c: C.amber, l: "Copii 0-14" },
    { v: ages.tineri, c: C.brand, l: "Tineri 15-30" },
    { v: ages.adulti, c: C.teal, l: "Adulți 31-50" },
    { v: ages.seniori, c: C.slate, l: "Seniori 50+" },
  ];
  const total = parts.reduce((s, p) => s + p.v, 0) || 100;
  let x = M;
  const h = 5.5;
  parts.forEach((p) => {
    const w = (CW * p.v) / total;
    doc.setFillColor(...p.c);
    doc.rect(x, ctx.y, w, h, "F");
    x += w;
  });
  ctx.y += h + 5;
  // legend (2 cols)
  doc.setFontSize(8.5);
  parts.forEach((p, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const lx = M + col * (CW / 2);
    const ly = ctx.y + row * 5;
    doc.setFillColor(...p.c);
    doc.roundedRect(lx, ly - 2.6, 2.6, 2.6, 0.5, 0.5, "F");
    doc.setFont(FONT, "normal");
    doc.setTextColor(...C.muted);
    doc.text(`${p.l}: ${p.v}%`, lx + 4, ly);
  });
  ctx.y += 10 + 2;
}

function statTiles(ctx: PdfCtx, tiles: { label: string; value: string }[]) {
  const items = tiles.filter((t) => t.value);
  if (!items.length) return;
  const doc = ctx.doc;
  ensure(ctx, 20);
  const gap = 4;
  const w = (CW - gap * (items.length - 1)) / items.length;
  const h = 16;
  items.forEach((t, i) => {
    const x = M + i * (w + gap);
    doc.setFillColor(246, 247, 251);
    doc.setDrawColor(...C.track);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, ctx.y, w, h, 2, 2, "FD");
    doc.setFont(FONT, "bold");
    doc.setFontSize(15);
    doc.setTextColor(...C.brand);
    doc.text(t.value, x + 4, ctx.y + 8);
    doc.setFont(FONT, "normal");
    doc.setFontSize(8);
    doc.setTextColor(...C.muted);
    doc.text(t.label, x + 4, ctx.y + 13);
  });
  ctx.y += h + 6;
}

function chips(ctx: PdfCtx, label: string, items: string[]) {
  if (!items || !items.length) return;
  const doc = ctx.doc;
  doc.setFont(FONT, "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...C.muted);
  ensure(ctx, 8);
  doc.text(label, M, ctx.y);
  ctx.y += 5;
  let x = M;
  doc.setFontSize(9);
  items.forEach((it) => {
    const w = doc.getTextWidth(it) + 7;
    if (x + w > PAGE_W - M) { x = M; ctx.y += 8; ensure(ctx, 8); }
    doc.setFillColor(238, 241, 248);
    doc.roundedRect(x, ctx.y - 4, w, 6.5, 3, 3, "F");
    doc.setTextColor(...C.ink);
    doc.text(it, x + 3.5, ctx.y);
    x += w + 3;
  });
  ctx.y += 8;
}

export function exportProfilePDF(client: { couple: string; event_date: string; venue: string; city: string; guests: number | null } | undefined, d: Record<string, any>) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  registerFont(doc);
  const ctx: PdfCtx = { doc, y: 0 };

  // Header band
  doc.setFillColor(...C.brand);
  doc.rect(0, 0, PAGE_W, 44, "F");
  doc.setFont(FONT, "bold");
  doc.setFontSize(8);
  doc.setTextColor(210, 212, 255);
  doc.text("P R O F I L   M I R I   &   I N V I T A Ț I", M, 15);
  doc.setFontSize(22);
  doc.setTextColor(...C.white);
  doc.text(client?.couple || "Eveniment", M, 27);
  doc.setFont(FONT, "normal");
  doc.setFontSize(10);
  doc.setTextColor(222, 223, 255);
  const sub = [client?.event_date ? fmtDate(client.event_date) : "", client?.venue || client?.city || "", client?.guests ? `${client.guests} invitați` : ""].filter(Boolean).join("   ·   ");
  doc.text(sub, M, 35);
  doc.setFont(FONT, "bold");
  doc.setFontSize(14);
  doc.setTextColor(...C.white);
  doc.text("EMZEE", PAGE_W - M, 20, { align: "right" });
  doc.setFont(FONT, "normal");
  doc.setFontSize(7);
  doc.setTextColor(210, 212, 255);
  doc.text("Wedding & Event Experience", PAGE_W - M, 25, { align: "right" });

  ctx.y = 56;

  // ---- Stilul cuplului ----
  sectionTitle(ctx, "Stilul cuplului", C.brand);
  labelValue(ctx, "Dinamica dorită", d.dynamic || "—");
  chips(ctx, "Priorități", d.priorities || []);
  chips(ctx, "Tipuri de jocuri dorite", d.game_styles || []);
  if (d.style_notes) labelValue(ctx, "Note despre stil", d.style_notes);

  // ---- Demografie ----
  const ages = d.ages || { copii: 10, tineri: 45, adulti: 30, seniori: 15 };
  sectionTitle(ctx, "Demografia invitaților", C.teal);
  statTiles(ctx, [
    { label: "Invitați", value: d.guests != null ? String(d.guests) : "" },
    { label: "Copii", value: d.children != null ? String(d.children) : "" },
    { label: "Origine", value: "" },
  ].filter((t) => t.label !== "Origine"));
  splitBar(ctx, "Structură socială", "Cupluri", "Singuri", d.couples_pct ?? 60, C.brand, C.teal);
  splitBar(ctx, "Religie", "Creștini", "Necreștini", d.christian_pct ?? 70, C.green, C.slate);
  agesBar(ctx, ages);
  if (d.origin) labelValue(ctx, "Origine invitați", d.origin);

  // ---- Așezare & listă ----
  sectionTitle(ctx, "Așezare & listă invitați", C.amber);
  labelValue(ctx, "Schiță așezare", d.has_seating || "—");
  if (d.seating_link) labelValue(ctx, "Link / observații", d.seating_link);
  labelValue(ctx, "Listă invitați", d.has_list || "—");
  const names = String(d.guest_list || "").split("\n").map((s) => s.trim()).filter(Boolean);
  if (names.length) {
    ensure(ctx, 8);
    doc.setFont(FONT, "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...C.muted);
    doc.text(`Nume invitați (${names.length})`, M, ctx.y);
    ctx.y += 5;
    doc.setFontSize(9);
    doc.setTextColor(...C.ink);
    const cols = 3;
    const colW = CW / cols;
    names.forEach((n, i) => {
      const col = i % cols;
      if (col === 0) ensure(ctx, 5);
      const nm = doc.splitTextToSize(n, colW - 3)[0];
      doc.text("• " + nm, M + col * colW, ctx.y);
      if (col === cols - 1) ctx.y += 5;
    });
    if (names.length % cols !== 0) ctx.y += 5;
  }

  footer(doc);
  doc.save(`profil-${(client?.couple || "eveniment").replace(/[^\w& -]/g, "")}.pdf`);
}

interface OfferItemLike { category: string; description: string; qty: number; unit_price: number; }
interface OfferLike { couple: string; event_date: string; venue: string; city?: string; guests: number | null; currency: string; discount: number; notes: string; terms: string; items: OfferItemLike[]; }

export function exportOfferPDF(o: OfferLike) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  registerFont(doc);
  const cur = o.currency || "RON";
  const ctx: PdfCtx = { doc, y: 0 };

  // ---- Header band (logo mare) ----
  doc.setFillColor(...C.brand);
  doc.rect(0, 0, PAGE_W, 50, "F");
  // Logo mark
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(M, 14, 13, 13, 3, 3, "F");
  doc.setFont(FONT, "bold");
  doc.setFontSize(15);
  doc.setTextColor(...C.brand);
  doc.text("E", M + 6.5, 23, { align: "center" });
  // Wordmark
  doc.setFont(FONT, "bold");
  doc.setFontSize(22);
  doc.setTextColor(...C.white);
  doc.text("EMZEE", M + 17, 21);
  doc.setFont(FONT, "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(210, 212, 255);
  doc.text("Wedding & Event Experience", M + 17, 27);
  // Title dreapta
  doc.setFont(FONT, "bold");
  doc.setFontSize(26);
  doc.setTextColor(...C.white);
  doc.text("OFERTĂ", PAGE_W - M, 24, { align: "right" });
  doc.setFont(FONT, "normal");
  doc.setFontSize(9);
  doc.setTextColor(210, 212, 255);
  doc.text(`Confidențial · ${nowStamp()}`, PAGE_W - M, 30, { align: "right" });
  // subtitlu eveniment
  doc.setFont(FONT, "bold");
  doc.setFontSize(13);
  doc.setTextColor(...C.white);
  doc.text(o.couple || "Eveniment", M, 42);
  doc.setFont(FONT, "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(222, 223, 255);
  const sub = [o.event_date ? fmtDate(o.event_date) : "", o.venue || o.city || "", o.guests ? `${o.guests} invitați` : ""].filter(Boolean).join("   ·   ");
  doc.text(sub, M, 47);

  ctx.y = 64;

  // ---- Tabel servicii ----
  const colDescX = M;
  const colQtyX = 128;
  const colPriceX = 150;
  const colTotX = PAGE_W - M;
  // header
  doc.setFillColor(238, 241, 248);
  doc.roundedRect(M, ctx.y - 5, CW, 8, 1.5, 1.5, "F");
  doc.setFont(FONT, "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...C.muted);
  doc.text("SERVICIU", colDescX + 2, ctx.y);
  doc.text("CANT.", colQtyX, ctx.y);
  doc.text("PREȚ", colPriceX, ctx.y);
  doc.text("TOTAL", colTotX, ctx.y, { align: "right" });
  ctx.y += 8;

  const subtotal = o.items.reduce((s, it) => s + it.qty * it.unit_price, 0);
  o.items.forEach((it) => {
    const descLines = doc.splitTextToSize(it.description || "—", colQtyX - colDescX - 6) as string[];
    const rowH = Math.max(descLines.length * 4.4 + 4, 11);
    ensure(ctx, rowH + 2);
    doc.setFont(FONT, "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...C.brand);
    doc.text((it.category || "").toUpperCase(), colDescX + 2, ctx.y);
    doc.setFont(FONT, "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...C.ink);
    doc.text(descLines, colDescX + 2, ctx.y + 4.5);
    doc.text(String(it.qty), colQtyX, ctx.y + 2);
    doc.text(money(it.unit_price, cur), colPriceX, ctx.y + 2);
    doc.setFont(FONT, "bold");
    doc.text(money(it.qty * it.unit_price, cur), colTotX, ctx.y + 2, { align: "right" });
    ctx.y += rowH;
    doc.setDrawColor(...C.track);
    doc.setLineWidth(0.2);
    doc.line(M, ctx.y - 2, PAGE_W - M, ctx.y - 2);
  });

  // ---- Totaluri ----
  ctx.y += 4;
  ensure(ctx, 30);
  const discVal = subtotal * (o.discount || 0) / 100;
  const total = subtotal - discVal;
  const boxX = 120;
  const boxW = PAGE_W - M - boxX;
  doc.setFont(FONT, "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...C.muted);
  doc.text("Subtotal", boxX, ctx.y);
  doc.setTextColor(...C.ink);
  doc.text(money(subtotal, cur), colTotX, ctx.y, { align: "right" });
  ctx.y += 6;
  if (o.discount > 0) {
    doc.setTextColor(...C.rose);
    doc.text(`Discount ${o.discount}%`, boxX, ctx.y);
    doc.text("− " + money(discVal, cur), colTotX, ctx.y, { align: "right" });
    ctx.y += 6;
  }
  doc.setFillColor(...C.brand);
  doc.roundedRect(boxX, ctx.y - 4.5, boxW, 11, 2, 2, "F");
  doc.setFont(FONT, "bold");
  doc.setFontSize(12);
  doc.setTextColor(...C.white);
  doc.text("TOTAL", boxX + 4, ctx.y + 2.5);
  doc.text(money(total, cur), colTotX - 3, ctx.y + 2.5, { align: "right" });
  ctx.y += 14;

  // ---- Note & termeni ----
  if (o.notes) { sectionTitle(ctx, "Note", C.teal); labelValue(ctx, "", o.notes); }
  if (o.terms) { sectionTitle(ctx, "Termeni", C.amber); labelValue(ctx, "", o.terms); }

  // ---- Disclaimere profesionale ----
  sectionTitle(ctx, "Condiții generale", C.slate);
  const disc = [
    "Ofertă valabilă 30 de zile de la data emiterii.",
    "Prețurile sunt exprimate în " + cur + ". Rezervarea datei se confirmă pe bază de avans.",
    "Serviciile pot fi personalizate în funcție de nevoile evenimentului.",
    "Această ofertă este confidențială și destinată exclusiv clientului menționat.",
  ];
  doc.setFont(FONT, "normal");
  doc.setFontSize(9);
  doc.setTextColor(...C.muted);
  disc.forEach((line) => {
    const wrapped = doc.splitTextToSize(line, CW - 5) as string[];
    ensure(ctx, wrapped.length * 4.6 + 1);
    doc.setFillColor(...C.slate);
    doc.circle(M + 1, ctx.y - 1.2, 0.7, "F");
    doc.text(wrapped, M + 4, ctx.y);
    ctx.y += wrapped.length * 4.6 + 1.5;
  });
  ctx.y += 4;
  ensure(ctx, 10);
  doc.setFont(FONT, "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...C.ink);
  doc.text("EMZEE · office@wle.ro", M, ctx.y);

  footer(doc);
  doc.save(`oferta-${(o.couple || "eveniment").replace(/[^\w& -]/g, "")}.pdf`);
}

interface ProgRow { time: string; duration_min: number; activity: string; description: string; color: string; }
export function exportProgramPDF(client: { couple: string; event_date: string; venue: string; city?: string } | undefined, phaseLabel: string, rows: ProgRow[], startTime: string, endTime: string) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  registerFont(doc);
  const ctx: PdfCtx = { doc, y: 0 };

  doc.setFillColor(...C.brand);
  doc.rect(0, 0, PAGE_W, 44, "F");
  doc.setFont(FONT, "bold");
  doc.setFontSize(8);
  doc.setTextColor(210, 212, 255);
  doc.text("PROGRAM EVENIMENT · " + phaseLabel.toUpperCase(), M, 15);
  doc.setFontSize(22);
  doc.setTextColor(...C.white);
  doc.text(client?.couple || "Eveniment", M, 27);
  doc.setFont(FONT, "normal");
  doc.setFontSize(10);
  doc.setTextColor(222, 223, 255);
  const sub = [client?.event_date ? fmtDate(client.event_date) : "", client?.venue || client?.city || "", `${startTime}–${endTime}`].filter(Boolean).join("   ·   ");
  doc.text(sub, M, 35);
  doc.setFont(FONT, "bold");
  doc.setFontSize(14);
  doc.setTextColor(...C.white);
  doc.text("EMZEE", PAGE_W - M, 20, { align: "right" });
  doc.setFont(FONT, "normal");
  doc.setFontSize(7);
  doc.setTextColor(210, 212, 255);
  doc.text("Wedding & Event Experience", PAGE_W - M, 25, { align: "right" });

  ctx.y = 58;
  // header rând
  doc.setFillColor(238, 241, 248);
  doc.roundedRect(M, ctx.y - 5, CW, 8, 1.5, 1.5, "F");
  doc.setFont(FONT, "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...C.muted);
  doc.text("ORA", M + 4, ctx.y);
  doc.text("DURATĂ", M + 26, ctx.y);
  doc.text("ACTIVITATE", M + 48, ctx.y);
  ctx.y += 9;

  rows.forEach((r) => {
    const actLines = doc.splitTextToSize(r.activity || "—", CW - 52) as string[];
    const descLines = r.description ? (doc.splitTextToSize(r.description, CW - 52) as string[]) : [];
    const rowH = 8 + actLines.length * 4.8 + descLines.length * 4.4;
    ensure(ctx, rowH);
    const rowTop = ctx.y;
    const baseTop = rowTop + 6; // baseline primei linii, cu padding sus
    // bara de culoare
    doc.setFillColor(...hexToRgb(r.color));
    doc.roundedRect(M, rowTop + 2, 1.7, rowH - 4, 0.7, 0.7, "F");
    // ora
    doc.setFont(FONT, "bold");
    doc.setFontSize(12);
    doc.setTextColor(...C.brand);
    doc.text(r.time, M + 5, baseTop);
    // durata
    doc.setFont(FONT, "normal");
    doc.setFontSize(9);
    doc.setTextColor(...C.muted);
    doc.text(r.duration_min >= 60 ? `${Math.floor(r.duration_min / 60)}h${r.duration_min % 60 ? " " + (r.duration_min % 60) + "m" : ""}` : `${r.duration_min} min`, M + 27, baseTop);
    // activitate
    doc.setFont(FONT, "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(...C.ink);
    doc.text(actLines, M + 50, baseTop);
    if (descLines.length) {
      doc.setFont(FONT, "normal");
      doc.setFontSize(9);
      doc.setTextColor(...C.muted);
      doc.text(descLines, M + 50, baseTop + actLines.length * 4.8 + 0.5);
    }
    ctx.y = rowTop + rowH;
    doc.setDrawColor(...C.track);
    doc.setLineWidth(0.2);
    doc.line(M, ctx.y, PAGE_W - M, ctx.y);
  });
  if (!rows.length) {
    doc.setFont(FONT, "normal"); doc.setFontSize(10); doc.setTextColor(...C.faint);
    doc.text("Nicio activitate în această structură.", M, ctx.y + 2);
  }

  footer(doc);
  doc.save(`program-${phaseLabel}-${(client?.couple || "eveniment").replace(/[^\w& -]/g, "")}.pdf`);
}

function hexToRgb(hex: string): RGB {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function exportFloralPDF(client: { couple: string; event_date: string; venue: string; city?: string } | undefined, d: Record<string, any>) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  registerFont(doc);
  const ctx: PdfCtx = { doc, y: 0 };

  doc.setFillColor(...C.rose);
  doc.rect(0, 0, PAGE_W, 44, "F");
  doc.setFont(FONT, "bold"); doc.setFontSize(8); doc.setTextColor(255, 222, 230);
  doc.text("B R I E F   F L O R A L", M, 15);
  doc.setFontSize(22); doc.setTextColor(...C.white);
  doc.text(client?.couple || "Eveniment", M, 27);
  doc.setFont(FONT, "normal"); doc.setFontSize(10); doc.setTextColor(255, 224, 232);
  const sub = [client?.event_date ? fmtDate(client.event_date) : "", client?.venue || client?.city || ""].filter(Boolean).join("   ·   ");
  doc.text(sub, M, 35);
  doc.setFont(FONT, "bold"); doc.setFontSize(14); doc.setTextColor(...C.white);
  doc.text("EMZEE", PAGE_W - M, 20, { align: "right" });
  doc.setFont(FONT, "normal"); doc.setFontSize(7); doc.setTextColor(255, 222, 230);
  doc.text("Flowers Experience", PAGE_W - M, 25, { align: "right" });

  ctx.y = 56;
  const arr = (v: any) => Array.isArray(v) ? v : [];

  const palette = arr(d.palette) as { hex: string; name?: string }[];
  if (palette.length) {
    sectionTitle(ctx, "Paletă de culori", C.rose);
    const perRow = 6;
    const gap = 4;
    const sw = (CW - gap * (perRow - 1)) / perRow;
    palette.forEach((c, i) => {
      const col = i % perRow;
      if (col === 0) ensure(ctx, 24);
      const x = M + col * (sw + gap);
      const y = ctx.y;
      try { doc.setFillColor(...hexToRgb(c.hex)); } catch { doc.setFillColor(200, 200, 200); }
      doc.roundedRect(x, y, sw, 15, 2, 2, "F");
      doc.setFont(FONT, "normal"); doc.setFontSize(8); doc.setTextColor(...C.muted);
      doc.text((c.hex || "").toUpperCase(), x + 1, y + 19);
      if (c.name) { doc.setFont(FONT, "bold"); doc.setFontSize(8); doc.setTextColor(...C.ink); doc.text(c.name, x + 1, y + 23); }
      if (col === perRow - 1 || i === palette.length - 1) ctx.y += (c.name || palette.some((p) => p.name)) ? 26 : 22;
    });
  }

  sectionTitle(ctx, "Stil & viziune", C.rose);
  chips(ctx, "Stil dorit", arr(d.styles));
  labelValue(ctx, "Culoare principală", d.main_color || "");
  labelValue(ctx, "Culori accent", d.accent_colors || "");
  labelValue(ctx, "Mood / cuvinte-cheie", d.mood || "");
  labelValue(ctx, "Link inspirație", d.inspo || "");
  chips(ctx, "Flori dorite", arr(d.flowers));
  labelValue(ctx, "De evitat", d.avoid || "");

  sectionTitle(ctx, "Elemente & cantități", C.teal);
  labelValue(ctx, "Nr. mese invitați", d.tables != null ? String(d.tables) : "");
  chips(ctx, "Aranjament mese", arr(d.table_style));
  labelValue(ctx, "Prezidiu", d.presidiu || "");
  labelValue(ctx, "Arcadă", [d.arch, arr(d.arch_shape).join(", "), d.arch_mode].filter(Boolean).join(" · "));
  labelValue(ctx, "Buchet mireasă", d.bride_bouquet || "");
  labelValue(ctx, "Buchet nașă", d.godmother_bouquet || "");
  labelValue(ctx, "Brățară nașă", d.godmother_bracelet || "");
  labelValue(ctx, "Cocarde", d.boutonnieres || "");
  labelValue(ctx, "Decor ceremonie", d.ceremony || "");
  labelValue(ctx, "Alte zone", d.other_areas || "");
  chips(ctx, "Elemente extra", arr(d.extras));

  sectionTitle(ctx, "Logistică & note", C.amber);
  labelValue(ctx, "Buget flori", d.budget != null ? d.budget + " RON" : "");
  labelValue(ctx, "Locație & acces", d.access || "");
  labelValue(ctx, "Reutilizare cerem.→petrecere", d.reuse || "");
  labelValue(ctx, "Note", d.notes || "");

  footer(doc);
  doc.save(`brief-floral-${(client?.couple || "eveniment").replace(/[^\w& -]/g, "")}.pdf`);
}

// ---- paragraf de contract (text corp, wrap + page-break) ----
function para(ctx: PdfCtx, text: string, opts?: { size?: number; color?: RGB; gap?: number; bold?: boolean }) {
  if (!text) return;
  const doc = ctx.doc;
  const size = opts?.size ?? 9.5;
  doc.setFont(FONT, opts?.bold ? "bold" : "normal");
  doc.setFontSize(size);
  doc.setTextColor(...(opts?.color ?? C.muted));
  const lh = size * 0.5;
  const lines = doc.splitTextToSize(text, CW) as string[];
  lines.forEach((ln) => {
    ensure(ctx, lh + 1);
    doc.text(ln, M, ctx.y);
    ctx.y += lh;
  });
  ctx.y += opts?.gap ?? 2.5;
}

interface ContractParty { legal: string; repr: string; cui: string; reg: string; address: string; email: string; phone: string; iban: string; bank: string; }
interface ContractLike {
  no: string; date: string;
  provider: ContractParty;
  benef_name: string; benef_id: string; benef_address: string; benef_email: string; benef_phone: string;
  event_type: string; event_date: string; event_location: string;
  services: string[];
  total: number | null; deposit: number | null; currency: string;
  deposit_due: string; balance_due: string; pay_method: string;
  cancellation: string; extra: string;
  annexes: string[];
}

export function exportContractPDF(c: ContractLike) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  registerFont(doc);
  const ctx: PdfCtx = { doc, y: 0 };
  const cur = c.currency || "RON";
  const p = c.provider;

  // ---- Header ----
  doc.setFillColor(...C.ink);
  doc.rect(0, 0, PAGE_W, 40, "F");
  doc.setFont(FONT, "bold"); doc.setFontSize(8); doc.setTextColor(160, 166, 190);
  doc.text("C O N T R A C T   D E   P R E S T Ă R I   S E R V I C I I", M, 14);
  doc.setFontSize(19); doc.setTextColor(...C.white);
  doc.text(`Nr. ${c.no || "___"} / ${c.date ? fmtDate(c.date) : "___"}`, M, 25);
  doc.setFont(FONT, "normal"); doc.setFontSize(9.5); doc.setTextColor(190, 194, 214);
  doc.text(c.benef_name || "Beneficiar", M, 33);
  doc.setFont(FONT, "bold"); doc.setFontSize(14); doc.setTextColor(...C.white);
  doc.text("EMZEE", PAGE_W - M, 20, { align: "right" });
  doc.setFont(FONT, "normal"); doc.setFontSize(7); doc.setTextColor(160, 166, 190);
  doc.text("Wedding & Event Experience", PAGE_W - M, 25, { align: "right" });

  ctx.y = 52;

  // ---- Părțile ----
  sectionTitle(ctx, "Părțile contractante", C.ink);
  const provLine = [p.legal, p.repr ? `reprezentată de ${p.repr}` : "", p.cui ? `CUI ${p.cui}` : "", p.reg ? `Reg. ${p.reg}` : "", p.address, p.email, p.phone].filter(Boolean).join(", ");
  para(ctx, `Prestator: ${provLine || p.legal || "—"}${p.iban ? `. Cont: ${p.iban}${p.bank ? ` (${p.bank})` : ""}.` : ""}`, { color: C.ink });
  const benefLine = [c.benef_name, c.benef_id ? `CI/CNP ${c.benef_id}` : "", c.benef_address, c.benef_email, c.benef_phone].filter(Boolean).join(", ");
  para(ctx, `Beneficiar: ${benefLine || c.benef_name || "—"}.`, { color: C.ink });
  para(ctx, "Denumite în continuare, împreună, Părțile, au convenit încheierea prezentului contract, cu respectarea următoarelor clauze:", { gap: 1 });

  // ---- Art. 1 Obiectul ----
  sectionTitle(ctx, "Art. 1 — Obiectul contractului", C.brand);
  para(ctx, `Prestatorul se obligă să presteze pentru Beneficiar serviciile de organizare și animație pentru evenimentul${c.event_type ? ` de tip „${c.event_type}"` : ""}${c.event_date ? `, din data de ${fmtDate(c.event_date)}` : ""}${c.event_location ? `, la locația ${c.event_location}` : ""}.`);
  if (c.services.length) { chips(ctx, "Servicii contractate:", c.services); }

  // ---- Art. 2 Preț & plată ----
  sectionTitle(ctx, "Art. 2 — Prețul și modalitatea de plată", C.green);
  const total = c.total || 0, dep = c.deposit || 0, rest = total - dep;
  statTiles(ctx, [
    { label: "Valoare totală", value: money(total, cur) },
    { label: "Avans", value: money(dep, cur) },
    { label: "Rest de plată", value: money(rest, cur) },
  ]);
  para(ctx, `Valoarea totală a serviciilor este de ${money(total, cur)}. La semnarea prezentului contract, Beneficiarul achită un avans de ${money(dep, cur)}${c.deposit_due ? `, până la data de ${c.deposit_due}` : ""}, care confirmă și rezervă data evenimentului. Diferența de ${money(rest, cur)} se achită ${c.balance_due || "cu cel puțin 7 zile înainte de eveniment"}.${c.pay_method ? ` Modalitate de plată: ${c.pay_method}.` : ""}`);

  // ---- Art. 3 Obligațiile Prestatorului ----
  sectionTitle(ctx, "Art. 3 — Obligațiile Prestatorului", C.brand);
  ["Prestează serviciile la standardele profesionale convenite și la termenele stabilite.", "Se prezintă la locația și în intervalul orar agreat, cu echipamentele necesare.", "Anunță Beneficiarul, în timp util, cu privire la orice situație care poate afecta desfășurarea evenimentului."].forEach((t) => para(ctx, "• " + t, { gap: 1 }));

  // ---- Art. 4 Obligațiile Beneficiarului ----
  sectionTitle(ctx, "Art. 4 — Obligațiile Beneficiarului", C.brand);
  ["Achită prețul la termenele și în condițiile din Art. 2.", "Pune la dispoziție informațiile și accesul necesare (locație, program, contacte).", "Asigură condițiile tehnice la locație (spațiu, curent electric) acolo unde este cazul."].forEach((t) => para(ctx, "• " + t, { gap: 1 }));

  // ---- Art. 5 Anulare ----
  sectionTitle(ctx, "Art. 5 — Anulare și rambursare", C.rose);
  para(ctx, c.cancellation || "În cazul anulării evenimentului de către Beneficiar, avansul achitat nu se restituie, acesta acoperind rezervarea datei și pregătirile efectuate. Reprogramarea este posibilă, în funcție de disponibilitatea Prestatorului.");

  // ---- Art. 6 Forță majoră & confidențialitate ----
  sectionTitle(ctx, "Art. 6 — Forță majoră, confidențialitate, drept de imagine", C.slate);
  para(ctx, "Niciuna dintre Părți nu răspunde pentru neexecutarea obligațiilor din cauza unui eveniment de forță majoră, dovedit conform legii. Părțile păstrează confidențialitatea datelor. Prestatorul poate folosi materiale foto/video din eveniment în scop de portofoliu, dacă Beneficiarul nu se opune în scris.");

  // ---- Art. 7 Dispoziții finale ----
  sectionTitle(ctx, "Art. 7 — Dispoziții finale", C.slate);
  para(ctx, `Modificarea contractului se face doar prin acord scris al Părților. Litigiile se soluționează pe cale amiabilă, iar în caz contrar de instanțele competente. Prezentul contract s-a încheiat în 2 (două) exemplare, câte unul pentru fiecare Parte.`);
  if (c.extra) { para(ctx, c.extra, { color: C.ink }); }
  if (c.annexes.length) { chips(ctx, "Anexe (parte integrantă din contract):", c.annexes); }

  // ---- Semnături ----
  ensure(ctx, 34);
  ctx.y += 6;
  const half = CW / 2;
  doc.setDrawColor(...C.track); doc.setLineWidth(0.4);
  doc.line(M, ctx.y + 14, M + half - 8, ctx.y + 14);
  doc.line(M + half + 8, ctx.y + 14, PAGE_W - M, ctx.y + 14);
  doc.setFont(FONT, "bold"); doc.setFontSize(9.5); doc.setTextColor(...C.ink);
  doc.text("PRESTATOR", M, ctx.y);
  doc.text("BENEFICIAR", M + half + 8, ctx.y);
  doc.setFont(FONT, "normal"); doc.setFontSize(9); doc.setTextColor(...C.muted);
  doc.text(p.legal || "EMZEE", M, ctx.y + 5);
  doc.text(c.benef_name || "—", M + half + 8, ctx.y + 5);
  doc.setFontSize(8); doc.setTextColor(...C.faint);
  doc.text("Semnătură / data", M, ctx.y + 19);
  doc.text("Semnătură / data", M + half + 8, ctx.y + 19);

  footer(doc);
  doc.save(`contract-${(c.benef_name || "eveniment").replace(/[^\w& -]/g, "")}.pdf`);
}

interface PackRow { name: string; qty: number; category: string; }
const CAT_LABEL: Record<string, string> = { jocuri: "Jocuri & Rentals", flori: "Flori & Decor", altele: "Altele" };
export function exportPackingPDF(client: { couple: string; event_date: string; venue: string; city?: string } | undefined, rows: PackRow[], extras: string[]) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  registerFont(doc);
  const ctx: PdfCtx = { doc, y: 0 };

  doc.setFillColor(...C.teal);
  doc.rect(0, 0, PAGE_W, 40, "F");
  doc.setFont(FONT, "bold"); doc.setFontSize(8); doc.setTextColor(200, 240, 236);
  doc.text("L I S T Ă   D E   A M B A L A R E   &   R E T U R", M, 14);
  doc.setFontSize(20); doc.setTextColor(...C.white);
  doc.text(client?.couple || "Eveniment", M, 26);
  doc.setFont(FONT, "normal"); doc.setFontSize(9.5); doc.setTextColor(210, 240, 237);
  const sub = [client?.event_date ? fmtDate(client.event_date) : "", client?.venue || client?.city || ""].filter(Boolean).join("   ·   ");
  doc.text(sub, M, 34);
  doc.setFont(FONT, "bold"); doc.setFontSize(14); doc.setTextColor(...C.white);
  doc.text("EMZEE", PAGE_W - M, 20, { align: "right" });

  ctx.y = 52;

  // coloane
  const colBox1 = PAGE_W - M - 46; // „Luat”
  const colBox2 = PAGE_W - M - 20; // „Retur”
  const colQty = colBox1 - 20;

  const header = () => {
    doc.setFillColor(238, 245, 244);
    doc.roundedRect(M, ctx.y - 5, CW, 8, 1.5, 1.5, "F");
    doc.setFont(FONT, "bold"); doc.setFontSize(8.5); doc.setTextColor(...C.muted);
    doc.text("ARTICOL", M + 2, ctx.y);
    doc.text("CANT.", colQty, ctx.y);
    doc.text("LUAT", colBox1, ctx.y);
    doc.text("RETUR", colBox2, ctx.y);
    ctx.y += 9;
  };
  const box = (x: number) => { doc.setDrawColor(...C.slate); doc.setLineWidth(0.35); doc.roundedRect(x, ctx.y - 4, 4.2, 4.2, 0.6, 0.6, "S"); };

  const groups: Record<string, PackRow[]> = {};
  rows.forEach((r) => { (groups[r.category] ||= []).push(r); });
  const order = ["jocuri", "flori", "altele"];

  if (rows.length === 0) {
    doc.setFont(FONT, "normal"); doc.setFontSize(10); doc.setTextColor(...C.faint);
    doc.text("Niciun articol alocat. Alocă echipamente din tabul Rentals.", M, ctx.y + 2);
  } else {
    header();
    order.filter((k) => groups[k]?.length).forEach((k) => {
      ensure(ctx, 10);
      doc.setFont(FONT, "bold"); doc.setFontSize(8); doc.setTextColor(...C.teal);
      doc.text((CAT_LABEL[k] || k).toUpperCase(), M + 2, ctx.y);
      ctx.y += 6;
      groups[k].forEach((r) => {
        ensure(ctx, 9);
        doc.setFont(FONT, "normal"); doc.setFontSize(10); doc.setTextColor(...C.ink);
        const nm = doc.splitTextToSize(r.name, colQty - M - 6)[0] as string;
        doc.text(nm, M + 2, ctx.y);
        doc.setFont(FONT, "bold"); doc.text(String(r.qty), colQty, ctx.y);
        box(colBox1); box(colBox2);
        ctx.y += 3;
        doc.setDrawColor(...C.track); doc.setLineWidth(0.2); doc.line(M, ctx.y, PAGE_W - M, ctx.y);
        ctx.y += 5;
      });
      ctx.y += 2;
    });
  }

  if (extras.length) {
    sectionTitle(ctx, "Articole suplimentare", C.amber);
    extras.forEach((e) => {
      ensure(ctx, 9);
      box(M + 1.5);
      doc.setFont(FONT, "normal"); doc.setFontSize(10); doc.setTextColor(...C.ink);
      doc.text(e, M + 9, ctx.y);
      ctx.y += 8;
    });
  }

  footer(doc);
  doc.save(`ambalare-${(client?.couple || "eveniment").replace(/[^\w& -]/g, "")}.pdf`);
}

interface CorpLike { company: string; contact: string; email: string; phone: string; date: string; participants: number | null; format: string[]; objectives: string[]; activities: string[]; location: string; catering: string; budget: number | null; deadline: string; notes: string; }
export function exportCorporatePDF(c: CorpLike) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  registerFont(doc);
  const ctx: PdfCtx = { doc, y: 0 };
  doc.setFillColor(...C.teal);
  doc.rect(0, 0, PAGE_W, 44, "F");
  doc.setFont(FONT, "bold"); doc.setFontSize(8); doc.setTextColor(200, 240, 236);
  doc.text("B R I E F   C O R P O R A T E", M, 15);
  doc.setFontSize(22); doc.setTextColor(...C.white);
  doc.text(c.company || "Companie", M, 27);
  doc.setFont(FONT, "normal"); doc.setFontSize(10); doc.setTextColor(210, 240, 237);
  const sub = [c.contact, c.date ? fmtDate(c.date) : "", c.participants ? `${c.participants} participanți` : ""].filter(Boolean).join("   ·   ");
  doc.text(sub, M, 35);
  doc.setFont(FONT, "bold"); doc.setFontSize(14); doc.setTextColor(...C.white);
  doc.text("EMZEE", PAGE_W - M, 20, { align: "right" });
  doc.setFont(FONT, "normal"); doc.setFontSize(7); doc.setTextColor(200, 240, 236);
  doc.text("Corporate Experience", PAGE_W - M, 25, { align: "right" });

  ctx.y = 56;
  const arr = (v: any) => Array.isArray(v) ? v : [];
  sectionTitle(ctx, "Contact & context", C.teal);
  labelValue(ctx, "Persoană contact", c.contact || "");
  labelValue(ctx, "Email", c.email || "");
  labelValue(ctx, "Telefon", c.phone || "");
  labelValue(ctx, "Nr. participanți", c.participants != null ? String(c.participants) : "");
  labelValue(ctx, "Data / perioada", c.date ? fmtDate(c.date) : "");
  labelValue(ctx, "Locație", c.location || "");

  sectionTitle(ctx, "Nevoi & obiective", C.brand);
  chips(ctx, "Format dorit", arr(c.format));
  chips(ctx, "Obiective", arr(c.objectives));
  chips(ctx, "Activități dorite", arr(c.activities));

  sectionTitle(ctx, "Logistică & buget", C.amber);
  labelValue(ctx, "Catering", c.catering || "");
  labelValue(ctx, "Buget estimativ", c.budget != null ? c.budget + " RON" : "");
  labelValue(ctx, "Deadline propunere", c.deadline ? fmtDate(c.deadline) : "");
  labelValue(ctx, "Note", c.notes || "");

  footer(doc);
  doc.save(`brief-corporate-${(c.company || "companie").replace(/[^\w& -]/g, "")}.pdf`);
}
