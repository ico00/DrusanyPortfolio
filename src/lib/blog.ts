import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import sharp from "sharp";

export interface BlogGalleryImage {
  src: string;
  width: number;
  height: number;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  date: string;
  /** Vrijeme u formatu HH:mm (24h), opcionalno */
  time?: string;
  /** @deprecated Use categories */
  category?: string;
  /** Multiple categories per post */
  categories?: string[];
  thumbnail: string;
  /** Focus point for object-position: "x% y%" e.g. "50% 30%" */
  thumbnailFocus?: string;
  gallery?: string[];
  /** Enriched gallery with dimensions (from getBlogPost) */
  galleryImages?: BlogGalleryImage[];
  body?: string; // body comes from file; deprecated in JSON
  /** Plain text from body for search (from getBlogWithBodies) */
  bodySearchText?: string;
}


export interface BlogData {
  posts: BlogPost[];
}

const BLOG_JSON_PATH = path.join(process.cwd(), "src", "data", "blog.json");
const BLOG_CONTENT_DIR = path.join(process.cwd(), "src", "data", "blog");

/** Get blog folder path for a post: public/uploads/blog/[YYYY-MM-DD]-[slug]/ */
export function getBlogUploadDir(slug: string, date: string): string {
  const datePart = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : date;
  const folderName = datePart ? `${datePart}-${slug}` : slug;
  return path.join(process.cwd(), "public", "uploads", "blog", folderName);
}

/** Get content file path for a post: src/data/blog/[slug].html */
export function getBlogContentPath(slug: string): string {
  return path.join(BLOG_CONTENT_DIR, `${slug}.html`);
}

export async function getBlog(): Promise<BlogData> {
  try {
    const raw = await readFile(BLOG_JSON_PATH, "utf-8");
    const data = JSON.parse(raw) as BlogData;
    const posts = Array.isArray(data.posts) ? data.posts : [];
    return { posts };
  } catch {
    return { posts: [] };
  }
}

/** Strip HTML to plain text for search */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/** Get blog posts with body content for search (plain text, no HTML) */
export async function getBlogWithBodies(): Promise<BlogData> {
  const { posts } = await getBlog();
  const enriched = await Promise.all(
    posts.map(async (post) => {
      let bodySearchText = "";
      try {
        const contentPath = getBlogContentPath(post.slug);
        const body = await readFile(contentPath, "utf-8");
        bodySearchText = stripHtml(body);
      } catch {
        // No body file
      }
      return { ...post, bodySearchText };
    })
  );
  return { posts: enriched };
}

/** Enrich gallery URLs with width/height from file metadata (masonry layout) */
async function enrichBlogGallery(urls: string[]): Promise<BlogGalleryImage[]> {
  const result: BlogGalleryImage[] = [];
  for (const url of urls) {
    const filePath = path.join(process.cwd(), "public", url.startsWith("/") ? url.slice(1) : url);
    try {
      const meta = await sharp(filePath).metadata();
      const w = meta.width ?? 1;
      const h = meta.height ?? 1;
      result.push({ src: url.startsWith("/") ? url : `/${url}`, width: w, height: h });
    } catch {
      result.push({ src: url.startsWith("/") ? url : `/${url}`, width: 1, height: 1 });
    }
  }
  return result;
}

export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  const { posts } = await getBlog();
  const post = posts.find((p) => p.slug === slug) ?? null;
  if (!post) return null;

  const galleryImages =
    (post.gallery?.length ?? 0) > 0
      ? await enrichBlogGallery(post.gallery!)
      : undefined;

  // Read body from file (src/data/blog/[slug].html)
  try {
    const contentPath = getBlogContentPath(slug);
    const body = await readFile(contentPath, "utf-8");
    return { ...post, body, galleryImages };
  } catch {
    return { ...post, galleryImages };
  }
}

export async function saveBlog(data: BlogData): Promise<void> {
  await writeFile(BLOG_JSON_PATH, JSON.stringify(data, null, 2), "utf-8");
}

/** Save post body to HTML file */
export async function saveBlogBody(slug: string, html: string): Promise<void> {
  await mkdir(BLOG_CONTENT_DIR, { recursive: true });
  const contentPath = getBlogContentPath(slug);
  await writeFile(contentPath, html, "utf-8");
}
