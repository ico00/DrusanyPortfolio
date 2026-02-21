#!/usr/bin/env node
/**
 * Import WordPress blog posts from cPanel backup SQL dump.
 *
 * Usage:
 *   node scripts/import-wordpress-blog.mjs           # 1 post (provjera)
 *   node scripts/import-wordpress-blog.mjs --one     # 1 post
 *   node scripts/import-wordpress-blog.mjs --all      # svi preostali
 *   node scripts/import-wordpress-blog.mjs --limit N  # N postova
 *   node scripts/import-wordpress-blog.mjs --dry-run  # samo prikaz, bez pisanja
 *
 * Postovi se imenuju po formatu yymmdd-naslov (npr. 090616-fotografiranje-auto-sporta).
 *
 * Reads: .../Blog-Backup/.../mysql/drusany_wp2.sql
 * Writes: src/data/blog.json, src/data/blog/[slug].html
 */

import { readFile, writeFile, readdir, mkdir } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const BACKUP_PATH =
  "/Users/icom4/Documents/Blog-Backup/backup-2.11.2026_21-50-00_drusany/mysql/drusany_wp2.sql";
const BLOG_JSON = path.join(ROOT, "src/data/blog.json");
const BLOG_CONTENT_DIR = path.join(ROOT, "src/data/blog");

// Map WordPress category slugs to portfolio blogCategories
const WP_CAT_MAP = {
  razno: "zagrebancije",
  savjeti: "savjeti",
  koncerti: "koncerti",
  koncert: "koncerti",
  sport: "sport",
  nogomet: "nogomet",
  rukomet: "rukomet",
  kosarka: "kosarka",
  putovanja: "putovanja",
  auti: "auti",
  auto: "auti",
  avioni: "avioni",
  info: "info",
  macro: "macro",
  zagrebancije: "zagrebancije",
  kucnecarolije: "kucnecarolije",
  "kućne čarolije": "kucnecarolije",
  uncategorized: "zagrebancije",
  nezaobilazno: "zagrebancije",
  delta: "auti",
  irska: "putovanja",
  hrvatska: "putovanja",
  izložbe: "info",
  izložba: "info",
  fotografija: "info",
  tehnika: "info",
  stock: "savjeti",
  workflow: "savjeti",
};

function slugify(str) {
  if (!str || typeof str !== "string") return "";
  return str
    .toLowerCase()
    .trim()
    .replace(/dž/gi, "dz")
    .replace(/đ/gi, "dj")
    .replace(/[čć]/g, "c")
    .replace(/[š]/g, "s")
    .replace(/[ž]/g, "z")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function toYYMMDD(dateStr) {
  if (!dateStr || typeof dateStr !== "string") return null;
  const m = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const [, y, mo, d] = m;
  return `${y.slice(-2)}${mo}${d}`;
}

function generateBlogSlug(title, date) {
  const titlePart = slugify(title) || `post-${Date.now()}`;
  const datePrefix = date ? toYYMMDD(date) : null;
  return datePrefix ? `${datePrefix}-${titlePart}` : titlePart;
}

/**
 * Parse MySQL INSERT VALUES - extract rows from ALL INSERT statements for table.
 * Handles escaped strings, nested parens in content.
 * MySQL dump može imati više INSERT naredbi (chunked).
 */
function parseInsertValues(text, tableName) {
  const insertRegex = new RegExp(
    `INSERT INTO \`${tableName}\`[^V]+VALUES\\s*`,
    "gi"
  );
  const allRows = [];
  let match;
  while ((match = insertRegex.exec(text)) !== null) {
    const start = match.index + match[0].length;
    const chunk = text.slice(start);
    const rows = parseInsertChunk(chunk);
    allRows.push(...rows);
  }
  return allRows;
}

function parseInsertChunk(chunk) {
  const rows = [];
  let i = 0;
  const len = chunk.length;

  function skipWhitespace() {
    while (i < len && /[\s,]/.test(chunk[i])) i++;
  }

  function parseValue() {
    skipWhitespace();
    if (i >= len) return null;
    const ch = chunk[i];
    if (ch === "N" && chunk.slice(i, i + 4) === "NULL") {
      i += 4;
      return null;
    }
    if (ch === "(") {
      i++;
      const row = [];
      while (i < len) {
        skipWhitespace();
        if (chunk[i] === ")") {
          i++;
          return row;
        }
        const v = parseValue();
        row.push(v);
        skipWhitespace();
        if (chunk[i] === ")") {
          i++;
          return row;
        }
        if (chunk[i] === ",") i++;
      }
      return row;
    }
    if (ch === "'") {
      i++;
      let s = "";
      while (i < len) {
        const c = chunk[i];
        if (c === "\\") {
          i++;
          if (i < len) {
            const next = chunk[i];
            if (next === "n") s += "\n";
            else if (next === "r") s += "\r";
            else if (next === "t") s += "\t";
            else if (next === "0") s += "\0";
            else s += next;
            i++;
          }
        } else if (c === "'") {
          i++;
          break;
        } else {
          s += c;
          i++;
        }
      }
      return s;
    }
    if (/[0-9-]/.test(ch)) {
      let num = "";
      while (i < len && /[0-9.-]/.test(chunk[i])) {
        num += chunk[i++];
      }
      return num;
    }
    return null;
  }

  while (i < len) {
    skipWhitespace();
    if (chunk[i] === ";") break;
    const row = parseValue();
    if (Array.isArray(row) && row.length > 0) {
      rows.push(row);
    }
    skipWhitespace();
    if (chunk[i] === ",") i++;
  }
  return rows;
}

/**
 * wp_posts columns: ID, post_author, post_date, post_date_gmt, post_content, post_title,
 * post_excerpt, post_status, comment_status, ping_status, post_password, post_name,
 * to_ping, pinged, post_modified, post_modified_gmt, post_content_filtered, post_parent,
 * guid, menu_order, post_type, post_mime_type, comment_count
 * Indices: 0-ID, 1-author, 2-date, 3-date_gmt, 4-content, 5-title, 6-excerpt, 7-status,
 * 8,9,10,11-name,12,13,14,15,16,17-guid,18,19-type,20-mime,21
 */
function extractPosts(rows) {
  const posts = [];
  for (const row of rows) {
    if (row.length < 23) continue;
    // wp_posts: 0-ID, 1-author, 2-date, 3-date_gmt, 4-content, 5-title, 6-excerpt, 7-status,
    // 8,9,10, 11-post_name, 12,13,14,15,16,17-parent, 18-guid, 19-menu_order, 20-post_type, 21-mime, 22-count
    const postType = row[20];
    const postStatus = row[7];
    if (postType !== "post" || postStatus !== "publish") continue;

    const id = row[0];
    const postDate = row[2];
    const content = row[4] || "";
    const title = row[5] || "";
    const postName = row[11] || ""; // post_name (slug)

    const dateMatch = String(postDate).match(/^(\d{4})-(\d{2})-(\d{2})/);
    const date = dateMatch ? `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}` : "2020-01-01";

    posts.push({
      wpId: id,
      title: title,
      date,
      postName,
      content,
    });
  }
  return posts;
}

/**
 * Parse wp_term_relationships: (object_id, term_taxonomy_id, term_order)
 */
function parseTermRelationships(text) {
  const rows = parseInsertValues(text, "wp_term_relationships");
  const map = {};
  for (const row of rows) {
    if (row.length >= 2) {
      const objectId = String(row[0]);
      const termTaxonomyId = String(row[1]);
      if (!map[objectId]) map[objectId] = [];
      map[objectId].push(termTaxonomyId);
    }
  }
  return map;
}

/**
 * Parse wp_term_taxonomy: (term_taxonomy_id, term_id, taxonomy, description, parent, count)
 */
function parseTermTaxonomy(text) {
  const rows = parseInsertValues(text, "wp_term_taxonomy");
  const map = {};
  for (const row of rows) {
    if (row.length >= 3 && row[2] === "category") {
      map[String(row[0])] = String(row[1]);
    }
  }
  return map;
}

/**
 * Parse wp_terms: (term_id, name, slug, term_group)
 */
function parseTerms(text) {
  const rows = parseInsertValues(text, "wp_terms");
  const map = {};
  for (const row of rows) {
    if (row.length >= 3) {
      map[String(row[0])] = { name: row[1], slug: row[2] };
    }
  }
  return map;
}

function mapCategory(wpSlug) {
  const s = (wpSlug || "").toLowerCase().trim();
  return WP_CAT_MAP[s] || slugify(wpSlug) || "zagrebancije";
}

/** Convert WordPress HTML to clean HTML (strip shortcodes, fix img src) */
function cleanHtml(html) {
  if (!html) return "";
  let out = html
    .replace(/\[[\w\s="']+\]/g, "") // [shortcode] [toggle title="x"]...[/toggle]
    .replace(/\[\/[\w]+\]/g, "")
    .replace(/\[divider[^\]]*\]/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/http:\/\/foto\.drusany\.com\/wp-content\/uploads/g, "/uploads/wordpress")
    .replace(/http:\/\/blog\.drusany\.com\/wp-content\/uploads/g, "/uploads/wordpress")
    .replace(/https:\/\/foto\.drusany\.com\/wp-content\/uploads/g, "/uploads/wordpress")
    .replace(/https:\/\/blog\.drusany\.com\/wp-content\/uploads/g, "/uploads/wordpress");
  return out;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const doAll = args.includes("--all");
  const limitIdx = args.indexOf("--limit");
  const limitArg = limitIdx >= 0 ? parseInt(args[limitIdx + 1], 10) : null;

  // Default: 1 post za provjeru. --all = svi, --limit N = N postova.
  const limit = limitArg ?? (doAll ? null : 1);

  if (!doAll && !limitArg && limit === 1) {
    console.log("Import 1 posta (provjera). Za sve: --all\n");
  }

  console.log("Reading SQL dump...");
  const sql = await readFile(BACKUP_PATH, "utf-8");

  console.log("Parsing wp_posts...");
  const allRows = parseInsertValues(sql, "wp_posts");
  console.log(`  Total rows: ${allRows.length}`);

  const posts = extractPosts(allRows);
  console.log(`  Published posts: ${posts.length}`);

  console.log("Parsing categories...");
  const rel = parseTermRelationships(sql);
  const tax = parseTermTaxonomy(sql);
  const terms = parseTerms(sql);

  for (const p of posts) {
    const termIds = rel[String(p.wpId)] || [];
    const catSlugs = [];
    for (const ttId of termIds) {
      const termId = tax[ttId];
      if (termId && terms[termId]) {
        const slug = mapCategory(terms[termId].slug);
        if (slug && !catSlugs.includes(slug)) catSlugs.push(slug);
      }
    }
    p.categories = catSlugs.length ? catSlugs : ["zagrebancije"];
  }

  let existingPosts = [];
  try {
    const blogRaw = await readFile(BLOG_JSON, "utf-8");
    const blog = JSON.parse(blogRaw);
    existingPosts = blog.posts || [];
  } catch {
    // fresh start
  }

  const existingSlugs = new Set(existingPosts.map((p) => p.slug));

  // Kad je limit postavljen, uzimamo prve N koji još ne postoje
  let toImport;
  if (limit) {
    toImport = [];
    for (const p of posts) {
      const slug = generateBlogSlug(p.title, p.date);
      if (!existingSlugs.has(slug)) {
        toImport.push(p);
        if (toImport.length >= limit) break;
      }
    }
  } else {
    toImport = posts.filter((p) => !existingSlugs.has(generateBlogSlug(p.title, p.date)));
  }

  console.log(`\nImporting ${toImport.length} posts (${existingPosts.length} već u blog.json)...`);

  const newPosts = [];

  for (const p of toImport) {
    const slug = generateBlogSlug(p.title, p.date);
    existingSlugs.add(slug);

    const post = {
      id: crypto.randomUUID(),
      title: p.title,
      slug,
      date: p.date,
      categories: p.categories,
      thumbnail: "",
      thumbnailFocus: "50% 50%",
      gallery: [],
      galleryMetadata: {},
      featured: false,
      status: "published",
      seo: { metaTitle: "", metaDescription: "", keywords: "" },
    };

    newPosts.push({ post, content: cleanHtml(p.content) });
  }

  if (dryRun) {
    console.log("\n[DRY RUN] Would create:");
    for (const { post } of newPosts) {
      console.log(`  - ${post.slug}: ${post.title} (${post.date}) [${post.categories.join(", ")}]`);
    }
    return;
  }

  await mkdir(BLOG_CONTENT_DIR, { recursive: true });

  for (const { post, content } of newPosts) {
    const htmlPath = path.join(BLOG_CONTENT_DIR, `${post.slug}.html`);
    await writeFile(htmlPath, content, "utf-8");
    console.log(`  Wrote ${post.slug}.html`);
  }

  const updatedPosts = [...existingPosts, ...newPosts.map(({ post }) => post)];
  updatedPosts.sort((a, b) => b.date.localeCompare(a.date));

  await writeFile(
    BLOG_JSON,
    JSON.stringify({ posts: updatedPosts }, null, 2),
    "utf-8"
  );
  console.log(`\nUpdated blog.json with ${updatedPosts.length} posts.`);
  console.log(`Imported ${newPosts.length} new posts from WordPress backup.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
