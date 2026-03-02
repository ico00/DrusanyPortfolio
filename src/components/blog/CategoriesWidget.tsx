"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
  BLOG_CATEGORIES,
  getBlogCategoryOptions,
  postHasCategory,
  type BlogCategoryItem,
} from "@/data/blogCategories";
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
  const activeSlug = searchParams.get("kategorija") ?? undefined;

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
        {widgetItems.map((item) => {
              if (item.type === "flat") {
                return (
                  <li key={item.slug}>
                    <Link
                      href={`/blog?kategorija=${encodeURIComponent(item.slug)}`}
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
                    <div className="flex items-stretch gap-0.5">
                      <button
                        type="button"
                        onClick={() => toggleParent(cat.slug)}
                        className="flex shrink-0 items-center justify-center px-1.5 py-2 text-zinc-400 hover:text-zinc-600 transition-colors"
                        aria-expanded={isParentExpanded}
                      >
                        {isParentExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                      <Link
                        href={`/blog?kategorija=${encodeURIComponent(cat.slug)}`}
                        scroll={false}
                        className={`flex-1 block px-2 py-2 text-sm min-w-0 ${
                          isParentActive ? BLOG_WIDGET_UI.itemActive : BLOG_WIDGET_UI.itemInactive
                        }`}
                      >
                        <span className="flex items-center justify-between gap-2">
                          {cat.label}
                          <span className="text-xs text-zinc-400 shrink-0">({parentCount})</span>
                        </span>
                      </Link>
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
                                href={`/blog?kategorija=${encodeURIComponent(slug)}`}
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
    </>
  );
}
