import { readFile } from "fs/promises";
import path from "path";

export interface PlanItem {
  date: string;
  name: string;
}

export interface PlansData {
  plans: PlanItem[];
}

const PLANS_JSON_PATH = path.join(process.cwd(), "src", "data", "plans.json");

export async function getPlans(): Promise<PlanItem[]> {
  try {
    const raw = await readFile(PLANS_JSON_PATH, "utf-8");
    const data = JSON.parse(raw) as { plans?: PlanItem[] };
    const plans = (data.plans ?? []).filter(
      (p) => p?.date && typeof p.date === "string" && p?.name && typeof p.name === "string"
    );
    return plans.sort((a, b) => a.date.localeCompare(b.date));
  } catch {
    return [];
  }
}
