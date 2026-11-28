// Ten ready colour themes a trainer can choose for their own public page.
// Colours only: layout is shared by all themes. Each theme is applied as CSS variables on the trainer's
// page root (see t.$slug.tsx), never globally, so it cannot change the owner's site or another trainer's page.
export type TenantTheme = {
  key: string;
  ar: string;
  en: string;
  bg: string; // page background
  ink: string; // text on bg
  accent: string; // buttons, numbers, block
  accentInk: string; // text on accent
  panel: string; // dark/contrast band background
  panelInk: string; // text on panel
};

export const TENANT_THEMES: TenantTheme[] = [
  { key: "terracotta", ar: "طين", en: "Terracotta", bg: "#f4ede1", ink: "#1f1a14", accent: "#b23a0e", accentInk: "#ffffff", panel: "#1f1a14", panelInk: "#f4ede1" },
  { key: "ocean", ar: "محيط", en: "Ocean", bg: "#e8f1f5", ink: "#0e2230", accent: "#0b5f86", accentInk: "#ffffff", panel: "#0e2230", panelInk: "#e8f1f5" },
  { key: "forest", ar: "غابة", en: "Forest", bg: "#eaf1e6", ink: "#15261a", accent: "#2d6a3e", accentInk: "#ffffff", panel: "#15261a", panelInk: "#eaf1e6" },
  { key: "plum", ar: "برقوق", en: "Plum", bg: "#f2e9f3", ink: "#2a1630", accent: "#7a2a86", accentInk: "#ffffff", panel: "#2a1630", panelInk: "#f2e9f3" },
  { key: "sand", ar: "رمل", en: "Sand", bg: "#f6f0dc", ink: "#2b2413", accent: "#8a5a00", accentInk: "#ffffff", panel: "#2b2413", panelInk: "#f6f0dc" },
  { key: "rose", ar: "ورد", en: "Rose", bg: "#fbe9ec", ink: "#3a1119", accent: "#b0234a", accentInk: "#ffffff", panel: "#3a1119", panelInk: "#fbe9ec" },
  { key: "slate", ar: "رمادي", en: "Slate", bg: "#eceff2", ink: "#182026", accent: "#3b4f63", accentInk: "#ffffff", panel: "#182026", panelInk: "#eceff2" },
  { key: "midnight", ar: "ليل", en: "Midnight", bg: "#141a2e", ink: "#eef1fb", accent: "#8ea2ff", accentInk: "#0b1022", panel: "#0b1022", panelInk: "#eef1fb" },
  { key: "mint", ar: "نعناع", en: "Mint", bg: "#e4f5ef", ink: "#0f2a22", accent: "#0b7a5c", accentInk: "#ffffff", panel: "#0f2a22", panelInk: "#e4f5ef" },
  { key: "saffron", ar: "زعفران", en: "Saffron", bg: "#fff4d6", ink: "#2c2000", accent: "#a85a00", accentInk: "#ffffff", panel: "#2c2000", panelInk: "#fff4d6" },
];

export const DEFAULT_THEME = TENANT_THEMES[0];
export const THEME_KEYS = TENANT_THEMES.map((t) => t.key);

export function themeByKey(key?: string | null): TenantTheme {
  return TENANT_THEMES.find((t) => t.key === key) ?? DEFAULT_THEME;
}

export function themeVars(t: TenantTheme): Record<string, string> {
  return { "--tl-bg": t.bg, "--tl-ink": t.ink, "--tl-accent": t.accent, "--tl-accent-ink": t.accentInk, "--tl-panel": t.panel, "--tl-panel-ink": t.panelInk };
}

function lum(hex: string) {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
export function contrast(a: string, b: string) {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}
