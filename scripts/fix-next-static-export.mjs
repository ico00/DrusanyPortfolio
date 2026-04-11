#!/usr/bin/env node
/**
 * Legacy: generateStaticParams s slugom "naslov.html" stvarao je blog/foo.html.html,
 * blog/foo.html/ (samo __next.*) i blog/foo.html.txt — Apache je za /blog/foo.html
 * trebao jednu datoteku blog/foo.html.
 *
 * S "čistim" slugom (bez .html) export je blog/foo.html + blog/foo/* segmenti.
 * Ova skripta: briše samo direktorije čije ime završava na .html ako u njima su
 * isključivo __next* datoteke; preimenuje eventualne *.html.html → *.html;
 * briše *.html.txt (legacy). Za RSC/prefetch trebaju blog/foo/__next* — ne dira se.
 * Apache rewrite za .html.txt i .html/__next vidi public/.htaccess.
 */

import { readdir, rm, rename, unlink } from "fs/promises";
import { basename, join } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const OUT = join(__dirname, "..", "out");
const BLOG = join(OUT, "blog");

/**
 * Ukloni samo legacy direktorije čije ime završava na `.html` (npr. blog/foo.html/)
 * gdje je Next ostavio samo __next* — to se sudara s pravom stranicom blog/foo.html.
 * NE diraj blog/[slug]/ i blog/page/N/ — tamo su __next segmenti potrebni za App Router prefetch.
 */
async function removeNextInternalOnlyDirs(dir) {
  if (dir === BLOG) {
    const top = await readdir(dir, { withFileTypes: true });
    for (const e of top) {
      if (e.isDirectory()) {
        await removeNextInternalOnlyDirs(join(dir, e.name));
      }
    }
    return;
  }

  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.isDirectory()) {
      await removeNextInternalOnlyDirs(join(dir, e.name));
    }
  }

  const after = await readdir(dir, { withFileTypes: true });
  if (after.length === 0) {
    await rm(dir, { force: true });
    return;
  }
  const onlyInternal = after.every(
    (x) =>
      x.isFile() &&
      (x.name.startsWith("__next") || x.name === ".DS_Store"),
  );
  if (onlyInternal && basename(dir).endsWith(".html")) {
    await rm(dir, { recursive: true, force: true });
  }
}

async function* walkFiles(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      yield* walkFiles(full);
    } else {
      yield full;
    }
  }
}

async function main() {
  try {
    await readdir(BLOG);
  } catch {
    console.log("fix-next-static-export: nema out/blog, preskačem.");
    return;
  }

  await removeNextInternalOnlyDirs(BLOG);

  let renamed = 0;
  let removedTxt = 0;
  for await (const full of walkFiles(BLOG)) {
    if (full.endsWith(".html.html")) {
      const dest = full.slice(0, -5);
      await rename(full, dest);
      renamed++;
    } else if (full.endsWith(".html.txt")) {
      await unlink(full);
      removedTxt++;
    }
  }

  if (renamed || removedTxt) {
    console.log(
      `fix-next-static-export: preimenovano ${renamed} *.html.html → *.html, uklonjeno ${removedTxt} *.html.txt`,
    );
  }
}

main().catch((err) => {
  console.error("fix-next-static-export:", err);
  process.exit(1);
});
