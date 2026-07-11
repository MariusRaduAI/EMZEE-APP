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
