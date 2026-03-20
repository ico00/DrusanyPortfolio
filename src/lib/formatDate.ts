/** Blog / planovi: dd. mm. yyyy. (ulaz: YYYY-MM-DD) */
export function formatBlogDate(dateStr: string): string {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const [y, m, d] = dateStr.split("-");
  return `${d}. ${m}. ${y}.`;
}

/** Portfolio galerija, hero: en-US dugi format (ulaz: ISO string) */
export function formatPortfolioDateLong(isoDate: string): string {
  const t = Date.parse(isoDate);
  if (Number.isNaN(t)) return isoDate;
  return new Date(t).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Admin Media tablica: kratki hr format */
export function formatAdminTableDate(isoDate: string): string {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString("hr-HR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** Admin galerija (kartica slike): en-US kratki mjesec + 24h sat */
export function formatAdminCaptureDate(isoDate: string): string {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
