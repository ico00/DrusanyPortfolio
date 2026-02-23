import { readFile, writeFile } from "fs/promises";
import path from "path";
import { FONT_MAP, type ThemeFontId } from "@/data/themeFonts";

export type ThemeFontFamily = ThemeFontId;

export interface ThemeElement {
  fontFamily: ThemeFontFamily;
  fontSize: string;
  color: string;
}

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface ThemeConfig {
  title: ThemeElement;
  heading: ThemeElement;
  headingH1?: ThemeElement;
  headingH2?: ThemeElement;
  headingH3?: ThemeElement;
  headingH4?: ThemeElement;
  headingH5?: ThemeElement;
  headingH6?: ThemeElement;
  headingOnDark: ThemeElement;
  blogPostTitle: ThemeElement;
  blogListCardTitle: ThemeElement;
  blogListCardMetadata: ThemeElement;
  widgetTitle: ThemeElement;
  body: ThemeElement;
  quote: ThemeElement;
  code: ThemeElement;
  nav: ThemeElement;
  caption: ThemeElement;
}

const THEME_PATH = path.join(process.cwd(), "src", "data", "theme.json");

const HEADING_DEFAULT_SIZES: Record<HeadingLevel, string> = {
  1: "2.25rem",
  2: "1.875rem",
  3: "1.5rem",
  4: "1.25rem",
  5: "1.125rem",
  6: "1rem",
};

export async function getTheme(): Promise<ThemeConfig> {
  const defaults = getDefaultTheme();
  try {
    const raw = await readFile(THEME_PATH, "utf-8");
    const data = JSON.parse(raw) as Partial<ThemeConfig>;
    const merged = { ...defaults, ...data } as ThemeConfig;
    const base = merged.heading;
    for (let i = 1; i <= 6; i++) {
      const key = `headingH${i}` as keyof ThemeConfig;
      if (!merged[key]) {
        (merged as unknown as Record<string, ThemeElement>)[key] = {
          ...base,
          fontSize: HEADING_DEFAULT_SIZES[i as HeadingLevel],
        };
      }
    }
    return merged;
  } catch {
    return defaults;
  }
}

export function getDefaultTheme(): ThemeConfig {
  const baseHeading: ThemeElement = {
    fontFamily: "serif",
    fontSize: "1.5rem",
    color: "#18181b",
  };
  return {
    title: {
      fontFamily: "serif",
      fontSize: "clamp(2rem, 5vw, 4rem)",
      color: "#ffffff",
    },
    heading: baseHeading,
    headingH1: { ...baseHeading, fontSize: "2.25rem" },
    headingH2: { ...baseHeading, fontSize: "1.875rem" },
    headingH3: { ...baseHeading, fontSize: "1.5rem" },
    headingH4: { ...baseHeading, fontSize: "1.25rem" },
    headingH5: { ...baseHeading, fontSize: "1.125rem" },
    headingH6: { ...baseHeading, fontSize: "1rem" },
    headingOnDark: {
      fontFamily: "serif",
      fontSize: "clamp(1.75rem, 4vw, 3rem)",
      color: "#ffffff",
    },
    blogPostTitle: {
      fontFamily: "serif",
      fontSize: "clamp(1.875rem, 4vw, 3rem)",
      color: "#18181b",
    },
    blogListCardTitle: {
      fontFamily: "serif",
      fontSize: "clamp(1.5rem, 3vw, 1.875rem)",
      color: "#ffffff",
    },
    blogListCardMetadata: {
      fontFamily: "sans",
      fontSize: "0.875rem",
      color: "#d4d4d8",
    },
    widgetTitle: {
      fontFamily: "serif",
      fontSize: "1.125rem",
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
    code: {
      fontFamily: "mono",
      fontSize: "0.875rem",
      color: "#18181b",
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
    if (val && typeof val === "object" && "fontFamily" in val) {
      const el = val as ThemeElement;
      const prefix = `--theme-${key}`;
      vars.push(`${prefix}-font: ${FONT_MAP[el.fontFamily]};`);
      vars.push(`${prefix}-size: ${el.fontSize};`);
      vars.push(`${prefix}-color: ${el.color};`);
    }
  }
  return `body { ${vars.join(" ")} }`;
}

export async function saveTheme(theme: ThemeConfig): Promise<void> {
  await writeFile(THEME_PATH, JSON.stringify(theme, null, 2), "utf-8");
}
