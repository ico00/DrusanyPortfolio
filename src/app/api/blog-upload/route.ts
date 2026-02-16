import { mkdir, access, stat } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { getBlogUploadDir } from "@/lib/blog";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

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
    const type = formData.get("type") as "featured" | "gallery" | null;
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

    const baseDir = getBlogUploadDir(slug, date);
    const buffer = Buffer.from(await file.arrayBuffer());

    if (type === "featured") {
      await mkdir(baseDir, { recursive: true });
      const outPath = path.join(baseDir, "featured.webp");
      await sharp(buffer)
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
      await sharp(buffer)
        .resize(2048, undefined, { withoutEnlargement: true })
        .webp({ quality: 85 })
        .toFile(finalPath);
      const url = `/uploads/blog/${folderName}/gallery/${filename}`;
      return Response.json({ success: true, url });
    }

    return Response.json(
      { error: "type mora biti 'featured' ili 'gallery'" },
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
