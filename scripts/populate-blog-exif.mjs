#!/usr/bin/env node
/**
 * Popunjava blogExif.json EXIF podacima iz postojećih blog galerijskih slika.
 * Koristi exifr za čitanje - radi samo ako slike imaju EXIF (npr. originalni JPEG prije konverzije).
 * Za nove slike EXIF se automatski sprema pri uploadu.
 * Pokreni: node scripts/populate-blog-exif.mjs
 */
import { readFile, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import exifr from "exifr";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function formatExposure(sec) {
  if (typeof sec !== "number" || sec <= 0) return null;
  if (sec >= 1) return `${sec}"`;
  const frac = 1 / sec;
  if (frac >= 1 && Math.abs(frac - Math.round(frac)) < 0.01) return `1/${Math.round(frac)}`;
  return `${sec}s`;
}

function formatAperture(fnum) {
  if (typeof fnum !== "number" || fnum <= 0) return null;
  return `f/${fnum}`;
}

function formatLensInfo(arr) {
  if (!Array.isArray(arr) || arr.length < 4) return null;
  const [minFocal, maxFocal, minF, maxF] = arr.map(Number);
  if (!minFocal || minFocal <= 0) return null;
  const focal = minFocal === maxFocal ? `${minFocal}mm` : `${minFocal}-${maxFocal}mm`;
  const fnum = minF > 0 ? ` f/${minF}` : "";
  return `${focal}${fnum}`.trim() || null;
}

function getExifExtras(exif) {
  const make = typeof exif.Make === "string" ? exif.Make.trim() : "";
  const model = typeof exif.Model === "string" ? exif.Model.trim() : "";
  const camera =
    model && (!make || !model.toLowerCase().startsWith(make.toLowerCase()))
      ? [make, model].filter(Boolean).join(" ")
      : model || make || null;
  let lens = (typeof exif.LensModel === "string" && exif.LensModel.trim()) || null;
  if (!lens) lens = formatLensInfo(exif.LensInfo);
  if (!lens && typeof exif.Lens === "string" && exif.Lens.trim()) lens = exif.Lens.trim();
  if (!lens && typeof exif.LensMake === "string" && exif.LensMake.trim()) lens = exif.LensMake.trim();
  const exposure = formatExposure(exif.ExposureTime);
  const aperture = formatAperture(exif.FNumber);
  const iso = typeof exif.ISO === "number" && exif.ISO > 0 ? exif.ISO : null;
  return { camera, lens, exposure, aperture, iso };
}

async function main() {
  const blogPath = path.join(root, "src", "data", "blog.json");
  const exifPath = path.join(root, "src", "data", "blogExif.json");

  const blogRaw = await readFile(blogPath, "utf-8");
  const blog = JSON.parse(blogRaw);
  let exifData = {};
  try {
    const exifRaw = await readFile(exifPath, "utf-8");
    exifData = JSON.parse(exifRaw);
  } catch {
    // start fresh
  }

  let count = 0;
  for (const post of blog.posts || []) {
    for (const url of post.gallery || []) {
      if (!url || url.startsWith("http")) continue;
      const filePath = path.join(root, "public", url.startsWith("/") ? url.slice(1) : url);
      const src = url.startsWith("/") ? url : `/${url}`;
      if (exifData[src]) {
        console.log(`Skip (već ima EXIF): ${src}`);
        continue;
      }
      try {
        const buffer = await readFile(filePath);
        const exif = await exifr.parse(buffer, {
          userComment: true,
          makerNote: true,
          xmp: true,
          iptc: true,
          mergeOutput: true,
        });
        if (exif) {
          const extras = getExifExtras(exif);
          if (extras.camera || extras.lens || extras.exposure || extras.aperture || extras.iso != null) {
            exifData[src] = {
              ...(extras.camera && { camera: extras.camera }),
              ...(extras.lens && { lens: extras.lens }),
              ...(extras.exposure && { exposure: extras.exposure }),
              ...(extras.aperture && { aperture: extras.aperture }),
              ...(extras.iso != null && { iso: extras.iso }),
            };
            count++;
            console.log(`+ ${src}: ${extras.camera || "?"}`);
          }
        }
      } catch (err) {
        // nema EXIF ili ne može parsirati
      }
    }
  }

  await writeFile(exifPath, JSON.stringify(exifData, null, 2), "utf-8");
  console.log(`\nblogExif.json ažuriran. Dodano ${count} novih EXIF unosa.`);
}

main().catch(console.error);
