import { readFile } from "fs/promises";
import path from "path";

export interface GearItem {
  id: string;
  src: string;
  alt: string;
  title: string;
  category?: string;
  width?: number;
  height?: number;
}

export interface GearData {
  items: GearItem[];
}

export async function getGear(): Promise<GearData> {
  try {
    const gearPath = path.join(process.cwd(), "src", "data", "gear.json");
    const raw = await readFile(gearPath, "utf-8");
    const data = JSON.parse(raw) as { items?: GearItem[] };
    const items = (data.items ?? []).filter(
      (i) => i?.src && typeof i.src === "string"
    );
    return { items };
  } catch {
    return { items: [] };
  }
}
