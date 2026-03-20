import { readFile, writeFile } from "fs/promises";
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

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Validacija tijela PUT za admin. */
export function parsePlansPayload(raw: unknown): PlansData {
  if (!raw || typeof raw !== "object" || !("plans" in raw)) {
    throw new Error("Invalid body");
  }
  const arr = (raw as { plans: unknown }).plans;
  if (!Array.isArray(arr)) {
    throw new Error("plans must be an array");
  }
  const plans: PlanItem[] = [];
  for (const item of arr) {
    if (!item || typeof item !== "object") {
      throw new Error("Invalid plan entry");
    }
    const o = item as Record<string, unknown>;
    const date = String(o.date ?? "").trim();
    const name = String(o.name ?? "").trim();
    if (!DATE_RE.test(date)) {
      throw new Error(`Invalid plan date: ${date || "(empty)"}`);
    }
    if (!name) {
      throw new Error("Each plan needs a name");
    }
    plans.push({ date, name });
  }
  const sorted = [...plans].sort((a, b) => a.date.localeCompare(b.date));
  return { plans: sorted };
}

export async function savePlans(raw: unknown): Promise<PlansData> {
  const data = parsePlansPayload(raw);
  const json = JSON.stringify(data, null, 2);
  await writeFile(PLANS_JSON_PATH, `${json}\n`, "utf-8");
  return data;
}

/** Raw datoteka za GET API (isti sadržaj kao getPlans, ali kao objekt). */
export async function getPlansData(): Promise<PlansData> {
  const plans = await getPlans();
  return { plans };
}
