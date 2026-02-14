import { readFile, writeFile, unlink } from "fs/promises";
import path from "path";
import type { GalleryData } from "@/lib/getGallery";

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return new Response(
      JSON.stringify({ error: "Delete only available in development mode" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const { id } = (await request.json()) as { id?: string };

    if (!id) {
      return new Response(
        JSON.stringify({ error: "Missing image id" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const galleryPath = path.join(process.cwd(), "src", "data", "gallery.json");
    const galleryRaw = await readFile(galleryPath, "utf-8");
    const gallery: GalleryData = JSON.parse(galleryRaw);

    const index = gallery.images.findIndex((img) => img.id === id);
    if (index === -1) {
      return new Response(
        JSON.stringify({ error: "Image not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const img = gallery.images[index];

    const deleteFile = async (relativePath: string) => {
      const fullPath = path.join(process.cwd(), "public", relativePath.slice(1));
      try {
        await unlink(fullPath);
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
          console.warn("Could not delete file:", fullPath, err);
        }
      }
    };

    await deleteFile(img.src);
    if (img.thumb) await deleteFile(img.thumb);

    gallery.images.splice(index, 1);
    await writeFile(galleryPath, JSON.stringify(gallery, null, 2));

    return Response.json({ success: true, id });
  } catch (error) {
    console.error("Delete error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Delete failed",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
