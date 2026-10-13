import path from "path";

/** Transliterate Croatian diacritics to ASCII (č→c, ć→c, š→s, ž→z, đ→dj, dž→dz) */
export function transliterateCroatian(str: string): string {
  return str
    .replace(/dž/gi, "dz")
    .replace(/đ/gi, "dj")
    .replace(/[čćČĆ]/g, "c")
    .replace(/[šŠ]/g, "s")
    .replace(/[žŽ]/g, "z");
}

const GENERIC_NAMES = ["", "image", "blob", "untitled"];

/**
 * Sanitizira naziv datoteke: lowercase, razmaci u crtice, uklanja specijalne znakove.
 * Vraća zadanu ekstenziju (.webp), ili options.ext ako je zadan (npr. za GIF-ove koji
 * moraju zadržati .gif kako bi animacija ostala sačuvana).
 *
 * @param originalName – originalni naziv datoteke
 * @param options.slug – opcionalno, za fallback kad je naziv generički (npr. "image", "blob")
 * @param options.index – opcionalno, indeks za fallback (npr. "slug-1", "slug-2")
 * @param options.ext – opcionalno, ekstenzija bez točke (zadano "webp")
 */
export function sanitizeFilename(
  originalName: string,
  options?: { slug?: string; index?: number; ext?: string }
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
      options?.slug != null && options?.index != null
        ? `${options.slug}-${options.index}`
        : options?.slug
          ? `${options.slug}-${Date.now()}`
          : `image-${Date.now()}`;
  } else if (/^\d+$/.test(sanitized) && options?.slug) {
    sanitized = `${options.slug}-${sanitized}`;
  }

  return `${sanitized}.${options?.ext || "webp"}`;
}

/** Sanitizira naziv foldera (npr. kategorija): lowercase, crtice, dozvoljava underscore */
export function sanitizeFolderName(name: string): string {
  const s = transliterateCroatian(name)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "");
  return s || "uncategorized";
}
