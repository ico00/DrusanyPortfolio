import { readFile, writeFile } from "fs/promises";
import path from "path";
import type { GalleryData } from "@/lib/getGallery";

function normalizeCategory(cat: string): string {
  return cat
    .toLowerCase()
    .replace(/\s*&\s*/g, "-")
    .replace(/\s+/g, "-");
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return new Response(
      JSON.stringify({ error: "Hero API only available in development" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const { id, isHero } = (await request.json()) as { id?: string; isHero?: boolean };

    if (!id) {
      return new Response(
        JSON.stringify({ error: "Missing image id" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const galleryPath = path.join(process.cwd(), "src", "data", "gallery.json");
    const galleryRaw = await readFile(galleryPath, "utf-8");
    const gallery: GalleryData = JSON.parse(galleryRaw);

    const targetIndex = gallery.images.findIndex((img) => img.id === id);
    if (targetIndex === -1) {
      return new Response(
        JSON.stringify({ error: "Image not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const targetCategory = normalizeCategory(gallery.images[targetIndex].category);

    if (isHero) {
      gallery.images.forEach((img, i) => {
        if (normalizeCategory(img.category) === targetCategory) {
          gallery.images[i] = { ...img, isHero: i === targetIndex };
        }
      });
    } else {
      gallery.images[targetIndex] = { ...gallery.images[targetIndex], isHero: false };
    }

    await writeFile(galleryPath, JSON.stringify(gallery, null, 2));

    return Response.json({ success: true, image: gallery.images[targetIndex] });
  } catch (error) {
    console.error("Hero update error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Update failed",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
