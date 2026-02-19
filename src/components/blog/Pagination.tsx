"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

/** Build href for a page: 1 = /blog, 2+ = /blog/page/N */
function pageHref(page: number): string {
  return page === 1 ? "/blog" : `/blog/page/${page}`;
}

export default function Pagination({
  currentPage,
  totalPages,
}: {
  currentPage: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  const prevHref = currentPage > 1 ? pageHref(currentPage - 1) : null;
  const nextHref = currentPage < totalPages ? pageHref(currentPage + 1) : null;

  /** Page numbers to show: first, last, current, current±1, with ellipsis when far */
  const show = new Set<number>([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);
  const valid = [...show].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);

  const sorted: (number | "ellipsis")[] = [];
  for (let i = 0; i < valid.length; i++) {
    sorted.push(valid[i]);
    if (i < valid.length - 1 && valid[i + 1] - valid[i] > 1) {
      sorted.push("ellipsis");
    }
  }

  return (
    <nav
      className="mt-12 flex flex-wrap items-center justify-center gap-2 border-t border-zinc-200 pt-8"
      aria-label="Blog pagination"
    >
      {prevHref ? (
        <Link
          href={prevHref}
          className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Link>
      ) : (
        <span
          className="inline-flex cursor-default items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-zinc-400"
          aria-hidden
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </span>
      )}

      <div className="flex items-center gap-1">
        {sorted.map((p, i) =>
          p === "ellipsis" ? (
            <span key={`ellipsis-${i}`} className="px-2 text-zinc-400">
              …
            </span>
          ) : p === currentPage ? (
            <span
              key={p}
              className="inline-flex h-9 min-w-[2.25rem] items-center justify-center rounded-md bg-zinc-900 px-2 text-sm font-medium text-white"
              aria-current="page"
            >
              {p}
            </span>
          ) : (
            <Link
              key={p}
              href={pageHref(p)}
              className="inline-flex h-9 min-w-[2.25rem] items-center justify-center rounded-md px-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
            >
              {p}
            </Link>
          )
        )}
      </div>

      {nextHref ? (
        <Link
          href={nextHref}
          className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
          aria-label="Next page"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <span
          className="inline-flex cursor-default items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-zinc-400"
          aria-hidden
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </span>
      )}
    </nav>
  );
}
