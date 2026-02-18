import { readFile } from "fs/promises";
import path from "path";

export interface GalleryImage {
  id: string;
  title: string;
  category: string;
  alt: string;
  src: string;
  thumb?: string;
  width: number;
  height: number;
  capturedAt?: string;
  createdAt: string;
  isHero?: boolean;
  /** Camera make + model */
  camera?: string;
  /** Lens model */
  lens?: string;
  /** Exposure time (e.g. "1/500", "2\"") */
  exposure?: string;
  /** Aperture (e.g. "f/2.8") */
  aperture?: string;
  /** ISO speed */
  iso?: number;
  /** Venue (concerts only): arena-zagreb, tvornica-kulture, kset, salata, misc */
  venue?: string;
  /** Sport type (sport only): football, basketball, handball, auto-moto, athletics */
  sport?: string;
  /** Food or Drink (food-drink only): food, drink */
  foodDrink?: string;
  /** Keywords (comma-separated, from EXIF IPTC/XMP) */
  keywords?: string;
  /** URL slug za direktne linkove (npr. depeche-mode-arena-zagreb-2013) */
  slug?: string;
  /** Redoslijed unutar kategorije (manji = ranije); undefined = sortiraj po datumu */
  order?: number;
  /** Fokus točka za hero/featured prikaz: "x% y%" npr. "50% 30%" */
  thumbnailFocus?: string;
}

export interface GalleryData {
  images: GalleryImage[];
}

function slugify(str: string): string {
  return str
    .replace(/dž/gi, "dz")
    .replace(/đ/gi, "dj")
    .replace(/[čćČĆ]/g, "c")
    .replace(/[šŠ]/g, "s")
    .replace(/[žŽ]/g, "z")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function ensureSlug(img: GalleryImage, existingSlugs: Set<string>): string {
  if (img.slug?.trim()) return img.slug;
  const parts: string[] = [];
  if (img.title?.trim()) parts.push(slugify(img.title));
  if (img.venue?.trim()) {
    const v = slugify(img.venue);
    if (v && !parts.some((p) => p.includes(v))) parts.push(v);
  }
  const year = img.capturedAt ? new Date(img.capturedAt).getFullYear() : null;
  if (year && !isNaN(year)) parts.push(String(year));
  let slug = parts.filter(Boolean).join("-") || `image-${img.id.slice(0, 8)}`;
  let base = slug;
  let n = 2;
  while (existingSlugs.has(slug)) {
    slug = `${base}-${n}`;
    n++;
  }
  existingSlugs.add(slug);
  return slug;
}

export async function getGallery(): Promise<GalleryData> {
  const galleryPath = path.join(process.cwd(), "src", "data", "gallery.json");
  const raw = await readFile(galleryPath, "utf-8");
  const data = JSON.parse(raw) as GalleryData;
  const images = data.images ?? [];
  const slugs = new Set<string>();
  const withSlugs = images.map((img) => ({
    ...img,
    slug: ensureSlug(img, slugs),
  }));
  const sorted = [...withSlugs].sort((a, b) => {
    const catA = (a.category || "").toLowerCase();
    const catB = (b.category || "").toLowerCase();
    if (catA !== catB) return catA.localeCompare(catB);
    const orderA = (a as { order?: number }).order ?? 999999;
    const orderB = (b as { order?: number }).order ?? 999999;
    if (orderA !== orderB) return orderA - orderB;
    const dateA = a.capturedAt || a.createdAt || "";
    const dateB = b.capturedAt || b.createdAt || "";
    return dateB.localeCompare(dateA);
  });
  return { images: sorted };
}
