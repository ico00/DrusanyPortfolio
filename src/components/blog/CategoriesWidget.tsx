"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getBlogCategoryOptions, postHasCategory } from "@/data/blogCategories";
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
  const searchParams = useSearchParams();
  const activeSlug = searchParams.get("kategorija") ?? undefined;
  const counts = getCategoryCounts(posts);
  const options = getBlogCategoryOptions();
  const items = options.filter((opt) => counts[opt.slug] != null);

  if (items.length === 0) {
    return null;
  }

  return (
    <aside className="rounded-lg bg-white p-5 shadow-sm">
      <h3 className="font-serif text-lg font-normal tracking-tight text-zinc-900">{title}</h3>
      <ul className="mt-4 space-y-2">
        <li>
          <Link
            href="/blog"
            scroll={false}
            className={`block rounded-md px-3 py-2 text-sm transition-colors ${
              !activeSlug
                ? "bg-zinc-100 font-medium text-zinc-900"
                : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
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
              className={`block rounded-md px-3 py-2 text-sm transition-colors ${
                activeSlug === slug
                  ? "bg-zinc-100 font-medium text-zinc-900"
                  : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
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
    </aside>
  );
}
