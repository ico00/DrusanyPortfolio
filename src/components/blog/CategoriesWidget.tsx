"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronDown, ChevronRight } from "lucide-react";
import { getBlogCategoryOptions, postHasCategory } from "@/data/blogCategories";
import { BLOG_WIDGET_UI } from "@/data/blogWidgetUI";
import type { BlogPost } from "@/lib/blog";

interface CategoriesWidgetProps {
  title?: string;
  posts: BlogPost[];
}

function getCategoryCounts(posts: BlogPost[]): Record<string, number> {
  const counts: Record<string, number> = {};
  const options = getBlogCategoryOptions();

  for (const opt of options) {
    const count = posts.filter((p) => postHasCategory(p, opt.slug)).length;
    if (count > 0) {
      counts[opt.slug] = count;
    }
  }

  return counts;
}

export default function CategoriesWidget({ title = "Kategorije", posts }: CategoriesWidgetProps) {
  const [expanded, setExpanded] = useState(false);
  const searchParams = useSearchParams();
  const activeSlug = searchParams.get("kategorija") ?? undefined;

  useEffect(() => {
    if (activeSlug) setExpanded(true);
  }, [activeSlug]);
  const counts = getCategoryCounts(posts);
  const options = getBlogCategoryOptions();
  const items = options
    .filter((opt) => counts[opt.slug] != null)
    .sort((a, b) => a.label.localeCompare(b.label, "hr"));

  if (items.length === 0) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className={`flex w-full items-center justify-between gap-2 text-left transition-colors hover:bg-zinc-50 -m-2 rounded-lg p-2 ${BLOG_WIDGET_UI.title}`}
        aria-expanded={expanded}
      >
        {title}
        {expanded ? (
          <ChevronDown className="h-5 w-5 shrink-0 text-zinc-400" />
        ) : (
          <ChevronRight className="h-5 w-5 shrink-0 text-zinc-400" />
        )}
      </button>
      <div
        className={`grid overflow-hidden transition-[grid-template-rows] duration-200 ease-out ${
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="min-h-0">
          <ul className="mt-3 space-y-1">
        <li>
          <Link
            href="/blog"
            scroll={false}
            className={`block px-3 py-2 text-sm ${
              !activeSlug ? BLOG_WIDGET_UI.itemActive : BLOG_WIDGET_UI.itemInactive
            }`}
          >
            Sve kategorije
          </Link>
        </li>
        {items.map(({ slug, label }) => (
          <li key={slug}>
            <Link
              href={`/blog?kategorija=${encodeURIComponent(slug)}`}
              scroll={false}
              className={`block px-3 py-2 text-sm ${
                activeSlug === slug ? BLOG_WIDGET_UI.itemActive : BLOG_WIDGET_UI.itemInactive
              }`}
            >
              <span className="flex items-center justify-between gap-2">
                {label}
                <span className="text-xs text-zinc-400">({counts[slug]})</span>
              </span>
            </Link>
          </li>
        ))}
          </ul>
        </div>
      </div>
    </>
  );
}
