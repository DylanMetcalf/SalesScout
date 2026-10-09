/** Colour palettes. "night" is the default; the rest are defined in globals.css under [data-palette]. */
export const PALETTES = [
  { id: "night", name: "Scout Night", note: "Navy, teal and amber", swatch: ["#16203a", "#0f8285", "#e8833a"] },
  { id: "indigo", name: "Midnight Indigo", note: "Classic software indigo with coral", swatch: ["#151735", "#4f46e5", "#f2705b"] },
  { id: "ocean", name: "Ocean Blue", note: "Trustworthy blue with gold", swatch: ["#0b1d38", "#1b67d6", "#f3a22a"] },
  { id: "forest", name: "Forest & Brass", note: "Deep green with brass", swatch: ["#112620", "#1b7a56", "#d39a2b"] },
  { id: "plum", name: "Plum & Peach", note: "Bold purple with peach", swatch: ["#22163a", "#8a3fd0", "#ff8a65"] },
  { id: "graphite", name: "Graphite & Lime", note: "Near-black with fresh green", swatch: ["#16181d", "#2f7d3a", "#ff6b4a"] },
  { id: "ember", name: "Ember", note: "Warm orange-red with teal", swatch: ["#1d1a2b", "#d9502b", "#2bb3a6"] },
] as const;

export type PaletteId = (typeof PALETTES)[number]["id"];
export const PALETTE_KEY = "ss-palette";

/** Runs before paint so a chosen palette never flashes the default. */
export const PALETTE_BOOT = `try{var p=localStorage.getItem("${PALETTE_KEY}");if(p&&p!=="night")document.documentElement.dataset.palette=p}catch(e){}`;
