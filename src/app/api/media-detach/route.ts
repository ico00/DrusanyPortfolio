import { readFile, writeFile } from "fs/promises";
import path from "path";
import { checkRateLimit } from "@/lib/rateLimit";
import { getGallery } from "@/lib/getGallery";
import { getBlog, saveBlog, getBlogContentPath } from "@/lib/blog";
import { getPages, savePages } from "@/lib/pages";
import { withLock } from "@/lib/jsonLock";
import type { MediaUsage } from "@/app/api/media/route";

const GALLERY_PATH = path.join(process.cwd(), "src", "data", "gallery.json");
const BLOG_JSON_PATH = path.join(process.cwd(), "src", "data", "blog.json");
const PAGES_PATH = path.join(process.cwd(), "src", "data", "pages.json");

/** Removes img tag containing the given src from HTML */
function removeImgFromHtml(html: string, url: string): string {
  const escaped = url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return html.replace(
    new RegExp(`<img[^>]*\\ssrc=["']${escaped}["'][^>]*/?\\s*>`, "gi"),
    ""
  );
}

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
    const body = (await request.json()) as {
      url?: string;
      usage?: MediaUsage;
    };

    const { url, usage } = body;
    if (!url || !usage) {
      return Response.json(
        { error: "url and usage are required" },
        { status: 400 }
      );
    }

    const normalizedUrl = url.startsWith("/") ? url : `/${url}`;

    if (usage.type === "portfolio") {
      await withLock(GALLERY_PATH, async () => {
        const raw = await readFile(GALLERY_PATH, "utf-8");
        const gallery = JSON.parse(raw) as { images: { id: string; src: string; thumb?: string }[] };
        const idx = gallery.images.findIndex(
          (img) => img.src === normalizedUrl || img.thumb === normalizedUrl
        );
        if (idx === -1) {
          throw new Error("Image not found in gallery");
        }
        gallery.images.splice(idx, 1);
        await writeFile(GALLERY_PATH, JSON.stringify(gallery, null, 2));
      });
    } else if (usage.type === "blog") {
      await withLock(BLOG_JSON_PATH, async () => {
        const raw = await readFile(BLOG_JSON_PATH, "utf-8");
        const blog = JSON.parse(raw) as {
          posts: {
            id: string;
            title: string;
            slug: string;
            thumbnail: string;
            gallery?: string[];
            galleryMetadata?: Record<string, unknown>;
          }[];
        };
        const post = blog.posts.find(
          (p) => p.title === usage.label || p.slug === usage.label
        );
        if (!post) {
          throw new Error("Post not found");
        }

        if (usage.context === "Featured image" && post.thumbnail === normalizedUrl) {
          post.thumbnail = "";
        } else if (usage.context === "Gallery" && Array.isArray(post.gallery)) {
          post.gallery = post.gallery.filter((u) => u !== normalizedUrl);
          if (post.galleryMetadata && normalizedUrl in post.galleryMetadata) {
            const { [normalizedUrl]: _, ...rest } = post.galleryMetadata;
            post.galleryMetadata = rest;
          }
        } else if (usage.context === "Content") {
          const contentPath = getBlogContentPath(post.slug);
          try {
            const html = await readFile(contentPath, "utf-8");
            const newHtml = removeImgFromHtml(html, normalizedUrl);
            await writeFile(contentPath, newHtml, "utf-8");
          } catch {
            throw new Error("Could not update post content");
          }
        } else {
          throw new Error("Usage context not found");
        }

        await writeFile(BLOG_JSON_PATH, JSON.stringify(blog, null, 2));
      });
    } else if (usage.type === "page") {
      await withLock(PAGES_PATH, async () => {
        const raw = await readFile(PAGES_PATH, "utf-8");
        const pages = JSON.parse(raw) as { about?: { html?: string }; contact?: { html?: string } };
        const pageKey = usage.label === "About" ? "about" : usage.label === "Contact" ? "contact" : null;
        if (!pageKey || !pages[pageKey]?.html) {
          throw new Error("Page not found");
        }
        const newHtml = removeImgFromHtml(pages[pageKey].html, normalizedUrl);
        pages[pageKey] = { ...pages[pageKey], html: newHtml };
        await writeFile(PAGES_PATH, JSON.stringify(pages, null, 2));
      });
    } else {
      return Response.json({ error: "Invalid usage type" }, { status: 400 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Media detach error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Detach failed" },
      { status: 500 }
    );
  }
}
