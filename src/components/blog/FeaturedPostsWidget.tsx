"use client";

import Link from "next/link";
import { formatBlogDate } from "@/data/blogCategories";
import { BLOG_WIDGET_UI } from "@/data/blogWidgetUI";
import type { BlogPost } from "@/lib/blog";

interface FeaturedPostsWidgetProps {
  title?: string;
  posts: BlogPost[];
}

export default function FeaturedPostsWidget({
  title = "Istaknuti članci",
  posts,
}: FeaturedPostsWidgetProps) {
  const featured = posts
    .filter((p) => p.featured)
    .sort((a, b) => {
      const da = a.date + (a.time || "00:00");
      const db = b.date + (b.time || "00:00");
      return db.localeCompare(da);
    })
    .slice(0, 3);

  if (featured.length === 0) {
    return null;
  }

  return (
    <>
      <h3 className={BLOG_WIDGET_UI.title}>{title}</h3>
      <ul className="mt-4 space-y-3">
        {featured.map((post) => {
          // generateStaticParams vraća slug s .html – href mora biti konzistentan (dev i prod)
          const href = `/blog/${post.slug}.html`;

          return (
          <li key={post.id}>
            <Link
              href={href}
              className="group block overflow-hidden rounded-lg transition-colors duration-150 hover:bg-zinc-50"
            >
              <div className="flex gap-3">
                {post.thumbnail ? (
                  <div className={BLOG_WIDGET_UI.thumbnailImage}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={post.thumbnail}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                      style={{
                        objectPosition: post.thumbnailFocus || "50% 50%",
                      }}
                    />
                  </div>
                ) : (
                  <div className={BLOG_WIDGET_UI.thumbnailPlaceholder}>
                    <span className="text-2xl">·</span>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-zinc-900 line-clamp-2 group-hover:text-zinc-700">
                    {post.title}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {formatBlogDate(post.date)}
                  </p>
                </div>
              </div>
            </Link>
          </li>
        )})}
      </ul>
    </>
  );
}
