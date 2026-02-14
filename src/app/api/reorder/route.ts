import { readFile, writeFile } from "fs/promises";
import path from "path";
import type { GalleryData } from "@/lib/getGallery";

function normalizeCategory(cat: string): string {
  return cat
    .toLowerCase()
    .trim()
    .replace(/\s*&\s*/g, "-")
    .replace(/\s+/g, "-");
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return new Response(
      JSON.stringify({ error: "Reorder only available in development mode" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const body = (await request.json()) as {
      category: string;
      order: string[];
    };

    const { category, order } = body;

    if (!category || !Array.isArray(order)) {
      return new Response(
        JSON.stringify({ error: "Missing category or order" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const categorySlug = normalizeCategory(category);
    const galleryPath = path.join(process.cwd(), "src", "data", "gallery.json");
    const galleryRaw = await readFile(galleryPath, "utf-8");
    const gallery: GalleryData = JSON.parse(galleryRaw);

    const orderMap = new Map(order.map((id, i) => [id, i]));

    for (const img of gallery.images) {
      if (normalizeCategory(img.category) === categorySlug && orderMap.has(img.id)) {
        (img as { order?: number }).order = orderMap.get(img.id)!;
      }
    }

    await writeFile(galleryPath, JSON.stringify(gallery, null, 2));

    return Response.json({ success: true });
  } catch (error) {
    console.error("Reorder error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Reorder failed",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
