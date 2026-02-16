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

/** Generate blog slug from title only (as you type) */
export function generateBlogSlug(title: string): string {
  return slugify(title) || `post-${Date.now()}`;
}
