/**
 * Konfiguracija fontova za Theme.
 *
 * DODAVANJE NOVOG FONTA:
 * 1. layout.tsx – import iz next/font/google:
 *    import { Lora } from "next/font/google";
 *    const lora = Lora({ variable: "--font-lora", subsets: ["latin"] });
 *    U body dodaj: ${lora.variable}
 *
 * 2. Ovdje – dodaj novi zapis u THEME_FONTS:
 *    { id: "lora", label: "Lora", cssVar: "var(--font-lora), serif", previewFamily: "var(--font-lora), serif" },
 *
 * 3. theme.json – postojeći elementi mogu ostati; novi font će biti dostupan u dropdownu.
 */

export const THEME_FONTS = [
  {
    id: "sans",
    label: "Sans (Geist)",
    cssVar: "var(--font-geist-sans), Arial, Helvetica, sans-serif",
    previewFamily: "var(--font-geist-sans), sans-serif",
  },
  {
    id: "serif",
    label: "Serif (Playfair)",
    cssVar: "var(--font-playfair), Georgia, serif",
    previewFamily: "var(--font-playfair), Georgia, serif",
  },
  {
    id: "mono",
    label: "Mono (JetBrains)",
    cssVar: "var(--font-jetbrains-mono), ui-monospace, monospace",
    previewFamily: "var(--font-jetbrains-mono), monospace",
  },
] as const;

export type ThemeFontId = (typeof THEME_FONTS)[number]["id"];

export const FONT_MAP: Record<ThemeFontId, string> = Object.fromEntries(
  THEME_FONTS.map((f) => [f.id, f.cssVar])
) as Record<ThemeFontId, string>;

export const FONT_PREVIEW_MAP: Record<ThemeFontId, string> = Object.fromEntries(
  THEME_FONTS.map((f) => [f.id, f.previewFamily])
) as Record<ThemeFontId, string>;

export const FONT_OPTIONS = THEME_FONTS.map((f) => ({
  value: f.id,
  label: f.label,
}));
