/**
 * Zajedničke EXIF funkcije za upload, blog-upload i exif-preview.
 */

export function formatExposure(sec: unknown): string | null {
  if (typeof sec !== "number" || sec <= 0) return null;
  if (sec >= 1) return `${sec}"`;
  const frac = 1 / sec;
  if (frac >= 1 && Math.abs(frac - Math.round(frac)) < 0.01)
    return `1/${Math.round(frac)}`;
  return `${sec}s`;
}

export function formatAperture(fnum: unknown): string | null {
  if (typeof fnum !== "number" || fnum <= 0) return null;
  return `f/${fnum}`;
}

export function formatLensInfo(arr: unknown): string | null {
  if (!Array.isArray(arr) || arr.length < 4) return null;
  const [minFocal, maxFocal, minF, maxF] = arr.map(Number);
  if (!minFocal || minFocal <= 0) return null;
  const focal =
    minFocal === maxFocal ? `${minFocal}mm` : `${minFocal}-${maxFocal}mm`;
  const fnum = minF > 0 ? ` f/${minF}` : "";
  return `${focal}${fnum}`.trim() || null;
}

export interface ExifExtras {
  camera: string | null;
  lens: string | null;
  exposure: string | null;
  aperture: string | null;
  iso: number | null;
}

export function getExifExtras(exif: Record<string, unknown>): ExifExtras {
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

export function getExifDescription(exif: Record<string, unknown>): string {
  const ifd0 = exif.ifd0 as Record<string, unknown> | undefined;
  const imgDesc = exif.ImageDescription ?? ifd0?.ImageDescription;
  if (typeof imgDesc === "string" && imgDesc.trim()) return imgDesc.trim();

  const userComment = exif.UserComment;
  if (typeof userComment === "string" && userComment.trim())
    return userComment.trim();
  if (Buffer.isBuffer(userComment)) {
    let str = userComment.toString("utf8");
    if (str.startsWith("UNICODE\0")) str = str.slice(8);
    else if (str.startsWith("ASCII\0\0\0")) str = str.slice(8);
    const trimmed = str.replace(/\0/g, "").trim();
    if (trimmed) return trimmed;
  }

  const dcDesc = exif["dc:description"] ?? exif.description;
  if (typeof dcDesc === "string" && dcDesc.trim()) return dcDesc.trim();
  if (
    dcDesc &&
    typeof dcDesc === "object" &&
    "value" in dcDesc &&
    typeof (dcDesc as { value?: string }).value === "string"
  ) {
    const val = (dcDesc as { value: string }).value.trim();
    if (val) return val;
  }

  const xpTitle = exif.XPTitle ?? exif.xptitle;
  if (typeof xpTitle === "string" && xpTitle.trim()) return xpTitle.trim();

  const iptc = (exif as Record<string, unknown>).iptc;
  const iptcCaption =
    (iptc &&
    typeof iptc === "object" &&
    "Caption" in iptc
      ? (iptc as { Caption?: string }).Caption
      : null) ?? exif.Caption;
  if (typeof iptcCaption === "string" && iptcCaption.trim())
    return iptcCaption.trim();

  return "";
}

export function getKeywords(exif: Record<string, unknown>): string {
  const dcSubject = exif["dc:subject"] ?? exif.Subject ?? exif.subject;
  if (Array.isArray(dcSubject) && dcSubject.length > 0) {
    return dcSubject
      .map((s) => (typeof s === "string" ? s : String(s)))
      .join(", ");
  }
  if (typeof dcSubject === "string" && dcSubject.trim()) return dcSubject.trim();

  const keywords = exif.Keywords ?? exif.keywords;
  if (Array.isArray(keywords) && keywords.length > 0) {
    return keywords
      .map((k) => (typeof k === "string" ? k : String(k)))
      .join(", ");
  }
  if (typeof keywords === "string" && keywords.trim()) return keywords.trim();

  const iptc = (exif as Record<string, unknown>).iptc;
  const iptcKeywords =
    iptc && typeof iptc === "object" && "Keywords" in iptc
      ? (iptc as { Keywords?: string[] }).Keywords
      : null;
  if (Array.isArray(iptcKeywords) && iptcKeywords.length > 0) {
    return iptcKeywords.join(", ");
  }

  return "";
}

/** Vraća ISO string iz EXIF datuma ili null */
export function dateToISO(value: unknown): string | null {
  if (value instanceof Date && !isNaN(value.getTime()))
    return value.toISOString();
  return null;
}

/** Format datuma za datetime-local input (YYYY-MM-DDTHH:mm) */
export function formatDateForInput(value: unknown): string | null {
  if (value instanceof Date && !isNaN(value.getTime())) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    const h = String(value.getHours()).padStart(2, "0");
    const min = String(value.getMinutes()).padStart(2, "0");
    return `${y}-${m}-${d}T${h}:${min}`;
  }
  return null;
}
