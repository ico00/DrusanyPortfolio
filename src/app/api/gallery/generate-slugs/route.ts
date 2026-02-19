import { readFile, writeFile } from "fs/promises";
import path from "path";
import { ensureSlug } from "@/lib/getGallery";
import type { GalleryData } from "@/lib/getGallery";
import { withLock } from "@/lib/jsonLock";
import { checkRateLimit } from "@/lib/rateLimit";

export const dynamic = "force-static";

export async function POST(request: Request) {
  const rateLimitRes = checkRateLimit(request);
  if (rateLimitRes) return rateLimitRes;
  if (process.env.NODE_ENV !== "development") {
    return Response.json(
      { error: "Only available in development mode" },
      { status: 403 }
    );
  }

  try {
    const galleryPath = path.join(process.cwd(), "src", "data", "gallery.json");
    const { updated, total } = await withLock(galleryPath, async () => {
      const raw = await readFile(galleryPath, "utf-8");
      const gallery: GalleryData = JSON.parse(raw);
      const images = gallery.images ?? [];

      const slugs = new Set<string>();
      let updated = 0;

      for (const img of images) {
        if (!img.slug || !String(img.slug).trim()) {
          const newSlug = ensureSlug(img, slugs);
          img.slug = newSlug;
          updated++;
        } else {
          slugs.add(img.slug);
        }
      }

      await writeFile(galleryPath, JSON.stringify(gallery, null, 2), "utf-8");
      return { updated, total: images.length };
    });

    return Response.json({
      success: true,
      updated,
      total,
    });
  } catch (error) {
    console.error("Generate slugs error:", error);
    return Response.json(
      { error: "Failed to generate slugs" },
      { status: 500 }
    );
  }
}
