/** Transliterate Croatian diacritics to ASCII (č→c, ć→c, š→s, ž→z, đ→dj, dž→dz) */
function transliterateCroatian(str: string): string {
  return str
    .replace(/dž/gi, "dz")
    .replace(/đ/gi, "dj")
    .replace(/[čćČĆ]/g, "c")
    .replace(/[šŠ]/g, "s")
    .replace(/[žŽ]/g, "z");
}

export function slugify(str: string): string {
  return transliterateCroatian(str)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Generate slug from title, venue, year (same logic as upload/update) */
export function generateSlug(
  title: string,
  venue: string | undefined,
  capturedAt: string | undefined
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

/**
 * Format date as yymmdd (2-digit year, month, day).
 * Input: YYYY-MM-DD
 */
function toYYMMDD(dateStr: string): string | null {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  const [, y, m, d] = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/) ?? [];
  if (!y || !m || !d) return null;
  return `${y.slice(-2)}${m}${d}`;
}

/** Generate blog slug: yymmdd-naslov (npr. 251228-advent-2025) */
export function generateBlogSlug(title: string, date?: string): string {
  const titlePart = slugify(title) || `post-${Date.now()}`;
  const datePrefix = date ? toYYMMDD(date) : null;
  return datePrefix ? `${datePrefix}-${titlePart}` : titlePart;
}
