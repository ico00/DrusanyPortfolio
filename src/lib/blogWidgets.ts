import { readFile } from "fs/promises";
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

export interface InstagramWidgetConfig {
  id: string;
  type: "instagram";
  enabled: boolean;
  title: string;
  username: string;
  profileUrl: string;
  images: string[];
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

export type BlogWidgetConfig =
  | SearchWidgetConfig
  | CategoriesWidgetConfig
  | InstagramWidgetConfig
  | MapsWidgetConfig
  | FeaturedPostsWidgetConfig;

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
