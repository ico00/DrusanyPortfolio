import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getBlogWithBodies,
  getPublishedPosts,
  type BlogPost,
} from "@/lib/blog";
import { getTotalPages, sortPostsByDate } from "@/lib/pagination";
import {
  blogCategoryListPath,
  getAllBlogCategorySlugs,
  getBlogCategoryLabel,
  postHasCategory,
} from "@/data/blogCategories";
import BlogListLayout from "@/components/blog/BlogListLayout";
import { getPages } from "@/lib/pages";

export const dynamicParams = false;

const VALID_CATEGORY_SLUGS = new Set(getAllBlogCategorySlugs());

function normalizeBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://drusany.com").replace(
    /\/+$/,
    "",
  );
}

export async function generateStaticParams() {
  return getAllBlogCategorySlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const normalized = slug.toLowerCase().trim();
  if (!VALID_CATEGORY_SLUGS.has(normalized)) {
    return { title: "Blog" };
  }

  const pages = await getPages();
  const blogPage = pages.blog;
  const label = getBlogCategoryLabel(normalized);
  const baseTitle =
    blogPage?.seo?.metaTitle?.trim() || blogPage?.title || "Blog";
  const title = `${label} | ${baseTitle}`;
  const description =
    blogPage?.seo?.metaDescription?.trim() ||
    `Članci u kategoriji ${label}.`;

  const { posts } = await getBlogWithBodies();
  const published = getPublishedPosts(posts as BlogPost[]);
  const sorted = sortPostsByDate(published as BlogPost[]);
  const inCategory = sorted.filter((p) => postHasCategory(p, normalized));
  const latest = inCategory[0];
  const imagePath =
    latest?.thumbnail ||
    (latest?.gallery && latest.gallery.length > 0
      ? latest.gallery[0]
      : undefined);
  const baseUrl = normalizeBaseUrl();
  const imageUrl = imagePath
    ? `${baseUrl}${imagePath.startsWith("/") ? imagePath : `/${imagePath}`}`
    : undefined;

  const canonicalPath = blogCategoryListPath(normalized);
  const pageUrl = `${baseUrl}${canonicalPath}`.replace(/\/+$/, "");

  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title,
      description,
      type: "website",
      url: pageUrl,
      ...(imageUrl && {
        images: [{ url: imageUrl, alt: latest?.title ?? label }],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(imageUrl && { images: [imageUrl] }),
    },
  };
}

export default async function BlogCategoryListPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const normalized = slug.toLowerCase().trim();
  if (!VALID_CATEGORY_SLUGS.has(normalized)) {
    notFound();
  }

  const { posts } = await getBlogWithBodies();
  const published = getPublishedPosts(posts as BlogPost[]);
  const sorted = sortPostsByDate(published as BlogPost[]);
  const totalPages = getTotalPages(sorted.length);

  return (
    <BlogListLayout
      posts={sorted}
      currentPage={1}
      totalPages={totalPages}
      initialCategorySlug={normalized}
    />
  );
}
