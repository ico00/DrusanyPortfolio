import path from "path";
import { rename } from "fs/promises";
import { getBlog, getBlogPost, saveBlog, saveBlogBody } from "@/lib/blog";
import type { BlogGalleryMetadata, BlogSeo } from "@/lib/blog";
import { withLock } from "@/lib/jsonLock";
import { checkRateLimit } from "@/lib/rateLimit";
import { normalizeBlogSlug } from "@/lib/slug";

const BLOG_JSON_PATH = path.join(process.cwd(), "src", "data", "blog.json");

export const dynamic = "force-static";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    if (slug) {
      const post = await getBlogPost(slug);
      if (!post) {
        return Response.json({ error: "Post not found" }, { status: 404 });
      }
      return Response.json(post);
    }
    const blog = await getBlog();
    return Response.json(blog);
  } catch (error) {
    console.error("Blog fetch error:", error);
    return Response.json(
      { error: "Failed to fetch blog" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function POST(request: Request) {
  const rateLimitRes = checkRateLimit(request);
  if (rateLimitRes) return rateLimitRes;
  if (process.env.NODE_ENV !== "development") {
    return Response.json(
      { error: "Only available in development mode" },
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const body = (await request.json()) as {
      title: string;
      slug: string;
      date: string;
      time?: string;
      category?: string;
      categories?: string[];
      thumbnail: string;
      thumbnailFocus?: string;
      gallery: string[];
      galleryMetadata?: Record<string, BlogGalleryMetadata>;
      featured?: boolean;
      status?: "draft" | "published";
      body: string;
      seo?: BlogSeo;
    };
    const id = crypto.randomUUID();
    const date = body.date || new Date().toISOString().slice(0, 10);
    const title = body.title || "Bez naslova";
    const slug = normalizeBlogSlug(body.slug?.trim(), title, date);
    const categories = Array.isArray(body.categories)
      ? body.categories.filter(Boolean)
      : body.category
        ? [body.category]
        : [];
    let thumbnail = body.thumbnail || "";
    if (thumbnail.endsWith("featured-pending.webp")) {
      const pendingPath = path.join(process.cwd(), "public", thumbnail.replace(/^\//, ""));
      const canonicalPath = pendingPath.replace("featured-pending.webp", "featured.webp");
      try {
        await rename(pendingPath, canonicalPath);
        thumbnail = thumbnail.replace("featured-pending.webp", "featured.webp");
      } catch {
        thumbnail = body.thumbnail || "";
      }
    }
    const post = {
      id,
      title,
      slug,
      date,
      time: body.time && /^\d{1,2}:\d{2}$/.test(body.time) ? body.time : undefined,
      categories,
      thumbnail,
      thumbnailFocus: body.thumbnailFocus || "50% 50%",
      gallery: Array.isArray(body.gallery) ? body.gallery : ([] as string[]),
      galleryMetadata: body.galleryMetadata ?? {},
      featured: body.featured ?? false,
      status: (body.status === "draft" ? "draft" : "published") as "draft" | "published",
      seo: body.seo ?? { metaTitle: "", metaDescription: "", keywords: "" },
    };
    await withLock(BLOG_JSON_PATH, async () => {
      await saveBlogBody(slug, body.body || "");
      const blog = await getBlog();
      blog.posts.unshift(post);
      await saveBlog(blog);
    });
    return Response.json({ ...post, body: body.body || "" });
  } catch (error) {
    console.error("Blog create error:", error);
    return Response.json(
      { error: "Failed to create post" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function PUT(request: Request) {
  const rateLimitRes = checkRateLimit(request);
  if (rateLimitRes) return rateLimitRes;
  if (process.env.NODE_ENV !== "development") {
    return Response.json(
      { error: "Only available in development mode" },
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const body = (await request.json()) as {
      id: string;
      title?: string;
      slug?: string;
      date?: string;
      time?: string;
      category?: string;
      categories?: string[];
      thumbnail?: string;
      thumbnailFocus?: string;
      gallery?: string[];
      galleryMetadata?: Record<string, BlogGalleryMetadata>;
      featured?: boolean;
      status?: "draft" | "published";
      body?: string;
      seo?: BlogSeo;
    };
    const result = await withLock(BLOG_JSON_PATH, async () => {
      const blog = await getBlog();
      const idx = blog.posts.findIndex((p) => p.id === body.id);
      if (idx < 0) {
        return { error: "not_found" as const };
      }
      const oldSlug = blog.posts[idx].slug;
      const oldDate = blog.posts[idx].date;

      if (body.title !== undefined) blog.posts[idx].title = body.title;
      if (body.date !== undefined) blog.posts[idx].date = body.date;
      if (body.slug !== undefined) {
        const title = body.title ?? blog.posts[idx].title;
        const date = body.date ?? blog.posts[idx].date;
        blog.posts[idx].slug = normalizeBlogSlug(body.slug, title, date);
      }
    if (body.time !== undefined) {
      blog.posts[idx].time =
        body.time && /^\d{1,2}:\d{2}$/.test(body.time) ? body.time : undefined;
    }
    if (body.categories !== undefined) {
      blog.posts[idx].categories = Array.isArray(body.categories)
        ? body.categories.filter(Boolean)
        : [];
      delete blog.posts[idx].category;
    } else if (body.category !== undefined) {
      blog.posts[idx].categories = body.category ? [body.category] : [];
      delete blog.posts[idx].category;
    }
    if (body.thumbnail !== undefined) {
      let thumbnailToStore = body.thumbnail;
      if (body.thumbnail.endsWith("featured-pending.webp")) {
        const pendingPath = path.join(process.cwd(), "public", body.thumbnail.replace(/^\//, ""));
        const canonicalPath = pendingPath.replace("featured-pending.webp", "featured.webp");
        try {
          await rename(pendingPath, canonicalPath);
          thumbnailToStore = body.thumbnail.replace("featured-pending.webp", "featured.webp");
        } catch {
          thumbnailToStore = body.thumbnail;
        }
      }
      blog.posts[idx].thumbnail = thumbnailToStore;
    }
    if (body.thumbnailFocus !== undefined) blog.posts[idx].thumbnailFocus = body.thumbnailFocus;
    if (body.gallery !== undefined) blog.posts[idx].gallery = body.gallery;
    if (body.galleryMetadata !== undefined) blog.posts[idx].galleryMetadata = body.galleryMetadata;
    if (body.featured !== undefined) blog.posts[idx].featured = !!body.featured;
    if (body.status !== undefined) blog.posts[idx].status = body.status === "draft" ? "draft" : "published";
    if (body.seo !== undefined) {
      blog.posts[idx].seo = {
        metaTitle: body.seo.metaTitle?.trim() ?? "",
        metaDescription: body.seo.metaDescription?.trim() ?? "",
        keywords: body.seo.keywords?.trim() ?? "",
      };
    }
      if (body.body !== undefined) {
        await saveBlogBody(blog.posts[idx].slug, body.body);
      }
      await saveBlog(blog);
      return { post: blog.posts[idx], oldSlug, oldDate, slugChanged: body.slug !== undefined && body.slug !== oldSlug, dateChanged: body.date !== undefined && body.date !== oldDate };
    });

    if (result && "error" in result && result.error === "not_found") {
      return Response.json(
        { error: "Post not found" },
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const { post, oldSlug, oldDate, slugChanged, dateChanged } = result!;
    const newSlug = post.slug;
    const newDate = post.date;

    if ((slugChanged || dateChanged) && (oldSlug !== newSlug || oldDate !== newDate)) {
      const { cleanupBlogOrphanFiles } = await import("@/lib/blogCleanup");
      await cleanupBlogOrphanFiles(oldSlug, oldDate, newSlug, newDate, post);
    }

    return Response.json(post);
  } catch (error) {
    console.error("Blog update error:", error);
    return Response.json(
      { error: "Failed to update post" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function DELETE(request: Request) {
  const rateLimitRes = checkRateLimit(request);
  if (rateLimitRes) return rateLimitRes;
  if (process.env.NODE_ENV !== "development") {
    return Response.json(
      { error: "Only available in development mode" },
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return Response.json(
        { error: "Missing id" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const deletedPost = await withLock(BLOG_JSON_PATH, async () => {
      const blog = await getBlog();
      const post = blog.posts.find((p) => p.id === id);
      const toDelete = post ? { slug: post.slug, date: post.date } : null;
      blog.posts = blog.posts.filter((p) => p.id !== id);
      await saveBlog(blog);
      return toDelete;
    });
    if (deletedPost) {
      const { deleteBlogPostFiles } = await import("@/lib/blogCleanup");
      await deleteBlogPostFiles(deletedPost.slug, deletedPost.date);
    }
    return Response.json({ success: true });
  } catch (error) {
    console.error("Blog delete error:", error);
    return Response.json(
      { error: "Failed to delete post" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
