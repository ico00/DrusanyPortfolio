import { readFile, writeFile, unlink, rename, access } from "fs/promises";
import path from "path";
import type { BlogPost } from "./blog";
import { getBlogUploadDir, getBlogContentPath } from "./blog";
import { withLock } from "./jsonLock";

const BLOG_JSON_PATH = path.join(process.cwd(), "src", "data", "blog.json");
const BLOG_EXIF_PATH = path.join(process.cwd(), "src", "data", "blogExif.json");

function getFolderName(date: string, slug: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? `${date}-${slug}` : slug;
}

/**
 * Pri promjeni slug-a ili datuma: premješta uploads folder, ažurira URL-ove,
 * briše orphan datoteke (stari slug.html).
 */
export async function cleanupBlogOrphanFiles(
  oldSlug: string,
  oldDate: string,
  newSlug: string,
  newDate: string,
  post: BlogPost
): Promise<void> {
  const oldFolderName = getFolderName(oldDate, oldSlug);
  const newFolderName = getFolderName(newDate, newSlug);

  if (oldFolderName === newFolderName) return;

  const oldFolderPath = getBlogUploadDir(oldSlug, oldDate);
  const newFolderPath = getBlogUploadDir(newSlug, newDate);
  const oldPrefix = `/uploads/blog/${oldFolderName}/`;
  const newPrefix = `/uploads/blog/${newFolderName}/`;

  try {
    await access(oldFolderPath);
  } catch {
    return;
  }

  try {
    await rename(oldFolderPath, newFolderPath);
  } catch (err) {
    console.warn("Blog folder rename failed:", err);
    return;
  }

  const gallery = post.gallery ?? [];
  const newGallery = gallery.map((url) =>
    url.startsWith(oldPrefix) ? url.replace(oldPrefix, newPrefix) : url
  );

  const galleryMetadata = post.galleryMetadata ?? {};
  const newGalleryMetadata: Record<string, { title?: string; description?: string }> = {};
  for (const [url, meta] of Object.entries(galleryMetadata)) {
    const newUrl = url.startsWith(oldPrefix) ? url.replace(oldPrefix, newPrefix) : url;
    newGalleryMetadata[newUrl] = meta;
  }

  const thumbnail = post.thumbnail?.startsWith(oldPrefix)
    ? post.thumbnail.replace(oldPrefix, newPrefix)
    : post.thumbnail;

  await withLock(BLOG_JSON_PATH, async () => {
    const blogRaw = await readFile(BLOG_JSON_PATH, "utf-8");
    const blog = JSON.parse(blogRaw) as { posts: BlogPost[] };
    const idx = blog.posts.findIndex((p) => p.id === post.id);
    if (idx >= 0) {
      blog.posts[idx] = {
        ...blog.posts[idx],
        slug: newSlug,
        date: newDate,
        gallery: newGallery,
        galleryMetadata: newGalleryMetadata,
        thumbnail: thumbnail ?? blog.posts[idx].thumbnail,
      };
      await writeFile(BLOG_JSON_PATH, JSON.stringify(blog, null, 2), "utf-8");
    }
  });

  let blogExif: Record<string, { camera?: string; lens?: string; exposure?: string; aperture?: string; iso?: number }> = {};
  try {
    const raw = await readFile(BLOG_EXIF_PATH, "utf-8");
    blogExif = JSON.parse(raw) as typeof blogExif;
  } catch {
    // file doesn't exist
  }

  const newBlogExif: typeof blogExif = {};
  for (const [url, exif] of Object.entries(blogExif)) {
    const newUrl = url.startsWith(oldPrefix) ? url.replace(oldPrefix, newPrefix) : url;
    newBlogExif[newUrl] = exif;
  }
  await writeFile(BLOG_EXIF_PATH, JSON.stringify(newBlogExif, null, 2), "utf-8");

  const oldContentPath = getBlogContentPath(oldSlug);
  try {
    await unlink(oldContentPath);
  } catch {
    // old file may not exist
  }
}

/**
 * Briše datoteke i folder posta pri brisanju blog članka.
 */
export async function deleteBlogPostFiles(slug: string, date: string): Promise<void> {
  const folderPath = getBlogUploadDir(slug, date);
  const contentPath = getBlogContentPath(slug);

  const { rm } = await import("fs/promises");
  try {
    await rm(folderPath, { recursive: true });
  } catch {
    // folder may not exist
  }
  try {
    await unlink(contentPath);
  } catch {
    // file may not exist
  }
}
