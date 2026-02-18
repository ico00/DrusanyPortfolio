import { getBlog, getBlogPost, saveBlog, saveBlogBody } from "@/lib/blog";

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
      { posts: [] },
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function POST(request: Request) {
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
      body: string;
    };
    const blog = await getBlog();
    const id = crypto.randomUUID();
    const slug = (body.slug || id.slice(0, 8)).trim();
    const categories = Array.isArray(body.categories)
      ? body.categories.filter(Boolean)
      : body.category
        ? [body.category]
        : [];
    const post = {
      id,
      title: body.title || "Bez naslova",
      slug,
      date: body.date || new Date().toISOString().slice(0, 10),
      time: body.time && /^\d{1,2}:\d{2}$/.test(body.time) ? body.time : undefined,
      categories,
      thumbnail: body.thumbnail || "",
      thumbnailFocus: body.thumbnailFocus || "50% 50%",
      gallery: Array.isArray(body.gallery) ? body.gallery : ([] as string[]),
    };
    await saveBlogBody(slug, body.body || "");
    blog.posts.unshift(post);
    await saveBlog(blog);
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
      body?: string;
    };
    const blog = await getBlog();
    const idx = blog.posts.findIndex((p) => p.id === body.id);
    if (idx < 0) {
      return Response.json(
        { error: "Post not found" },
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }
    if (body.title !== undefined) blog.posts[idx].title = body.title;
    if (body.slug !== undefined) blog.posts[idx].slug = body.slug;
    if (body.date !== undefined) blog.posts[idx].date = body.date;
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
    if (body.thumbnail !== undefined) blog.posts[idx].thumbnail = body.thumbnail;
    if (body.thumbnailFocus !== undefined) blog.posts[idx].thumbnailFocus = body.thumbnailFocus;
    if (body.gallery !== undefined) blog.posts[idx].gallery = body.gallery;
    if (body.body !== undefined) {
      await saveBlogBody(blog.posts[idx].slug, body.body);
    }
    await saveBlog(blog);
    const post = blog.posts[idx];
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
    const blog = await getBlog();
    blog.posts = blog.posts.filter((p) => p.id !== id);
    await saveBlog(blog);
    return Response.json({ success: true });
  } catch (error) {
    console.error("Blog delete error:", error);
    return Response.json(
      { error: "Failed to delete post" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
