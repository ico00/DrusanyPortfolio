import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, PenLine, Camera, Calendar, Tag } from "lucide-react";
import Header from "@/components/Header";
import ProseContent from "@/components/ProseContent";
import BlogGallery from "@/components/BlogGallery";
import BlogSidebar from "@/components/blog/BlogSidebar";
import ScrollToTop from "@/components/blog/ScrollToTop";
import ViewfinderOverlay from "@/components/ViewfinderOverlay";
import { getBlog, getBlogPost, getPublishedPosts } from "@/lib/blog";
import {
  getDisplayCategories,
  getShortCategoryLabel,
  formatBlogDate,
} from "@/data/blogCategories";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post || slug === "_") {
    return { title: "Blog" };
  }
  const title = post.seo?.metaTitle?.trim() || post.title;
  const description = post.seo?.metaDescription?.trim() || undefined;
  const keywords = post.seo?.keywords?.trim()
    ? post.seo.keywords.split(",").map((k) => k.trim()).filter(Boolean)
    : undefined;
  const ogImage = post.thumbnail
    ? { url: post.thumbnail, width: 1200, height: 630, alt: post.title }
    : undefined;
  return {
    title,
    description,
    keywords: keywords?.length ? keywords.join(", ") : undefined,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      title,
      description,
      type: "article",
      images: ogImage ? [ogImage] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: post.thumbnail ? [post.thumbnail] : undefined,
    },
  };
}

export async function generateStaticParams() {
  const { posts } = await getBlog();
  const published = getPublishedPosts(posts);
  return published.length > 0 ? published.map((p) => ({ slug: p.slug })) : [{ slug: "_" }];
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getBlogPost(slug);

  if (!post) {
    if (slug === "_") {
      return (
        <div className="min-h-screen bg-white">
          <Suspense fallback={<div className="h-16" />}>
            <Header />
          </Suspense>
          <article className="mx-auto max-w-4xl px-6 py-24">
            <Link
              href="/blog"
              className="mb-12 inline-flex items-center gap-2 text-sm font-extralight tracking-widest text-zinc-600 transition-colors hover:text-zinc-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Natrag na blog
            </Link>
            <p className="text-lg text-zinc-600">Uskoro.</p>
          </article>
        </div>
      );
    }
    notFound();
  }

  const focusPoint = post.thumbnailFocus || "50% 50%";
  const { posts } = await getBlog();

  return (
    <div className="min-h-screen bg-white pt-16">
      <Suspense fallback={<div className="h-16" />}>
        <Header />
      </Suspense>

      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col gap-12 lg:flex-row lg:gap-16">
          <article className="min-w-0 flex-1">
            <header className="pt-12 md:pt-16">
              <h1 className="font-serif text-3xl font-normal tracking-tight text-zinc-900 md:text-4xl lg:text-5xl">
                {post.title}
              </h1>
              <p className="mt-3 flex flex-wrap items-center gap-y-2 text-sm text-zinc-500">
                <span className="inline-flex items-center gap-1.5" style={{ marginRight: "3rem" }}>
                  <PenLine className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                  <Camera className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                  Tekst i fotografije: Ivica Drusany
                </span>
                <span className="inline-flex items-center gap-1.5" style={{ marginRight: "3rem" }}>
                  <Calendar className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                  Datum objave:{" "}
                  <time dateTime={post.date}>{formatBlogDate(post.date)}</time>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                  Kategorija:{" "}
                  {getDisplayCategories(post).length > 0 ? (
                    getDisplayCategories(post).map((catSlug) => (
                      <Link
                        key={catSlug}
                        href={`/blog?kategorija=${encodeURIComponent(catSlug)}`}
                        className="inline-block border-b border-transparent pb-0.5 text-zinc-600 transition-[color,border-color] duration-200 hover:border-zinc-900 hover:text-zinc-900"
                      >
                        {getShortCategoryLabel(catSlug)}
                      </Link>
                    ))
                  ) : (
                    "—"
                  )}
                </span>
              </p>
            </header>

            {post.thumbnail && (
              <div className="relative mt-6 w-full overflow-hidden bg-zinc-100 md:mt-8">
                <div className="relative aspect-video w-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.thumbnail}
                    alt=""
                    className="h-full w-full object-cover"
                    style={{ objectPosition: focusPoint }}
                  />
                  <ViewfinderOverlay />
                </div>
              </div>
            )}

            <div className="py-12 md:py-16">
              <ProseContent
                html={post.body || ""}
                className="prose prose-lg prose-zinc max-w-none prose-headings:font-serif prose-a:text-zinc-600 prose-a:underline prose-a:hover:text-zinc-900"
              />
              {post.galleryImages && post.galleryImages.length > 0 && (
                <BlogGallery images={post.galleryImages} />
              )}
            </div>
          </article>

          <aside className="w-full shrink-0 lg:w-80">
            <div className="sticky top-24">
              <BlogSidebar posts={posts} />
            </div>
          </aside>
        </div>
      </div>
      <ScrollToTop />
    </div>
  );
}
