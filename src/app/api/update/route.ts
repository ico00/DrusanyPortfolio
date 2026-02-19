import { readFile, writeFile } from "fs/promises";
import path from "path";
import type { GalleryData } from "@/lib/getGallery";
import { slugify, generateSlug } from "@/lib/slug";
import { withLock } from "@/lib/jsonLock";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(request: Request) {
  const rateLimitRes = checkRateLimit(request);
  if (rateLimitRes) return rateLimitRes;
  if (process.env.NODE_ENV !== "development") {
    return new Response(
      JSON.stringify({ error: "Update only available in development mode" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const body = (await request.json()) as {
      id: string;
      title?: string;
      alt?: string;
      category?: string;
      capturedAt?: string;
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
      thumbnailFocus?: string;
    };

    const { id, ...updates } = body;

    if (!id) {
      return new Response(
        JSON.stringify({ error: "Missing image id" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const galleryPath = path.join(process.cwd(), "src", "data", "gallery.json");
    const result = await withLock(galleryPath, async () => {
      const galleryRaw = await readFile(galleryPath, "utf-8");
      const gallery: GalleryData = JSON.parse(galleryRaw);

      const img = gallery.images.find((i) => i.id === id);
      if (!img) {
        return { error: "not_found" as const };
      }

      if (updates.title !== undefined) {
        img.title = updates.title;
        img.alt = updates.title;
      }
      if (updates.category !== undefined) img.category = updates.category;
      if (updates.capturedAt !== undefined) {
        const parsed = new Date(updates.capturedAt);
        img.capturedAt = !isNaN(parsed.getTime()) ? parsed.toISOString() : img.capturedAt;
      }
      if (updates.camera !== undefined) img.camera = updates.camera;
      if (updates.lens !== undefined) img.lens = updates.lens;
      if (updates.exposure !== undefined) img.exposure = updates.exposure;
      if (updates.aperture !== undefined) img.aperture = updates.aperture;
      if (updates.iso !== undefined) img.iso = updates.iso;
      if (updates.venue !== undefined) img.venue = updates.venue;
      if (updates.sport !== undefined) img.sport = updates.sport;
      if (updates.foodDrink !== undefined) (img as { foodDrink?: string }).foodDrink = updates.foodDrink;
      if (updates.keywords !== undefined) img.keywords = updates.keywords;
      const titleOrVenueOrDateChanged =
        updates.title !== undefined ||
        updates.venue !== undefined ||
        updates.capturedAt !== undefined;

      if (titleOrVenueOrDateChanged) {
        const newSlug = generateSlug(img.title, img.venue, img.capturedAt);
        let slug = slugify(newSlug) || undefined;
        if (slug) {
          const categoryImages = gallery.images.filter((i) => i.category === img.category && i.id !== img.id);
          const existingSlugs = new Set(categoryImages.map((i) => i.slug).filter(Boolean));
          let slugBase = slug;
          let n = 2;
          while (existingSlugs.has(slug)) {
            slug = `${slugBase}-${n}`;
            n++;
          }
          img.slug = slug;
        }
      } else if (updates.slug !== undefined) {
        const s = slugify(updates.slug);
        img.slug = s || undefined;
      }
      if (updates.thumbnailFocus !== undefined) img.thumbnailFocus = updates.thumbnailFocus;

      await writeFile(galleryPath, JSON.stringify(gallery, null, 2));
      return { image: img };
    });

    if (result && "error" in result && result.error === "not_found") {
      return new Response(
        JSON.stringify({ error: "Image not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }
    return Response.json({ success: true, image: result!.image });
  } catch (error) {
    console.error("Update error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Update failed",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
