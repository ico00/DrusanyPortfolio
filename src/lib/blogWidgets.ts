import { readFile, writeFile } from "fs/promises";
import path from "path";

export interface SearchWidgetConfig {
  id: string;
  type: "search";
  enabled: boolean;
  title: string;
}

export interface CategoriesWidgetConfig {
  id: string;
  type: "categories";
  enabled: boolean;
  title: string;
}

export interface MapLocation {
  id: string;
  name: string;
  embedUrl: string;
}

export interface MapsWidgetConfig {
  id: string;
  type: "maps";
  enabled: boolean;
  title: string;
  locations: MapLocation[];
}

export interface FeaturedPostsWidgetConfig {
  id: string;
  type: "featured-posts";
  enabled: boolean;
  title: string;
}

export interface PlansWidgetConfig {
  id: string;
  type: "plans";
  enabled: boolean;
  title: string;
}

export type BlogWidgetConfig =
  | SearchWidgetConfig
  | CategoriesWidgetConfig
  | MapsWidgetConfig
  | FeaturedPostsWidgetConfig
  | PlansWidgetConfig;

export interface BlogWidgetsData {
  widgets: BlogWidgetConfig[];
}

const WIDGETS_JSON_PATH = path.join(process.cwd(), "src", "data", "blogWidgets.json");

export async function getBlogWidgets(): Promise<BlogWidgetsData> {
  try {
    const raw = await readFile(WIDGETS_JSON_PATH, "utf-8");
    const data = JSON.parse(raw) as BlogWidgetsData;
    const widgets = Array.isArray(data.widgets) ? data.widgets : [];
    return { widgets };
  } catch {
    return { widgets: [] };
  }
}

const ALLOWED_WIDGET_TYPES = new Set<BlogWidgetConfig["type"]>([
  "search",
  "categories",
  "maps",
  "featured-posts",
  "plans",
]);

/**
 * Validira tijelo PUT za admin; baca Error s kratkom porukom ako nije valjano.
 */
export function parseBlogWidgetsPayload(raw: unknown): BlogWidgetsData {
  if (!raw || typeof raw !== "object" || !("widgets" in raw)) {
    throw new Error("Invalid body");
  }
  const arr = (raw as { widgets: unknown }).widgets;
  if (!Array.isArray(arr)) {
    throw new Error("widgets must be an array");
  }
  const widgets: BlogWidgetConfig[] = [];
  for (const item of arr) {
    if (!item || typeof item !== "object") {
      throw new Error("Invalid widget entry");
    }
    const o = item as Record<string, unknown>;
    const id = String(o.id ?? "").trim();
    const type = o.type as BlogWidgetConfig["type"];
    const title = String(o.title ?? "");
    if (!id || !ALLOWED_WIDGET_TYPES.has(type)) {
      throw new Error("Invalid widget id or type");
    }
    const enabled = Boolean(o.enabled);
    if (type === "maps") {
      const locsRaw = Array.isArray(o.locations) ? o.locations : [];
      const locations: MapLocation[] = locsRaw.map((loc, i) => {
        if (!loc || typeof loc !== "object") {
          throw new Error("Invalid map location");
        }
        const L = loc as Record<string, unknown>;
        return {
          id: String(L.id ?? `loc-${i}`).trim() || `loc-${i}`,
          name: String(L.name ?? ""),
          embedUrl: String(L.embedUrl ?? "").trim(),
        };
      });
      widgets.push({ id, type: "maps", enabled, title, locations });
    } else {
      widgets.push({ id, type, enabled, title } as BlogWidgetConfig);
    }
  }
  return { widgets };
}

/** Sprema normalizirani JSON (admin PUT). */
export async function saveBlogWidgets(raw: unknown): Promise<BlogWidgetsData> {
  const data = parseBlogWidgetsPayload(raw);
  const json = JSON.stringify(data, null, 2);
  await writeFile(WIDGETS_JSON_PATH, `${json}\n`, "utf-8");
  return data;
}
