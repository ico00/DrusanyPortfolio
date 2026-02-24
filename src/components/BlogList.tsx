"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { PenLine, Camera, Calendar, Tag } from "lucide-react";
import {
  getDisplayCategories,
  getShortCategoryLabel,
  getBlogCategoryLabel,
  postHasCategory,
  formatBlogDate,
} from "@/data/blogCategories";
import { getPostsForPage } from "@/lib/pagination";
import type { BlogPost } from "@/lib/blog";
import Pagination from "./blog/Pagination";
import ViewfinderOverlay from "./ViewfinderOverlay";

export default function BlogList({
  posts,
  currentPage,
  totalPages,
}: {
  posts: BlogPost[];
  currentPage: number;
  totalPages: number;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const kategorija = searchParams.get("kategorija") ?? undefined;
  const searchQuery = searchParams.get("q") ?? "";

  const hasActiveFilter = Boolean(kategorija || searchQuery.trim());

  let displayPosts: BlogPost[];
  let showPagination = false;

  if (hasActiveFilter) {
    let filtered = kategorija
      ? posts.filter((p) => postHasCategory(p, kategorija))
      : posts;

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      filtered = filtered.filter((post) => {
        const title = (post.title || "").toLowerCase();
        const slug = (post.slug || "").toLowerCase();
        const categoryLabels = getDisplayCategories(post)
          .map((s) => getShortCategoryLabel(s).toLowerCase())
          .join(" ");
        const bodyText = (post.bodySearchText || "").toLowerCase();
        return (
          title.includes(q) ||
          slug.includes(q) ||
          categoryLabels.includes(q) ||
          bodyText.includes(q)
        );
      });
    }

    displayPosts = [...filtered].sort((a, b) => {
      const da = a.date + (a.time || "00:00");
      const db = b.date + (b.time || "00:00");
      return db.localeCompare(da);
    });
  } else {
    displayPosts = getPostsForPage(posts, currentPage);
    showPagination = totalPages > 1;
  }

  if (posts.length === 0) {
    return (
      <p className="mt-8 text-lg leading-relaxed text-zinc-600">Uskoro.</p>
    );
  }

  const filterKey = `${kategorija ?? "all"}_${searchQuery.trim()}`;

  return (
    <AnimatePresence mode="wait">
      {displayPosts.length === 0 ? (
        <motion.p
          key={filterKey}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="mt-8 text-lg leading-relaxed text-zinc-600"
        >
          {searchQuery.trim()
            ? `Nema rezultata za „${searchQuery.trim()}“.`
            : kategorija
              ? `Nema članaka u kategoriji „${getBlogCategoryLabel(kategorija)}“.`
              : "Uskoro."}
        </motion.p>
      ) : (
        <motion.div
          key={filterKey}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <ul className="mt-12 space-y-12">
            {displayPosts.map((post) => (
              <li key={post.id}>
                <article className="group overflow-visible rounded-lg sm:overflow-hidden">
                  <Link href={`/blog/${post.slug}.html`} className="block">
                  <div className="relative aspect-video overflow-hidden bg-zinc-100 -mx-6 w-[calc(100%+3rem)] sm:mx-0 sm:w-full">
                    {post.thumbnail ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={post.thumbnail}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        style={{
                          objectPosition: post.thumbnailFocus || "50% 50%",
                        }}
                      />
                    ) : (
                      <div className="h-full w-full bg-zinc-800" />
                    )}
                    {post.thumbnail && <ViewfinderOverlay />}
                  </div>
                  <div className="bg-white -mx-6 w-[calc(100%+3rem)] border-b-2 border-zinc-200 p-6 text-zinc-900 transition-colors group-hover:border-zinc-300 sm:mx-0 sm:w-full">
                    <h2 className="theme-blog-list-card-title font-normal tracking-tight text-zinc-900">
                      {post.title}
                    </h2>
                    <p className="theme-blog-list-card-metadata mt-3 flex flex-wrap items-center gap-y-2 text-zinc-600">
                      <span
                        className="hidden sm:inline-flex items-center gap-1.5"
                        style={{ marginRight: "3rem" }}
                      >
                        <PenLine className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                        <Camera className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                        Tekst i fotografije: Ivica Drusany
                      </span>
                      <span
                        className="inline-flex items-center gap-1.5"
                        style={{ marginRight: "3rem" }}
                      >
                        <Calendar className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                        <span className="sm:hidden">
                          <time dateTime={post.date}>
                            {formatBlogDate(post.date)}
                          </time>
                        </span>
                        <span className="hidden sm:inline">
                          Datum objave:{" "}
                          <time dateTime={post.date}>
                            {formatBlogDate(post.date)}
                          </time>
                        </span>
                      </span>
                      <span className="hidden sm:inline-flex items-center gap-1.5">
                        <Tag className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                        Kategorija:{" "}
                        {getDisplayCategories(post).length > 0 ? (
                          getDisplayCategories(post).map((slug) => (
                            <button
                              key={slug}
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                router.push(
                                  `/blog?kategorija=${encodeURIComponent(
                                    slug,
                                  )}`,
                                  { scroll: false },
                                );
                              }}
                              className="inline-block border-b border-transparent pb-0.5 text-inherit transition-[color,border-color] duration-200 hover:border-zinc-900 hover:text-zinc-900"
                            >
                              {getShortCategoryLabel(slug)}
                            </button>
                          ))
                        ) : (
                          "—"
                        )}
                      </span>
                    </p>
                  </div>
                </Link>
              </article>
            </li>
            ))}
          </ul>
          {showPagination && (
            <Pagination currentPage={currentPage} totalPages={totalPages} />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
