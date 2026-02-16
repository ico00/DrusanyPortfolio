#!/usr/bin/env node
/**
 * Dodaje width i height u gear.json za svaku sliku.
 * Pokreni: node scripts/add-gear-dimensions.mjs
 */
import { readFile, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

async function main() {
  const gearPath = path.join(root, "src", "data", "gear.json");
  const raw = await readFile(gearPath, "utf-8");
  const data = JSON.parse(raw);

  for (const item of data.items || []) {
    if (!item.src || item.src.startsWith("http")) continue;
    const filePath = path.join(root, "public", item.src);
    try {
      const meta = await sharp(filePath).metadata();
      item.width = meta.width ?? 0;
      item.height = meta.height ?? 0;
      console.log(`${item.src}: ${item.width}x${item.height}`);
    } catch (err) {
      console.warn(`Skip ${item.src}:`, err.message);
    }
  }

  await writeFile(gearPath, JSON.stringify(data, null, 2), "utf-8");
  console.log("gear.json updated.");
}

main().catch(console.error);
