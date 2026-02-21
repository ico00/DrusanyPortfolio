#!/usr/bin/env node
/**
 * Uklanja nepostojeće kategorije iz blog postova.
 * Čita blogCategories.ts i uklanja iz blog.json sve kategorije koje nisu u listi.
 *
 * Usage: node scripts/cleanup-blog-categories.mjs [--dry-run]
 */

import { readFile, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const BLOG_JSON = path.join(ROOT, "src/data/blog.json");
const BLOG_CATEGORIES_TS = path.join(ROOT, "src/data/blogCategories.ts");

/** Izvuci sve valjane slugove iz blogCategories.ts (slug: "xxx") */
function extractValidSlugs(tsContent) {
  const slugs = new Set();
  const regex = /slug:\s*["']([^"']+)["']/g;
  let m;
  while ((m = regex.exec(tsContent)) !== null) {
    slugs.add(m[1].toLowerCase().trim());
  }
  // Legacy map - sport-nogomet → nogomet (ali nogomet je već u listi)
  return slugs;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");

  console.log("Reading blogCategories.ts...");
  const categoriesTs = await readFile(BLOG_CATEGORIES_TS, "utf-8");
  const validSlugs = extractValidSlugs(categoriesTs);
  console.log(`  Valid categories: ${[...validSlugs].sort().join(", ")}`);

  console.log("\nReading blog.json...");
  const blogRaw = await readFile(BLOG_JSON, "utf-8");
  const blog = JSON.parse(blogRaw);
  const posts = blog.posts || [];

  let changedCount = 0;
  const removed = {};

  for (const post of posts) {
    const cats = post.categories || [];
    const valid = cats.filter((c) => validSlugs.has((c || "").toLowerCase().trim()));
    const invalid = cats.filter((c) => !validSlugs.has((c || "").toLowerCase().trim()));

    if (invalid.length > 0) {
      for (const inv of invalid) {
        removed[inv] = (removed[inv] || 0) + 1;
      }
      post.categories = valid.length ? valid : ["zagrebancije"];
      changedCount++;
    }
  }

  if (changedCount === 0) {
    console.log("\nNo invalid categories found. Nothing to clean.");
    return;
  }

  console.log(`\nRemoved invalid categories from ${changedCount} posts:`);
  for (const [cat, count] of Object.entries(removed).sort((a, b) => b[1] - a[1])) {
    console.log(`  - ${cat}: ${count} postova`);
  }

  if (dryRun) {
    console.log("\n[DRY RUN] Would update blog.json. Run without --dry-run to apply.");
    return;
  }

  await writeFile(BLOG_JSON, JSON.stringify(blog, null, 2), "utf-8");
  console.log("\nUpdated blog.json.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
