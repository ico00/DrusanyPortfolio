import { readFile, writeFile } from "fs/promises";
import path from "path";
import { FONT_MAP, type ThemeFontId } from "@/data/themeFonts";

export type ThemeFontFamily = ThemeFontId;

export interface ThemeElement {
  fontFamily: ThemeFontFamily;
  fontSize: string;
  color: string;
}

export interface ThemeConfig {
  title: ThemeElement;
  heading: ThemeElement;
  body: ThemeElement;
  quote: ThemeElement;
  nav: ThemeElement;
  caption: ThemeElement;
}

const THEME_PATH = path.join(process.cwd(), "src", "data", "theme.json");

export async function getTheme(): Promise<ThemeConfig> {
  try {
    const raw = await readFile(THEME_PATH, "utf-8");
    return JSON.parse(raw) as ThemeConfig;
  } catch {
    return getDefaultTheme();
  }
}

export function getDefaultTheme(): ThemeConfig {
  return {
    title: {
      fontFamily: "serif",
      fontSize: "clamp(2rem, 5vw, 4rem)",
      color: "#ffffff",
    },
    heading: {
      fontFamily: "serif",
      fontSize: "1.5rem",
      color: "#18181b",
    },
    body: {
      fontFamily: "sans",
      fontSize: "1rem",
      color: "#3f3f46",
    },
    quote: {
      fontFamily: "serif",
      fontSize: "1.125rem",
      color: "#e4e4e7",
    },
    nav: {
      fontFamily: "sans",
      fontSize: "0.875rem",
      color: "rgba(255,255,255,0.9)",
    },
    caption: {
      fontFamily: "sans",
      fontSize: "0.75rem",
      color: "#71717a",
    },
  };
}

export function themeToCssVariables(theme: ThemeConfig): string {
  const vars: string[] = [];
  for (const [key, val] of Object.entries(theme)) {
    const el = val as ThemeElement;
    const prefix = `--theme-${key}`;
    vars.push(`${prefix}-font: ${FONT_MAP[el.fontFamily]};`);
    vars.push(`${prefix}-size: ${el.fontSize};`);
    vars.push(`${prefix}-color: ${el.color};`);
  }
  return `:root { ${vars.join(" ")} }`;
}

export async function saveTheme(theme: ThemeConfig): Promise<void> {
  await writeFile(THEME_PATH, JSON.stringify(theme, null, 2), "utf-8");
}
