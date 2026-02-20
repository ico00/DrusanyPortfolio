import { NextResponse } from "next/server";
import { getGallery } from "@/lib/getGallery";
import { getBlog } from "@/lib/blog";
import { getPages } from "@/lib/pages";
import { readFile, stat } from "fs/promises";
import path from "path";

export const dynamic = "force-static";

export interface MediaUsage {
  type: "portfolio" | "blog" | "page";
  label: string;
  context?: string;
}

export interface MediaItem {
  url: string;
  thumb?: string;
  filename: string;
  usages: MediaUsage[];
  uploadDate?: string;
}

function extractImageUrls(html: string): string[] {
  if (!html?.trim()) return [];
  const matches = html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi);
  return [...matches].map((m) => m[1].trim()).filter(Boolean);
}

function getFilenameFromUrl(url: string): string {
  try {
    const u = url.startsWith("/") ? url : new URL(url).pathname;
    return path.basename(u) || url;
  } catch {
    return url;
  }
}

export async function GET() {
  try {
    const map = new Map<string, MediaItem>();

    function addUsage(url: string, usage: MediaUsage, opts?: { thumb?: string; uploadDate?: string }) {
      const normalized = url.startsWith("/") ? url : url;
      const existing = map.get(normalized);
      const filename = getFilenameFromUrl(normalized);
      const uploadDate = opts?.uploadDate;
      if (existing) {
        if (!existing.usages.some((u) => u.type === usage.type && u.label === usage.label && u.context === usage.context)) {
          existing.usages.push(usage);
        }
        if (uploadDate && (!existing.uploadDate || uploadDate < existing.uploadDate)) {
          existing.uploadDate = uploadDate;
        }
      } else {
        map.set(normalized, {
          url: normalized,
          thumb: opts?.thumb,
          filename,
          usages: [usage],
          uploadDate: uploadDate ?? undefined,
        });
      }
    }

    async function getFileUploadDate(url: string): Promise<string | undefined> {
      if (!url.startsWith("/")) return undefined;
      try {
        const filePath = path.join(process.cwd(), "public", url.slice(1));
        const st = await stat(filePath);
        return st.mtime.toISOString();
      } catch {
        return undefined;
      }
    }

    // Portfolio (gallery.json)
    const gallery = await getGallery();
    for (const img of gallery.images) {
      if (img.src) {
        addUsage(img.src, {
          type: "portfolio",
          label: img.category || "Gallery",
          context: img.title || img.slug,
        }, { thumb: img.thumb, uploadDate: img.createdAt });
      }
      if (img.thumb && img.thumb !== img.src) {
        addUsage(img.thumb, {
          type: "portfolio",
          label: img.category || "Gallery",
          context: `(thumb) ${img.title || img.slug}`,
        });
      }
    }

    // Blog (blog.json + HTML body)
    const { posts } = await getBlog();
    const blogContentDir = path.join(process.cwd(), "src", "data", "blog");
    for (const post of posts) {
      const postLabel = post.title || post.slug || post.id;

      if (post.thumbnail?.trim()) {
        addUsage(post.thumbnail, {
          type: "blog",
          label: postLabel,
          context: "Featured image",
        });
      }

      for (const gUrl of post.gallery ?? []) {
        if (gUrl?.trim()) {
          addUsage(gUrl, {
            type: "blog",
            label: postLabel,
            context: "Gallery",
          });
        }
      }

      try {
        const contentPath = path.join(blogContentDir, `${post.slug}.html`);
        const body = await readFile(contentPath, "utf-8");
        const urls = extractImageUrls(body);
        for (const u of urls) {
          addUsage(u, {
            type: "blog",
            label: postLabel,
            context: "Content",
          });
        }
      } catch {
        // No content file
      }
    }

    // Pages (about, contact)
    const pages = await getPages();
    if (pages.about?.html) {
      for (const u of extractImageUrls(pages.about.html)) {
        addUsage(u, {
          type: "page",
          label: "About",
          context: "Page content",
        });
      }
    }
    if (pages.contact?.html) {
      for (const u of extractImageUrls(pages.contact.html)) {
        addUsage(u, {
          type: "page",
          label: "Contact",
          context: "Page content",
        });
      }
    }

    const items = Array.from(map.values());

    for (const item of items) {
      if (!item.uploadDate && item.url.startsWith("/")) {
        item.uploadDate = await getFileUploadDate(item.url);
      }
    }

    items.sort((a, b) =>
      a.filename.localeCompare(b.filename, undefined, { sensitivity: "base" })
    );

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Media API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch media" },
      { status: 500 }
    );
  }
}
