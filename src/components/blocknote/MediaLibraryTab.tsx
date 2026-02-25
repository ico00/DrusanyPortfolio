"use client";

/**
 * Tab za File Panel – odabir postojeće slike iz Media biblioteke (/api/media).
 * Filter (all/portfolio/blog/page), pretraga, paginacija, lazy loading.
 */
import {
  BlockSchema,
  DefaultBlockSchema,
  DefaultInlineContentSchema,
  DefaultStyleSchema,
  InlineContentSchema,
  StyleSchema,
} from "@blocknote/core";
import { useCallback, useEffect, useState } from "react";
import { useComponentsContext } from "@blocknote/react";
import { useBlockNoteEditor } from "@blocknote/react";
import type { MediaItem } from "@/app/api/media/route";
import { FilePanelProps } from "@blocknote/react";

const PAGE_SIZE = 24;
type FilterType = "all" | "portfolio" | "blog" | "page";
type SortType = "name" | "dateDesc" | "dateAsc";
const FILTER_LABELS: Record<FilterType, string> = {
  all: "All",
  portfolio: "Portfolio",
  blog: "Blog",
  page: "Pages",
};
const SORT_LABELS: Record<SortType, string> = {
  name: "By name",
  dateDesc: "By date (newest)",
  dateAsc: "By date (oldest)",
};

function getFilenameFromUrl(url: string): string {
  const parts = url.split("/");
  return parts[parts.length - 1] || url;
}

export const MediaLibraryTab = <
  B extends BlockSchema = DefaultBlockSchema,
  I extends InlineContentSchema = DefaultInlineContentSchema,
  S extends StyleSchema = DefaultStyleSchema,
>(
  props: FilePanelProps
) => {
  const Components = useComponentsContext()!;
  const editor = useBlockNoteEditor<B, I, S>();
  const block = editor.getBlock(props.blockId)!;

  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [sort, setSort] = useState<SortType>("dateDesc");
  const [page, setPage] = useState(1);

  const fetchItems = useCallback(() => {
    setLoading(true);
    fetch("/api/media")
      .then((res) => res.json())
      .then((data) => setItems(data.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const filtered = (() => {
    let result =
      filter === "all"
        ? items
        : items.filter((i) => i.usages.some((u) => u.type === filter));
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (i) =>
          (i.filename || "").toLowerCase().includes(q) ||
          (i.url || "").toLowerCase().includes(q)
      );
    }
    return [...result].sort((a, b) => {
      if (sort === "name") {
        return (a.filename || "").localeCompare(b.filename || "", undefined, { sensitivity: "base" });
      }
      const dateA = a.uploadDate || "";
      const dateB = b.uploadDate || "";
      if (sort === "dateDesc") return dateB.localeCompare(dateA);
      return dateA.localeCompare(dateB);
    });
  })();

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedItems = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  useEffect(() => {
    setPage(1);
  }, [filter, search, sort]);

  const handleSelect = useCallback(
    (item: MediaItem) => {
      const url = item.url;
      const name = item.filename || getFilenameFromUrl(url);
      const update: Record<string, unknown> = {
        props: { url, name },
      };
      if (block.type === "image") {
        (update.props as Record<string, unknown>).previewWidth = 512;
      }
      editor.updateBlock(props.blockId, update as any);
    },
    [editor, props.blockId, block.type]
  );

  return (
    <Components.FilePanel.TabPanel className="bn-tab-panel min-w-0">
      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as FilterType)}
            className="rounded border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            {(Object.keys(FILTER_LABELS) as FilterType[]).map((f) => (
              <option key={f} value={f}>
                {FILTER_LABELS[f]}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortType)}
            className="rounded border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            {(Object.keys(SORT_LABELS) as SortType[]).map((s) => (
              <option key={s} value={s}>
                {SORT_LABELS[s]}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bn-text-input min-w-0 flex-1 rounded border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
        {loading ? (
          <div className="flex min-h-[200px] items-center justify-center text-sm text-zinc-500">
            Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex min-h-[120px] items-center justify-center text-sm text-zinc-500">
            No images in library.
          </div>
        ) : (
          <>
            <div className="grid max-h-[320px] min-w-0 grid-cols-4 gap-2 overflow-y-auto overflow-x-hidden">
              {paginatedItems.map((item) => (
                <button
                  key={item.url}
                  type="button"
                  onClick={() => handleSelect(item)}
                  className="group relative aspect-square overflow-hidden rounded-lg border border-zinc-600 bg-zinc-800 transition-colors hover:border-amber-500 hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <img
                    src={item.thumb || item.url}
                    alt={item.filename || ""}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between gap-2 text-xs text-zinc-500">
                <span>
                  {filtered.length} image{filtered.length !== 1 ? "s" : ""}
                  {filter !== "all" && ` (${FILTER_LABELS[filter]})`}
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={safePage <= 1}
                    className="rounded px-2 py-1 hover:bg-zinc-700 disabled:opacity-40"
                  >
                    ←
                  </button>
                  <span className="px-2 py-1">
                    {safePage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safePage >= totalPages}
                    className="rounded px-2 py-1 hover:bg-zinc-700 disabled:opacity-40"
                  >
                    →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Components.FilePanel.TabPanel>
  );
};
