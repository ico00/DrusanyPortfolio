import { readFile } from "fs/promises";
import path from "path";

export interface PressItem {
  id: string;
  src: string;
  alt: string;
  caption?: string;
  link?: string;
  width?: number;
  height?: number;
}

export interface PressData {
  items: PressItem[];
}

export async function getPress(): Promise<PressData> {
  try {
    const pressPath = path.join(process.cwd(), "src", "data", "press.json");
    const raw = await readFile(pressPath, "utf-8");
    const data = JSON.parse(raw) as { items?: PressItem[] };
    const items = (data.items ?? []).filter(
      (i) => i?.src && typeof i.src === "string"
    );
    return { items };
  } catch {
    return { items: [] };
  }
}
