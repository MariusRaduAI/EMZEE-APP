// Bibliotecă de culori pentru nunți, cu denumiri standard (ca pe coolors).
export interface NamedColor { name: string; hex: string; }

export const COLOR_LIBRARY: NamedColor[] = [
  { name: "Ivory", hex: "#f3efe3" },
  { name: "Cream", hex: "#f7f1e1" },
  { name: "Champagne", hex: "#f0dec8" },
  { name: "Greige", hex: "#d6cdbe" },
  { name: "Taupe", hex: "#b8a99a" },
  { name: "Nude", hex: "#e4c7b5" },
  { name: "Blush", hex: "#e8c4c0" },
  { name: "Dusty Rose", hex: "#c98b94" },
  { name: "Mauve", hex: "#a67b8a" },
  { name: "Marsala", hex: "#964f4c" },
  { name: "Burgundy", hex: "#6e1e2e" },
  { name: "Wine", hex: "#7b2d3b" },
  { name: "Aubergine", hex: "#4c2f3a" },
  { name: "Peach", hex: "#f1c5a8" },
  { name: "Apricot", hex: "#f0b78c" },
  { name: "Coral", hex: "#e58b72" },
  { name: "Terracotta", hex: "#c57b57" },
  { name: "Rust", hex: "#a64b2a" },
  { name: "Mustard", hex: "#c9a227" },
  { name: "Gold", hex: "#c9a54b" },
  { name: "Champagne Gold", hex: "#cba96b" },
  { name: "Pistachio", hex: "#bccfa0" },
  { name: "Sage", hex: "#9caf88" },
  { name: "Eucalyptus", hex: "#7c9082" },
  { name: "Olive", hex: "#6b7b4f" },
  { name: "Emerald", hex: "#2e5e4e" },
  { name: "Forest", hex: "#26443b" },
  { name: "Teal", hex: "#2c6e6a" },
  { name: "Powder Blue", hex: "#c7d6e2" },
  { name: "Dusty Blue", hex: "#8da9c4" },
  { name: "Slate Blue", hex: "#5e7a99" },
  { name: "Navy", hex: "#22314e" },
  { name: "Lilac", hex: "#c9b6d9" },
  { name: "Lavender", hex: "#b7a7ce" },
  { name: "Plum", hex: "#6b4c6e" },
  { name: "Charcoal", hex: "#3a3a3a" },
];

export interface CuratedPalette { name: string; colors: string[]; }

// Palete recomandate (combinații care merg bine împreună).
export const CURATED_PALETTES: CuratedPalette[] = [
  { name: "Sage & Terracotta", colors: ["#9caf88", "#c57b57", "#f3efe3", "#f7f1e1"] },
  { name: "Burgundy & Blush", colors: ["#6e1e2e", "#e8c4c0", "#f3efe3", "#c9a54b"] },
  { name: "Dusty Blue & Cream", colors: ["#8da9c4", "#f7f1e1", "#9caf88", "#cba96b"] },
  { name: "Emerald & Gold", colors: ["#2e5e4e", "#c9a54b", "#f3efe3", "#26443b"] },
  { name: "Mauve & Sage", colors: ["#a67b8a", "#9caf88", "#f3efe3", "#c98b94"] },
  { name: "Navy & Blush", colors: ["#22314e", "#e8c4c0", "#f3efe3", "#c9a54b"] },
  { name: "Toamnă — Terracotta & Rust", colors: ["#c57b57", "#a64b2a", "#c9a227", "#6b7b4f", "#f7f1e1"] },
  { name: "Lavender & Sage", colors: ["#b7a7ce", "#9caf88", "#f3efe3", "#c9b6d9"] },
  { name: "Ivory & Greenery", colors: ["#f3efe3", "#7c9082", "#9caf88", "#f7f1e1"] },
  { name: "Marsala & Nude", colors: ["#964f4c", "#e4c7b5", "#f3efe3", "#cba96b"] },
];

function hexToRgb(h: string): [number, number, number] {
  const n = parseInt(h.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Cea mai apropiată denumire standard pentru un hex custom.
export function nearestName(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  let best = COLOR_LIBRARY[0], bestD = Infinity;
  for (const c of COLOR_LIBRARY) {
    const [r2, g2, b2] = hexToRgb(c.hex);
    const d = (r - r2) ** 2 + (g - g2) ** 2 + (b - b2) ** 2;
    if (d < bestD) { bestD = d; best = c; }
  }
  return best.name;
}
