import { readFile, writeFile, mkdir, copyFile } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { sanitizeProseHtml } from "./sanitize";

export interface BlogGalleryImage {
  src: string;
  width: number;
  height: number;
  /** Naslov/caption slike */
  title?: string;
  /** Opis slike */
  description?: string;
  /** Camera make + model */
  camera?: string;
  /** Lens model */
  lens?: string;
  /** Exposure time (e.g. "1/500", "2\"") */
  exposure?: string;
  /** Aperture (e.g. "f/2.8") */
  aperture?: string;
  /** ISO speed */
  iso?: number;
  /** Ključne riječi ugrađene u EXIF/IPTC/XMP slike – samo za filter, ne prikazuje se kao caption */
  exifKeywords?: string;
}

/** Metadata po URL-u slike u galeriji */
export interface BlogGalleryMetadata {
  title?: string;
  description?: string;
}

export interface BlogSeo {
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  date: string;
  seo?: BlogSeo;
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
  /** Metadata po URL-u (title, description) – uređuje se u adminu */
  galleryMetadata?: Record<string, BlogGalleryMetadata>;
  /** Enriched gallery with dimensions (from getBlogPost) */
  galleryImages?: BlogGalleryImage[];
  /** Istaknuti post – prikazuje se u widgetu s 3 istaknuta posta */
  featured?: boolean;
  /** Status objave – draft se ne prikazuje javno */
  status?: "draft" | "published";
  /** Autor teksta (default: "Ivica Drusany") */
  authorText?: string;
  /** Autor fotografija (default: "Ivica Drusany") */
  authorPhoto?: string;
  body?: string; // body comes from file; deprecated in JSON
  /** Plain text from body for search (from getBlogWithBodies) */
  bodySearchText?: string;
  /** Prvi paragraf iz body-ja, plain text (from getBlogWithBodies) – teaser na listi postova */
  excerpt?: string;
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

/** Extract image URLs from HTML body (za validaciju pri save). Uključuje src i data-url. */
export function extractImageUrlsFromHtml(html: string): string[] {
  if (!html?.trim()) return [];
  const urls: string[] = [];
  const srcMatches = html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi);
  for (const m of srcMatches) {
    const u = m[1].trim();
    if (u) urls.push(u);
  }
  const dataUrlMatches = html.matchAll(/<img[^>]+data-url=["']([^"']+)["']/gi);
  for (const m of dataUrlMatches) {
    const u = m[1].trim();
    if (u && !urls.includes(u)) urls.push(u);
  }
  return urls;
}

/** Normalizira URL za usporedbu – uklanja query string (?t=...) da cache bust ne uzrokuje lažne alarme. */
export function normalizeImageUrlForCompare(url: string): string {
  const i = url.indexOf("?");
  return i >= 0 ? url.slice(0, i) : url;
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

/** Filtrira samo objavljene postove (status !== "draft") */
export function getPublishedPosts(posts: BlogPost[]): BlogPost[] {
  return posts.filter((p) => p.status !== "draft");
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

/** Uzima prvi neprazan <p> iz HTML-a body-ja, kao plain text, skraćen na maxLen (na granici riječi). */
export function extractExcerpt(html: string, maxLen = 200): string {
  if (!html?.trim()) return "";
  const paragraphs = html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi);
  for (const match of paragraphs) {
    const text = stripHtml(match[1]);
    if (!text) continue;
    if (text.length <= maxLen) return text;
    const truncated = text.slice(0, maxLen);
    const lastSpace = truncated.lastIndexOf(" ");
    return `${truncated.slice(0, lastSpace > 0 ? lastSpace : maxLen)}…`;
  }
  return "";
}

interface BlogExifEntry {
  camera?: string;
  lens?: string;
  exposure?: string;
  aperture?: string;
  iso?: number;
  /** Opis/caption ugrađen u EXIF/IPTC/XMP slike (npr. Photo Mechanic "Description/Caption") */
  description?: string;
  /** Ključne riječi ugrađene u EXIF/IPTC/XMP slike */
  keywords?: string;
}

const BLOG_EXIF_PATH = path.join(process.cwd(), "src", "data", "blogExif.json");

async function getBlogExifMap(): Promise<Record<string, BlogExifEntry>> {
  try {
    const raw = await readFile(BLOG_EXIF_PATH, "utf-8");
    return JSON.parse(raw) as Record<string, BlogExifEntry>;
  } catch {
    return {};
  }
}

/** Get blog posts with body content for search (plain text, no HTML). Samo published. */
export async function getBlogWithBodies(): Promise<BlogData> {
  const { posts } = await getBlog();
  const published = getPublishedPosts(posts);
  const blogExif = await getBlogExifMap();
  const enriched = await Promise.all(
    published.map(async (post) => {
      let bodySearchText = "";
      let excerpt = "";
      try {
        const contentPath = getBlogContentPath(post.slug);
        const body = await readFile(contentPath, "utf-8");
        bodySearchText = stripHtml(body);
        excerpt = extractExcerpt(body);
      } catch {
        // No body file
      }
      const galleryExifText = (post.gallery ?? [])
        .map((url) => {
          const src = url.startsWith("/") ? url : `/${url}`;
          const exif = blogExif[src];
          return [exif?.description, exif?.keywords].filter(Boolean).join(" ");
        })
        .filter(Boolean)
        .join(" ");
      if (galleryExifText) {
        bodySearchText = `${bodySearchText} ${galleryExifText}`.trim();
      }
      return { ...post, bodySearchText, excerpt };
    })
  );
  return { posts: enriched };
}

/** Enrich gallery URLs with width/height, EXIF and metadata */
async function enrichBlogGallery(
  urls: string[],
  galleryMetadata?: Record<string, BlogGalleryMetadata>
): Promise<BlogGalleryImage[]> {
  const blogExif = await getBlogExifMap();

  const result: BlogGalleryImage[] = [];
  for (const url of urls) {
    const filePath = path.join(process.cwd(), "public", url.startsWith("/") ? url.slice(1) : url);
    const src = url.startsWith("/") ? url : `/${url}`;
    let w = 1;
    let h = 1;

    try {
      const meta = await sharp(filePath).metadata();
      w = meta.width ?? 1;
      h = meta.height ?? 1;
    } catch {
      // keep defaults
    }

    const exif = blogExif[src];
    const meta = galleryMetadata?.[src];
    // Ručno uneseni opis ima prednost; EXIF caption (npr. Photo Mechanic Description)
    // popunjava caption samo kad admin nije ništa upisao – tako se ime iz IPTC-a vidi bez dodatnog unosa.
    const description = meta?.description || exif?.description || undefined;
    result.push({
      src,
      width: w,
      height: h,
      ...(meta?.title && { title: meta.title }),
      ...(description && { description }),
      ...(exif?.camera && { camera: exif.camera }),
      ...(exif?.lens && { lens: exif.lens }),
      ...(exif?.exposure && { exposure: exif.exposure }),
      ...(exif?.aperture && { aperture: exif.aperture }),
      ...(exif?.iso != null && { iso: exif.iso }),
      ...(exif?.keywords && { exifKeywords: exif.keywords }),
    });
  }
  return result;
}

/** Get single post by id (for admin edit). Returns full post with body. */
export async function getBlogPostById(id: string): Promise<BlogPost | null> {
  const { posts } = await getBlog();
  const post = posts.find((p) => p.id === id) ?? null;
  if (!post) return null;
  const galleryImages =
    (post.gallery?.length ?? 0) > 0
      ? await enrichBlogGallery(post.gallery!, post.galleryMetadata)
      : undefined;
  try {
    const contentPath = getBlogContentPath(post.slug);
    const body = await readFile(contentPath, "utf-8");
    return { ...post, body: sanitizeProseHtml(body), galleryImages };
  } catch {
    return { ...post, galleryImages };
  }
}

export async function getBlogPost(
  slug: string,
  options?: { includeDraft?: boolean }
): Promise<BlogPost | null> {
  const normalizedSlug = slug.endsWith(".html") ? slug.slice(0, -5) : slug;
  const { posts } = await getBlog();
  const post = posts.find((p) => p.slug === normalizedSlug) ?? null;
  if (!post) return null;
  if (post.status === "draft" && !options?.includeDraft) return null;

  const galleryImages =
    (post.gallery?.length ?? 0) > 0
      ? await enrichBlogGallery(post.gallery!, post.galleryMetadata)
      : undefined;

  // Read body from file (src/data/blog/[slug].html)
  try {
    const contentPath = getBlogContentPath(normalizedSlug);
    const body = await readFile(contentPath, "utf-8");
    return { ...post, body: sanitizeProseHtml(body), galleryImages };
  } catch {
    return { ...post, galleryImages };
  }
}

export async function saveBlog(data: BlogData): Promise<void> {
  await writeFile(BLOG_JSON_PATH, JSON.stringify(data, null, 2), "utf-8");
}

/** Save post body to HTML file. Creates backup of previous version before overwrite. */
export async function saveBlogBody(slug: string, html: string): Promise<void> {
  await mkdir(BLOG_CONTENT_DIR, { recursive: true });
  const contentPath = getBlogContentPath(slug);
  try {
    await copyFile(contentPath, `${contentPath}.backup`);
  } catch {
    // Datoteka ne postoji (novi post) – nema backupa
  }
  await writeFile(contentPath, html, "utf-8");
}
