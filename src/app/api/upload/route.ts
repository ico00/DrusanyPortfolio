import { writeFile, readFile, mkdir, access, stat } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import sharp from "sharp";
import exifr from "exifr";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/** Sanitize for slug: lowercase, spaces to hyphens, remove special chars */
function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[čć]/g, "c")
    .replace(/[š]/g, "s")
    .replace(/[ž]/g, "z")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Generate slug from title, venue, year */
function generateSlug(
  title: string,
  venue: string | undefined,
  capturedAt: string
): string {
  const parts: string[] = [];
  if (title?.trim()) parts.push(slugify(title));
  if (venue?.trim()) {
    const v = slugify(venue);
    if (v && !parts.some((p) => p.includes(v))) parts.push(v);
  }
  const year = capturedAt ? new Date(capturedAt).getFullYear() : null;
  if (year && !isNaN(year)) parts.push(String(year));
  return parts.filter(Boolean).join("-") || `image-${Date.now()}`;
}

/** Sanitize folder name: lowercase, spaces to hyphens, remove special chars */
function sanitizeFolderName(name: string): string {
  const s = name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "");
  return s || "uncategorized";
}

/** Sanitize filename: lowercase, spaces to hyphens, remove special chars, keep extension */
function sanitizeFilename(originalName: string): string {
  const name = originalName || "image";
  const ext = path.extname(name).toLowerCase() || ".webp";
  const base = path.basename(name, path.extname(name)) || "image";
  const sanitized = base
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "")
    .slice(0, 100);
  return (sanitized || "image") + ext;
}

/** Check if file exists (for duplicate detection) */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export interface GalleryImage {
  id: string;
  title: string;
  category: string;
  alt: string;
  src: string;
  thumb: string;
  width: number;
  height: number;
  capturedAt: string;
  createdAt: string;
  isHero?: boolean;
  camera?: string;
  lens?: string;
  exposure?: string;
  aperture?: string;
  iso?: number;
  venue?: string;
  sport?: string;
  foodDrink?: string;
  keywords?: string;
  slug?: string;
}

function dateToISO(value: unknown): string | null {
  if (value instanceof Date && !isNaN(value.getTime())) return value.toISOString();
  return null;
}

function formatExposure(sec: unknown): string | null {
  if (typeof sec !== "number" || sec <= 0) return null;
  if (sec >= 1) return `${sec}"`;
  const frac = 1 / sec;
  if (frac >= 1 && Math.abs(frac - Math.round(frac)) < 0.01) return `1/${Math.round(frac)}`;
  return `${sec}s`;
}

function formatAperture(fnum: unknown): string | null {
  if (typeof fnum !== "number" || fnum <= 0) return null;
  return `f/${fnum}`;
}

function formatLensInfo(arr: unknown): string | null {
  if (!Array.isArray(arr) || arr.length < 4) return null;
  const [minFocal, maxFocal, minF, maxF] = arr.map(Number);
  if (!minFocal || minFocal <= 0) return null;
  const focal =
    minFocal === maxFocal ? `${minFocal}mm` : `${minFocal}-${maxFocal}mm`;
  const fnum = minF > 0 ? ` f/${minF}` : "";
  return `${focal}${fnum}`.trim() || null;
}

function getExifExtras(exif: Record<string, unknown>): {
  camera: string | null;
  lens: string | null;
  exposure: string | null;
  aperture: string | null;
  iso: number | null;
} {
  const make = typeof exif.Make === "string" ? exif.Make.trim() : "";
  const model = typeof exif.Model === "string" ? exif.Model.trim() : "";
  const camera =
    model && (!make || !model.toLowerCase().startsWith(make.toLowerCase()))
      ? [make, model].filter(Boolean).join(" ")
      : model || make || null;
  let lens =
    (typeof exif.LensModel === "string" && exif.LensModel.trim()) || null;
  if (!lens) lens = formatLensInfo(exif.LensInfo);
  if (!lens && typeof exif.Lens === "string" && exif.Lens.trim()) {
    lens = exif.Lens.trim();
  }
  if (!lens && typeof exif.LensMake === "string" && exif.LensMake.trim()) {
    lens = exif.LensMake.trim();
  }
  const exposure = formatExposure(exif.ExposureTime);
  const aperture = formatAperture(exif.FNumber);
  const iso =
    typeof exif.ISO === "number" && exif.ISO > 0 ? exif.ISO : null;
  return { camera, lens, exposure, aperture, iso };
}

function getExifDescription(exif: Record<string, unknown>): string {
  // EXIF ImageDescription (IFD0)
  const ifd0 = exif.ifd0 as Record<string, unknown> | undefined;
  const imgDesc = exif.ImageDescription ?? ifd0?.ImageDescription;
  if (typeof imgDesc === "string" && imgDesc.trim()) return imgDesc.trim();

  // EXIF UserComment
  const userComment = exif.UserComment;
  if (typeof userComment === "string" && userComment.trim()) return userComment.trim();
  if (Buffer.isBuffer(userComment)) {
    let str = userComment.toString("utf8");
    if (str.startsWith("UNICODE\0")) str = str.slice(8);
    else if (str.startsWith("ASCII\0\0\0")) str = str.slice(8);
    const trimmed = str.replace(/\0/g, "").trim();
    if (trimmed) return trimmed;
  }

  // XMP dc:description (Dublin Core)
  const dcDesc = exif["dc:description"] ?? exif.description;
  if (typeof dcDesc === "string" && dcDesc.trim()) return dcDesc.trim();
  if (dcDesc && typeof dcDesc === "object" && "value" in dcDesc && typeof (dcDesc as { value?: string }).value === "string") {
    const val = (dcDesc as { value: string }).value.trim();
    if (val) return val;
  }

  // XMP XPTitle
  const xpTitle = exif.XPTitle ?? exif.xptitle;
  if (typeof xpTitle === "string" && xpTitle.trim()) return xpTitle.trim();

  // IPTC Caption
  const iptc = (exif as Record<string, unknown>).iptc;
  const iptcCaption = (iptc && typeof iptc === "object" && "Caption" in iptc ? (iptc as { Caption?: string }).Caption : null) ?? exif.Caption;
  if (typeof iptcCaption === "string" && iptcCaption.trim()) return iptcCaption.trim();

  return "";
}

function getKeywords(exif: Record<string, unknown>): string {
  const dcSubject = exif["dc:subject"] ?? exif.Subject ?? exif.subject;
  if (Array.isArray(dcSubject) && dcSubject.length > 0) {
    return dcSubject.map((s) => (typeof s === "string" ? s : String(s))).join(", ");
  }
  if (typeof dcSubject === "string" && dcSubject.trim()) return dcSubject.trim();

  const keywords = exif.Keywords ?? exif.keywords;
  if (Array.isArray(keywords) && keywords.length > 0) {
    return keywords.map((k) => (typeof k === "string" ? k : String(k))).join(", ");
  }
  if (typeof keywords === "string" && keywords.trim()) return keywords.trim();

  const iptc = (exif as Record<string, unknown>).iptc;
  const iptcKeywords = iptc && typeof iptc === "object" && "Keywords" in iptc ? (iptc as { Keywords?: string[] }).Keywords : null;
  if (Array.isArray(iptcKeywords) && iptcKeywords.length > 0) {
    return iptcKeywords.join(", ");
  }

  return "";
}

export interface GalleryData {
  images: GalleryImage[];
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return new Response(
      JSON.stringify({ error: "Upload only available in development mode" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    let title = (formData.get("title") as string) || "";
    const category = (formData.get("category") as string) || "uncategorized";
    const isHero = formData.get("isHero") === "true";
    const formCapturedAt = (formData.get("capturedAt") as string) || "";
    const venue = (formData.get("venue") as string) || "";
    const sport = (formData.get("sport") as string) || "";
    const foodDrink = (formData.get("foodDrink") as string) || "";
    const formKeywords = (formData.get("keywords") as string) || "";
    const formSlug = (formData.get("slug") as string) || "";
    const overwrite = formData.get("overwrite") === "true";
    const addWithSuffix = formData.get("addWithSuffix") === "true";

    if (!file || !(file instanceof File)) {
      return new Response(
        JSON.stringify({ error: "No file provided" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return new Response(
        JSON.stringify({
          error: `Invalid file type. Allowed: ${ALLOWED_TYPES.join(", ")}`,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const categorySlug = sanitizeFolderName(category);
    const fullDir = path.join(process.cwd(), "public", "uploads", "full", categorySlug);
    const thumbsDir = path.join(process.cwd(), "public", "uploads", "thumbs", categorySlug);
    await mkdir(fullDir, { recursive: true });
    await mkdir(thumbsDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    const originalBase = sanitizeFilename(file.name);
    let baseFilename = path.basename(originalBase, path.extname(originalBase)) + ".webp";
    const fullPathCheck = path.join(fullDir, baseFilename);

    if (await fileExists(fullPathCheck) && !overwrite) {
      if (addWithSuffix) {
        let n = 2;
        const ext = path.extname(baseFilename);
        const base = path.basename(baseFilename, ext);
        while (await fileExists(path.join(fullDir, `${base}_${n}${ext}`))) n++;
        baseFilename = `${base}_${n}${ext}`;
      } else {
        const existingSrc = `/uploads/full/${categorySlug}/${baseFilename}`;
        const existingThumb = `/uploads/thumbs/${categorySlug}/${baseFilename}`;
        let existingSize: number | null = null;
        try {
          const st = await stat(fullPathCheck);
          existingSize = st.size;
        } catch {
          // ignore
        }
        return new Response(
          JSON.stringify({
            error: "Duplicate",
            message: `"${baseFilename}" already exists in this category.`,
            filename: baseFilename,
            existingSrc,
            existingThumb,
            existingSize,
          }),
          { status: 409, headers: { "Content-Type": "application/json" } }
        );
      }
    }
    const fullFilename = baseFilename;
    const thumbFilename = fullFilename;

    const image = sharp(buffer);
    const metadata = await image.metadata();
    const originalWidth = metadata.width ?? 0;
    const originalHeight = metadata.height ?? 0;

    let capturedAt = new Date().toISOString();
    let exifDescription = "";
    let camera: string | undefined;
    let lens: string | undefined;
    let exposure: string | undefined;
    let aperture: string | undefined;
    let iso: number | undefined;
    let exifKeywords = "";

    try {
      const exif = await exifr.parse(buffer, {
        userComment: true,
        makerNote: true,
        xmp: true,
        iptc: true,
        mergeOutput: true,
      });
      if (exif?.DateTimeOriginal) {
        const parsed = dateToISO(exif.DateTimeOriginal);
        if (parsed) capturedAt = parsed;
      }
      if (exif) {
        exifDescription = getExifDescription(exif as Record<string, unknown>);
        exifKeywords = getKeywords(exif as Record<string, unknown>);
        const extras = getExifExtras(exif as Record<string, unknown>);
        camera = extras.camera ?? undefined;
        lens = extras.lens ?? undefined;
        exposure = extras.exposure ?? undefined;
        aperture = extras.aperture ?? undefined;
        iso = extras.iso ?? undefined;
      }
    } catch {
      // EXIF parse failed, keep defaults
    }

    if (!title && exifDescription) title = exifDescription;
    const alt = title || exifDescription || "Gallery image";

    if (formCapturedAt) {
      const parsed = new Date(formCapturedAt);
      if (!isNaN(parsed.getTime())) capturedAt = parsed.toISOString();
    }

    const keywords = formKeywords.trim() || exifKeywords || undefined;

    const fullPath = path.join(fullDir, fullFilename);
    const thumbPath = path.join(thumbsDir, thumbFilename);
    const src = `/uploads/full/${categorySlug}/${fullFilename}`;

    const galleryPath = path.join(process.cwd(), "src", "data", "gallery.json");
    const galleryRaw = await readFile(galleryPath, "utf-8");
    const gallery: GalleryData = JSON.parse(galleryRaw);
    const existing = gallery.images.find((img) => img.src === src);
    const categoryImages = gallery.images.filter(
      (img) => sanitizeFolderName(img.category) === categorySlug
    );

    let slug: string;
    if (overwrite && existing) {
      const raw = formSlug.trim() ? slugify(formSlug.trim()) : (existing.slug ?? generateSlug(title, venue, capturedAt));
      slug = raw || existing.slug || `image-${Date.now()}`;
    } else {
      slug = formSlug.trim() || generateSlug(title, venue, capturedAt);
      slug = slugify(slug) || `image-${Date.now()}`;
      let slugBase = slug;
      let n = 2;
      while (categoryImages.some((img) => img.slug === slug)) {
        slug = `${slugBase}-${n}`;
        n++;
      }
    }
    const thumb = `/uploads/thumbs/${categorySlug}/${thumbFilename}`;

    await image
      .resize(2048, undefined, { withoutEnlargement: true })
      .webp({ quality: 85 })
      .toFile(fullPath);

    const thumbBuffer = Buffer.from(await file.arrayBuffer());
    await sharp(thumbBuffer)
      .resize(600, undefined, { withoutEnlargement: true })
      .webp({ quality: 75 })
      .toFile(thumbPath);

    const resizedMetadata = await sharp(fullPath).metadata();
    const width = resizedMetadata.width ?? originalWidth;
    const height = resizedMetadata.height ?? originalHeight;

    if (overwrite) {
      const existing = gallery.images.find((img) => img.src === src);
      if (existing) {
        existing.title = title;
        existing.alt = alt;
        existing.width = width;
        existing.height = height;
        existing.capturedAt = capturedAt;
        existing.camera = camera;
        existing.lens = lens;
        existing.exposure = exposure;
        existing.aperture = aperture;
        existing.iso = iso;
        if (venue) existing.venue = venue;
        if (sport) existing.sport = sport;
        if (foodDrink) (existing as { foodDrink?: string }).foodDrink = foodDrink;
        if (keywords) existing.keywords = keywords;
        if (slug) existing.slug = slug;
        if (isHero) existing.isHero = true;
        await writeFile(galleryPath, JSON.stringify(gallery, null, 2));
        return Response.json({
          success: true,
          id: existing.id,
          src,
          thumb,
          image: existing,
          overwritten: true,
        });
      }
    }

    const id = randomUUID();
    const createdAt = new Date().toISOString();
    const newImage: GalleryImage = {
      id,
      title,
      category,
      alt,
      src,
      thumb,
      width,
      height,
      capturedAt,
      createdAt,
      ...(isHero && { isHero: true }),
      ...(camera && { camera }),
      ...(lens && { lens }),
      ...(exposure && { exposure }),
      ...(aperture && { aperture }),
      ...(iso != null && { iso }),
      ...(venue && { venue }),
      ...(sport && { sport }),
      ...(foodDrink && { foodDrink }),
      ...(keywords && { keywords }),
      ...(slug && { slug }),
    };
    gallery.images.push(newImage);
    await writeFile(galleryPath, JSON.stringify(gallery, null, 2));

    return Response.json({
      success: true,
      id,
      src,
      thumb,
      image: newImage,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Upload failed",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
