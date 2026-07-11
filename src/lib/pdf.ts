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
  doc.setFont(FONT, "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...C.muted);
  const labelW = 46;
  doc.text(label, M, ctx.y);
  doc.setFont(FONT, "bold");
  doc.setFontSize(10);
  doc.setTextColor(...C.ink);
  const lines = doc.splitTextToSize(value, CW - labelW) as string[];
  ensure(ctx, lines.length * 5 + 2);
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
