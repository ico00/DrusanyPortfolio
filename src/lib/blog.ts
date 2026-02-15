import { readFile, writeFile } from "fs/promises";
import path from "path";

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  date: string;
  thumbnail: string;
  body: string;
}

export interface BlogData {
  posts: BlogPost[];
}

export async function getBlog(): Promise<BlogData> {
  try {
    const blogPath = path.join(process.cwd(), "src", "data", "blog.json");
    const raw = await readFile(blogPath, "utf-8");
    const data = JSON.parse(raw) as BlogData;
    return { posts: Array.isArray(data.posts) ? data.posts : [] };
  } catch {
    return { posts: [] };
  }
}

export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  const { posts } = await getBlog();
  return posts.find((p) => p.slug === slug) ?? null;
}

export async function saveBlog(data: BlogData): Promise<void> {
  const blogPath = path.join(process.cwd(), "src", "data", "blog.json");
  await writeFile(blogPath, JSON.stringify(data, null, 2), "utf-8");
}
