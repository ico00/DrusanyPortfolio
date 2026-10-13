import type { GalleryImage } from "./getGallery";

/** Isto kao normalizacija u `Gallery` — slug kategorije iz `img.category`. */
export function normalizeGalleryCategory(cat: string): string {
  return cat
    .toLowerCase()
    .replace(/\s*&\s*/g, "-")
    .replace(/\s+/g, "-");
}

export function filterGalleryImagesByCategorySlug(
  images: GalleryImage[],
  categorySlug: string,
): GalleryImage[] {
  const slug = categorySlug.toLowerCase();
  return images.filter(
    (img) => normalizeGalleryCategory(img.category) === slug,
  );
}

/** Za OG/share: hero u kategoriji ako postoji, inače prva slika u sortiranom redu (`getGallery`). */
export function pickGalleryShareImage(
  images: GalleryImage[],
  categorySlug: string,
): GalleryImage | undefined {
  const filtered = filterGalleryImagesByCategorySlug(images, categorySlug);
  if (filtered.length === 0) return undefined;
  const hero = filtered.find((img) => img.isHero);
  return hero ?? filtered[0];
}

/** Relativna putanja za crawlers: thumb ako postoji, inače puni `src`. */
export function getGalleryImageSharePath(img: GalleryImage): string {
  const raw = (img.thumb?.trim() || img.src?.trim() || "").replace(/^\s+|\s+$/g, "");
  if (!raw) return "";
  return raw.startsWith("/") ? raw : `/${raw}`;
}
