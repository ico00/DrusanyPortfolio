import { readFile } from "fs/promises";
import path from "path";
import { getBlog } from "@/lib/blog";

export const dynamic = "force-static";

interface GalleryImageRaw {
  id?: string;
  slug?: string;
  camera?: string;
  lens?: string;
  exposure?: string;
  aperture?: string;
  iso?: number;
}

export async function GET() {
  try {
    const galleryPath = path.join(process.cwd(), "src", "data", "gallery.json");
    const raw = await readFile(galleryPath, "utf-8");
    const data = JSON.parse(raw) as { images?: GalleryImageRaw[] };
    const images = data.images ?? [];

    const imagesWithoutExif = images.filter(
      (img) =>
        !img.camera &&
        !img.lens &&
        !img.exposure &&
        !img.aperture &&
        (img.iso == null || img.iso === undefined)
    );
    const imagesWithoutSlug = images.filter(
      (img) => !img.slug || !String(img.slug).trim()
    );

    const { posts } = await getBlog();
    const postsWithoutFeatured = posts.filter(
      (p) => !p.thumbnail || !String(p.thumbnail).trim()
    ).length;

    return Response.json({
      imagesWithoutExif: imagesWithoutExif.length,
      imagesWithoutSlug: imagesWithoutSlug.length,
      blogPostsWithoutFeaturedImage: postsWithoutFeatured,
      imageIdsWithoutExif: imagesWithoutExif.map((img) => img.id).filter(Boolean) as string[],
      imageIdsWithoutSlug: imagesWithoutSlug.map((img) => img.id).filter(Boolean) as string[],
    });
  } catch (error) {
    console.error("Content health fetch error:", error);
    return Response.json(
      {
        imagesWithoutExif: 0,
        imagesWithoutSlug: 0,
        blogPostsWithoutFeaturedImage: 0,
        imageIdsWithoutExif: [],
        imageIdsWithoutSlug: [],
      },
      { status: 200 }
    );
  }
}
