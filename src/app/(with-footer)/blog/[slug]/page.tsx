import type { Metadata } from "next";
import { preload } from "react-dom";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, PenLine, Camera, Calendar, Tag } from "lucide-react";
import Header from "@/components/Header";
import ProseContent from "@/components/ProseContent";
import BlogGallery from "@/components/BlogGallery";
import BlogSidebar from "@/components/blog/BlogSidebar";
import SearchWidget from "@/components/blog/SearchWidget";
import ScrollToTop from "@/components/blog/ScrollToTop";
import ViewfinderOverlay from "@/components/ViewfinderOverlay";
import { getBlog, getBlogPost, getPublishedPosts } from "@/lib/blog";
import {
  getDisplayCategories,
  getShortCategoryLabel,
  formatBlogDate,
} from "@/data/blogCategories";

export const dynamicParams = false;

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

  // Base URL bez trailing slasha (izbjegava dupli slash)
  const baseUrl = (
    process.env.NEXT_PUBLIC_SITE_URL || "https://drusany.com"
  ).replace(/\/+$/, "");

  const title = post.seo?.metaTitle?.trim() || post.title;
  const description = post.seo?.metaDescription?.trim() || undefined;
  const keywords = post.seo?.keywords?.trim()
    ? post.seo.keywords.split(",").map((k) => k.trim()).filter(Boolean)
    : undefined;

  // Slika: prvo thumbnail, fallback prva iz galerije; apsolutni URL bez duplih slasheva
  const imagePath =
    post.thumbnail ||
    (post.gallery && post.gallery.length > 0 ? post.gallery[0] : undefined);
  const imageUrl = imagePath
    ? `${baseUrl}${imagePath.startsWith("/") ? imagePath : `/${imagePath}`}`
    : undefined;

  // Puni URL – og:url i canonical NIKAD ne smije završavati s /, samo na .html
  const pageUrl = `${baseUrl}/blog/${slug}`.replace(/\/+$/, "");

  return {
    title,
    description,
    keywords: keywords?.length ? keywords.join(", ") : undefined,
    alternates: { canonical: pageUrl },
    openGraph: {
      type: "article",
      url: pageUrl,
      title,
      description,
      images: imageUrl
        ? [
            {
              url: imageUrl,
              width: 1200,
              height: 630,
              alt: post.title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}

export async function generateStaticParams() {
  const { posts } = await getBlog();
  const published = getPublishedPosts(posts);
  if (published.length === 0) {
    return [{ slug: "_" }];
  }

  // Kod exporta se blog postovi koriste kao /blog/${slug}.html,
  // pa slug param ovdje uključuje .html ekstenziju.
  return published.map((p) => ({ slug: `${p.slug}.html` }));
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
  const categories = getDisplayCategories(post);

  // Preload LCP slike za brži Largest Contentful Paint
  if (post.thumbnail) {
    const href = post.thumbnail.startsWith("/") ? post.thumbnail : `/${post.thumbnail}`;
    preload(href, { as: "image", fetchPriority: "high" });
  }
  const { posts } = await getBlog();
  const publishedPosts = getPublishedPosts(posts);

  return (
    <div className="min-h-screen bg-white">
      <Suspense fallback={<div className="h-16" />}>
        <Header />
      </Suspense>

      <div className="mx-auto max-w-7xl px-6 py-24">
        {/* Mobile: search na vrhu – vizual kao na gallery (donja crta, bez okvira) */}
        <div className="mb-6 lg:hidden">
          <Suspense fallback={<div className="h-12 animate-pulse rounded border-b border-zinc-200" />}>
            <SearchWidget variant="minimal" />
          </Suspense>
        </div>
        <div className="flex flex-col gap-12 lg:flex-row lg:gap-16">
          <article className="min-w-0 flex-1">
            <header>
              <h1 className="theme-blog-post-title font-normal tracking-tight">
                {post.title}
              </h1>
              <p className="mt-3 flex flex-wrap items-center gap-y-2 text-sm text-zinc-500">
                <span
                  className="inline-flex items-center gap-1.5"
                  style={{ marginRight: "3rem" }}
                >
                  <Calendar className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                  <span className="sm:hidden">
                    <time dateTime={post.date}>{formatBlogDate(post.date)}</time>
                  </span>
                  <span className="hidden sm:inline">
                    Datum objave:{" "}
                    <time dateTime={post.date}>{formatBlogDate(post.date)}</time>
                  </span>
                </span>
                {/* Kategorija: link/filter pored datuma na mobilu i u zasebnom segmentu na desktopu */}
                <span
                  className="inline-flex items-center gap-1.5 sm:hidden"
                  style={{ marginRight: "3rem" }}
                >
                  <Tag className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                  {categories.length > 0 ? (
                    categories.map((catSlug, index) => (
                      <span key={catSlug}>
                        {index > 0 ? ", " : ""}
                        <Link
                          href={`/blog?kategorija=${encodeURIComponent(
                            catSlug,
                          )}`}
                          className="inline-block border-b border-transparent pb-0.5 text-zinc-600 transition-[color,border-color] duration-200 hover:border-zinc-900 hover:text-zinc-900"
                        >
                          {getShortCategoryLabel(catSlug)}
                        </Link>
                      </span>
                    ))
                  ) : (
                    "—"
                  )}
                </span>
                <span
                  className="hidden sm:inline-flex items-center gap-1.5"
                  style={{ marginRight: "3rem" }}
                >
                  <PenLine className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                  <Camera className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                  Tekst i fotografije: Ivica Drusany
                </span>
                <span className="hidden sm:inline-flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                  Kategorija:{" "}
                  {categories.length > 0 ? (
                    categories.map((catSlug) => (
                      <Link
                        key={catSlug}
                        href={`/blog?kategorija=${encodeURIComponent(
                          catSlug,
                        )}`}
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
              <div className="relative mt-6 overflow-hidden bg-zinc-100 -mx-6 w-[calc(100%+3rem)] md:mx-0 md:mt-8 md:w-full">
                <div className="relative aspect-[3/2] w-full md:aspect-video">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.thumbnail}
                    alt=""
                    loading="eager"
                    fetchPriority="high"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="h-full w-full object-cover"
                    style={{ objectPosition: focusPoint }}
                  />
                  <ViewfinderOverlay />
                </div>
              </div>
            )}

            {/* Autor – ikona + naziv ispod featured slike na mobilu */}
            <p className="mt-3 flex items-center gap-1.5 text-sm text-zinc-500 sm:hidden">
              <PenLine className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
              <Camera className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
              Ivica Drusany
            </p>

            <div className="overflow-x-hidden bg-white py-12 md:py-16 -mx-6 w-[calc(100%+3rem)] px-6 md:mx-0 md:w-full">
              <ProseContent
                html={post.body || ""}
                className="prose prose-lg prose-zinc max-w-none prose-headings:font-serif"
              />
              {post.galleryImages && post.galleryImages.length > 0 && (
                <BlogGallery images={post.galleryImages} />
              )}
            </div>
          </article>

          <aside className="w-full shrink-0 lg:w-80">
            <div className="sticky top-24">
              <BlogSidebar posts={publishedPosts} />
            </div>
          </aside>
        </div>
      </div>
      <ScrollToTop />
    </div>
  );
}
