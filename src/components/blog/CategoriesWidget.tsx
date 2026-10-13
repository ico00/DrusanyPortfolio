"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronDown, Tag } from "lucide-react";
import {
  BLOG_CATEGORIES,
  blogCategoryListPath,
  getBlogCategoryOptions,
  getCategorySlugFromBlogPathname,
  postHasCategory,
  type BlogCategoryItem,
} from "@/data/blogCategories";
import { BLOG_WIDGET_UI } from "@/data/blogWidgetUI";
import type { BlogPost } from "@/lib/blog";

/** Samo polja potrebna za brojanje po kategorijama – izbjegava serijalizaciju
 *  cijelog BlogPost-a (gallery, body…) u RSC payload svake stranice. */
export type CategoriesWidgetPost = Pick<BlogPost, "category" | "categories">;

interface CategoriesWidgetProps {
  title?: string;
  posts: CategoriesWidgetPost[];
}

function getCategoryCounts(posts: CategoriesWidgetPost[]): Record<string, number> {
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

/** Roditelj slug za subkategoriju (npr. nogomet → sport) */
const SUB_TO_PARENT: Record<string, string> = (() => {
  const m: Record<string, string> = {};
  for (const cat of BLOG_CATEGORIES) {
    for (const sub of cat.subcategories ?? []) {
      m[sub.slug] = cat.slug;
    }
  }
  return m;
})();

type WidgetItem =
  | { type: "flat"; slug: string; label: string }
  | { type: "parent"; cat: BlogCategoryItem; subCounts: { slug: string; label: string; count: number }[] };

function buildWidgetItems(counts: Record<string, number>): WidgetItem[] {
  const items: WidgetItem[] = [];

  for (const cat of BLOG_CATEGORIES) {
    if (cat.subcategories && cat.subcategories.length > 0) {
      const subCounts = cat.subcategories
        .map((sub) => ({ ...sub, count: counts[sub.slug] ?? 0 }))
        .filter((s) => s.count > 0)
        .sort((a, b) => a.label.localeCompare(b.label, "hr"));
      const parentCount = counts[cat.slug] ?? subCounts.reduce((s, x) => s + x.count, 0);
      if (parentCount > 0) {
        items.push({ type: "parent", cat, subCounts });
      }
    } else {
      if ((counts[cat.slug] ?? 0) > 0) {
        items.push({ type: "flat", slug: cat.slug, label: cat.label });
      }
    }
  }

  return items.sort((a, b) => {
    const labelA = a.type === "flat" ? a.label : a.cat.label;
    const labelB = b.type === "flat" ? b.label : b.cat.label;
    return labelA.localeCompare(labelB, "hr");
  });
}

export default function CategoriesWidget({ title = "Kategorije", posts }: CategoriesWidgetProps) {
  const [expanded, setExpanded] = useState(false);
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set());
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const activeSlug =
    searchParams.get("kategorija") ??
    getCategorySlugFromBlogPathname(pathname) ??
    undefined;

  const counts = useMemo(() => getCategoryCounts(posts), [posts]);
  const widgetItems = useMemo(() => buildWidgetItems(counts), [counts]);

  useEffect(() => {
    if (activeSlug) setExpanded(true);
    const parent = SUB_TO_PARENT[activeSlug ?? ""];
    if (parent) {
      setExpandedParents((prev) => new Set(prev).add(parent));
    } else if (activeSlug && BLOG_CATEGORIES.some((c) => c.slug === activeSlug && c.subcategories?.length)) {
      setExpandedParents((prev) => new Set(prev).add(activeSlug));
    }
  }, [activeSlug]);

  if (widgetItems.length === 0) {
    return null;
  }

  const toggleParent = (slug: string) => {
    setExpandedParents((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className={`widget-title-bar flex w-full items-center justify-between gap-2 text-left transition-colors bg-zinc-900 hover:bg-zinc-800 -mx-2 -mt-2 p-2 px-3 ${BLOG_WIDGET_UI.title}`}
        aria-expanded={expanded}
      >
        <span className="flex min-w-0 items-center gap-2">
          <Tag className="h-4 w-4 shrink-0" />
          {title}
        </span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-zinc-400 transition-transform duration-200 ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className={`w-full -ml-2 grid overflow-hidden transition-[grid-template-rows] duration-200 ease-out ${
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="min-h-0">
        <div className="bg-zinc-50 p-3">
          <ul className="space-y-1">
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
        {widgetItems.map((item) => {
              if (item.type === "flat") {
                return (
                  <li key={item.slug}>
                    <Link
                      href={blogCategoryListPath(item.slug)}
                      scroll={false}
                      className={`block px-3 py-2 text-sm ${
                        activeSlug === item.slug ? BLOG_WIDGET_UI.itemActive : BLOG_WIDGET_UI.itemInactive
                      }`}
                    >
                      <span className="flex items-center justify-between gap-2">
                        {item.label}
                        <span className="text-xs text-zinc-400">({counts[item.slug]})</span>
                      </span>
                    </Link>
                  </li>
                );
              }

              const { cat, subCounts } = item;
              const parentCount = counts[cat.slug] ?? subCounts.reduce((s, x) => s + x.count, 0);
              const isParentExpanded = expandedParents.has(cat.slug);
              const isParentActive = activeSlug === cat.slug;

              return (
                <li key={cat.slug}>
                  <div className="space-y-0.5">
                    <div className={`flex items-center px-3 py-2 text-sm ${
                      isParentActive ? BLOG_WIDGET_UI.itemActive : BLOG_WIDGET_UI.itemInactive
                    }`}>
                      <Link
                        href={blogCategoryListPath(cat.slug)}
                        scroll={false}
                        className="flex-1 min-w-0"
                      >
                        {cat.label}
                      </Link>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); toggleParent(cat.slug); }}
                        className="flex shrink-0 items-center justify-center px-1 text-zinc-400 hover:text-zinc-600 transition-colors"
                        aria-expanded={isParentExpanded}
                      >
                        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isParentExpanded ? "rotate-180" : ""}`} />
                      </button>
                      <span className="text-xs text-zinc-400 shrink-0 ml-1">({parentCount})</span>
                    </div>
                    <div
                      className={`grid overflow-hidden transition-[grid-template-rows] duration-200 ease-out ${
                        isParentExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                      }`}
                    >
                      <div className="min-h-0">
                        <ul className="ml-6 border-l border-zinc-200 pl-2 space-y-0.5">
                          {subCounts.map(({ slug, label, count }) => (
                            <li key={slug}>
                              <Link
                                href={blogCategoryListPath(slug)}
                                scroll={false}
                                className={`block px-2 py-1.5 text-sm ${
                                  activeSlug === slug ? BLOG_WIDGET_UI.itemActive : BLOG_WIDGET_UI.itemInactive
                                }`}
                              >
                                <span className="flex items-center justify-between gap-2">
                                  {label}
                                  <span className="text-xs text-zinc-400">({count})</span>
                                </span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
        </div>
      </div>
    </>
  );
}
