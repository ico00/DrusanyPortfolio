import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBlogWithBodies } from "@/lib/blog";
import {
  getTotalPages,
  normalizePageParam,
  sortPostsByDate,
} from "@/lib/pagination";
import BlogListLayout from "@/components/blog/BlogListLayout";
import type { BlogPost } from "@/lib/blog";
import { getPages } from "@/lib/pages";

/** Parse segments to page number: [] -> 1, ["page","2"] -> 2. Returns null if invalid. */
function parsePageFromSegments(segments: string[] | undefined): number | null {
  if (!segments || segments.length === 0) return 1;
  if (segments.length !== 2 || segments[0] !== "page") return null;
  return normalizePageParam(segments[1]);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ segments?: string[] }>;
}): Promise<Metadata> {
  const { segments } = await params;
  const page = parsePageFromSegments(segments);
  if (page == null) return { title: "Blog" };

  const pages = await getPages();
  const blogPage = pages.blog;
  const title = blogPage?.seo?.metaTitle?.trim() || blogPage?.title || "Blog";
  const description = blogPage?.seo?.metaDescription?.trim() || undefined;
  const keywords = blogPage?.seo?.keywords?.trim()
    ? blogPage.seo.keywords.split(",").map((k) => k.trim()).filter(Boolean)
    : undefined;

  const baseMeta: Metadata = {
    title: page === 1 ? title : `${title} – Page ${page}`,
    description,
    keywords: keywords?.length ? keywords.join(", ") : undefined,
    openGraph: {
      title: page === 1 ? title : `${title} – Page ${page}`,
      description,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: page === 1 ? title : `${title} – Page ${page}`,
      description,
    },
  };

  if (page === 1) {
    return { ...baseMeta, alternates: { canonical: "/blog" } };
  }
  return {
    ...baseMeta,
    alternates: { canonical: `/blog/page/${page}` },
  };
}

export async function generateStaticParams() {
  const { posts } = await getBlogWithBodies();
  const sorted = sortPostsByDate(posts);
  const totalPages = getTotalPages(sorted.length);

  const params: { segments: string[] }[] = [{ segments: [] }];

  if (totalPages >= 2) {
    for (let i = 2; i <= totalPages; i++) {
      params.push({ segments: ["page", String(i)] });
    }
  }

  return params;
}

export default async function BlogListPage({
  params,
}: {
  params: Promise<{ segments?: string[] }>;
}) {
  const { segments } = await params;
  const page = parsePageFromSegments(segments);

  if (page == null) notFound();

  const { posts } = await getBlogWithBodies();
  const sorted = sortPostsByDate(posts as BlogPost[]);
  const totalPages = getTotalPages(sorted.length);

  if (page > totalPages) notFound();

  return (
    <BlogListLayout
      posts={sorted}
      currentPage={page}
      totalPages={totalPages}
    />
  );
}
