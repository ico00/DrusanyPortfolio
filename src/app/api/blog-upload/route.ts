import { mkdir, access, stat, readFile, writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";
import exifr from "exifr";
import { getBlogUploadDir } from "@/lib/blog";
import { hasValidImageSignature } from "@/lib/imageValidation";
import { getExifExtras } from "@/lib/exif";
import { checkRateLimit } from "@/lib/rateLimit";

const BLOG_EXIF_PATH = path.join(process.cwd(), "src", "data", "blogExif.json");

async function saveBlogExif(url: string, exif: { camera?: string; lens?: string; exposure?: string; aperture?: string; iso?: number }) {
  let data: Record<string, { camera?: string; lens?: string; exposure?: string; aperture?: string; iso?: number }> = {};
  try {
    const raw = await readFile(BLOG_EXIF_PATH, "utf-8");
    data = JSON.parse(raw) as typeof data;
  } catch {
    // file doesn't exist or invalid
  }
  const hasAny = exif.camera || exif.lens || exif.exposure || exif.aperture || exif.iso != null;
  if (hasAny) {
    data[url] = exif;
  } else {
    delete data[url];
  }
  await writeFile(BLOG_EXIF_PATH, JSON.stringify(data, null, 2), "utf-8");
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

function sanitizeSlug(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Transliterate Croatian diacritics to ASCII */
function transliterateCroatian(str: string): string {
  return str
    .replace(/dž/gi, "dz")
    .replace(/đ/gi, "dj")
    .replace(/[čćČĆ]/g, "c")
    .replace(/[šŠ]/g, "s")
    .replace(/[žŽ]/g, "z");
}

const GENERIC_NAMES = ["", "image", "blob", "untitled"];

/** Sanitize filename: lowercase, spaces to hyphens, remove special chars, keep extension as .webp */
function sanitizeFilename(
  originalName: string,
  slug?: string,
  index?: number
): string {
  const name = (originalName || "").trim();
  const base = name ? path.basename(name, path.extname(name)) : "";
  let sanitized = transliterateCroatian(base)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "")
    .slice(0, 100);
  if (!sanitized || GENERIC_NAMES.includes(sanitized)) {
    sanitized =
      slug && index != null
        ? `${slug}-${index}`
        : slug
          ? `${slug}-${Date.now()}`
          : `image-${Date.now()}`;
  } else if (/^\d+$/.test(sanitized) && slug) {
    sanitized = `${slug}-${sanitized}`;
  }
  return sanitized + ".webp";
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const rateLimitRes = checkRateLimit(request);
  if (rateLimitRes) return rateLimitRes;
  if (process.env.NODE_ENV !== "development") {
    return Response.json(
      { error: "Samo u development modu" },
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const slug = sanitizeSlug((formData.get("slug") as string) || "");
    const date = (formData.get("date") as string) || "";
    const type = formData.get("type") as "featured" | "gallery" | "content" | null;
    const overwrite = formData.get("overwrite") === "true";
    const addWithSuffix = formData.get("addWithSuffix") === "true";
    const indexStr = formData.get("index") as string | null;
    const index = indexStr != null ? parseInt(indexStr, 10) : undefined;
    const originalFilename = (formData.get("originalFilename") as string) || "";

    if (!slug) {
      return Response.json(
        { error: "Slug je obavezan (unesi naslov pa spremi)" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return Response.json(
        { error: "Datum je obavezan (YYYY-MM-DD)" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const folderName = `${date}-${slug}`;

    if (!file || !(file instanceof File)) {
      return Response.json(
        { error: "Nema datoteke" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return Response.json(
        {
          error: `Neispravan tip. Dozvoljeno: ${ALLOWED_TYPES.join(", ")}`,
        },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return Response.json(
        {
          error: `Datoteka prevelika. Maksimalno: ${MAX_FILE_SIZE_BYTES / 1024 / 1024} MB`,
        },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const baseDir = getBlogUploadDir(slug, date);
    const buffer = Buffer.from(await file.arrayBuffer());
    if (!hasValidImageSignature(buffer)) {
      return Response.json(
        {
          error: "Neispravna datoteka: nije valjana slika (provjera magic bytes)",
        },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (type === "featured") {
      await mkdir(baseDir, { recursive: true });
      const outPath = path.join(baseDir, "featured.webp");
      await sharp(buffer)
        .rotate()
        .keepExif()
        .resize(2048, undefined, { withoutEnlargement: true })
        .webp({ quality: 85 })
        .toFile(outPath);
      const url = `/uploads/blog/${folderName}/featured.webp`;
      return Response.json({ success: true, url });
    }

    if (type === "gallery") {
      const galleryDir = path.join(baseDir, "gallery");
      await mkdir(galleryDir, { recursive: true });
      const nameToUse = (file.name || originalFilename).trim();
      let filename = sanitizeFilename(nameToUse || "image", slug, index);
      const outPath = path.join(galleryDir, filename);

      if (await fileExists(outPath) && !overwrite) {
        if (addWithSuffix) {
          const base = path.basename(filename, ".webp");
          let n = 2;
          while (await fileExists(path.join(galleryDir, `${base}_${n}.webp`))) n++;
          filename = `${base}_${n}.webp`;
        } else {
          const existingSrc = `/uploads/blog/${folderName}/gallery/${filename}`;
          let existingSize: number | null = null;
          try {
            const st = await stat(outPath);
            existingSize = st.size;
          } catch {
            // ignore
          }
          return Response.json(
            {
              error: "Duplicate",
              message: `"${filename}" već postoji u galeriji.`,
              filename,
              existingSrc,
              existingSize,
            },
            { status: 409, headers: { "Content-Type": "application/json" } }
          );
        }
      }

      const finalPath = path.join(galleryDir, filename);
      const url = `/uploads/blog/${folderName}/gallery/${filename}`;

      let camera: string | undefined;
      let lens: string | undefined;
      let exposure: string | undefined;
      let aperture: string | undefined;
      let iso: number | undefined;
      try {
        const exif = await exifr.parse(buffer, {
          userComment: true,
          makerNote: true,
          xmp: true,
          iptc: true,
          mergeOutput: true,
        });
        if (exif) {
          const extras = getExifExtras(exif as Record<string, unknown>);
          if (extras.camera) camera = extras.camera;
          if (extras.lens) lens = extras.lens;
          if (extras.exposure) exposure = extras.exposure;
          if (extras.aperture) aperture = extras.aperture;
          if (extras.iso != null) iso = extras.iso;
        }
      } catch {
        // EXIF parse failed
      }

      await sharp(buffer)
        .rotate() // primijeni EXIF orijentaciju (WebP u preglednicima ne podržava EXIF orientation)
        .keepExif() // zadrži EXIF u WebP datoteci
        .resize(2048, undefined, { withoutEnlargement: true })
        .webp({ quality: 85 })
        .toFile(finalPath);

      if (camera || lens || exposure || aperture || iso != null) {
        await saveBlogExif(url, { camera, lens, exposure, aperture, iso });
      }

      return Response.json({ success: true, url });
    }

    if (type === "content") {
      const contentDir = path.join(baseDir, "content");
      await mkdir(contentDir, { recursive: true });
      const nameToUse = (file.name || originalFilename).trim();
      const filename = sanitizeFilename(nameToUse || "image", slug);
      const outPath = path.join(contentDir, filename);
      await sharp(buffer)
        .rotate()
        .keepExif()
        .resize(2048, undefined, { withoutEnlargement: true })
        .webp({ quality: 85 })
        .toFile(outPath);
      const url = `/uploads/blog/${folderName}/content/${filename}`;
      return Response.json({ success: true, url });
    }

    return Response.json(
      { error: "type mora biti 'featured', 'gallery' ili 'content'" },
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Blog upload error:", error);
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Upload nije uspio",
      },
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
