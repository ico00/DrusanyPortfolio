export function slugify(str: string): string {
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
