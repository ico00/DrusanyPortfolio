"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Image as ImageIcon, Filter, Grid3X3, List, Trash2, Download, Copy, Check, AlertCircle, X, ChevronLeft, ChevronRight, Search, Unlink, Square, CheckSquare } from "lucide-react";
import type { MediaItem, MediaUsage } from "@/app/api/media/route";
import { ADMIN_UI } from "@/data/adminUI";

type FilterType = "all" | "portfolio" | "blog" | "page";
type ViewMode = "grid" | "list";

const PAGE_SIZE = 25;

export default function AdminMedia() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageJumpInput, setPageJumpInput] = useState("");
  const [detachOpenFor, setDetachOpenFor] = useState<string | null>(null);
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
  const detachDropdownRef = useRef<HTMLDivElement>(null);

  const toggleSelect = (url: string) => {
    setSelectedUrls((prev) => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  };

  const deselectAll = () => setSelectedUrls(new Set());

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (detachOpenFor && detachDropdownRef.current && !detachDropdownRef.current.contains(e.target as Node)) {
        setDetachOpenFor(null);
      }
    };
    document.addEventListener("click", onOutside);
    return () => document.removeEventListener("click", onOutside);
  }, [detachOpenFor]);

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
    let result = filter === "all"
      ? items
      : items.filter((i) => i.usages.some((u) => u.type === filter));
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((item) => {
        const filename = (item.filename || "").toLowerCase();
        const url = (item.url || "").toLowerCase();
        const usageText = item.usages
          .map((u) => `${u.type} ${u.label} ${u.context ?? ""}`.toLowerCase())
          .join(" ");
        return filename.includes(q) || url.includes(q) || usageText.includes(q);
      });
    }
    return result;
  })();

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const startIdx = (safePage - 1) * PAGE_SIZE;

  const selectAllOnPage = () => setSelectedUrls(new Set(paginatedItems.map((i) => i.url)));
  const selectAllFiltered = () => setSelectedUrls(new Set(filtered.map((i) => i.url)));

  const selectedItems = filtered.filter((i) => selectedUrls.has(i.url));
  const selectedDeletable = selectedItems.filter((i) => i.url.startsWith("/uploads/"));

  const handleBulkDelete = async () => {
    if (selectedDeletable.length === 0) return;
    if (!confirm(`Delete ${selectedDeletable.length} file(s)?`)) return;
    let success = 0;
    let failed = 0;
    for (const item of selectedDeletable) {
      try {
        const res = await fetch("/api/media-delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: item.url }),
        });
        if (res.ok) success++;
        else failed++;
      } catch {
        failed++;
      }
    }
    if (failed > 0) showToast("error", `Deleted ${success}, failed ${failed}.`);
    else showToast("success", `Deleted ${success} file(s).`);
    setSelectedUrls(new Set());
    fetchItems();
  };

  const handleBulkDownload = () => {
    if (selectedItems.length === 0) return;
    selectedItems.forEach((item, i) => {
      setTimeout(() => handleDownload(item), i * 100);
    });
    showToast("success", `Downloading ${selectedItems.length} file(s)...`);
  };

  const handleBulkCopyUrls = async () => {
    if (selectedItems.length === 0) return;
    const fullUrls = selectedItems.map((i) => getFullUrl(i.url));
    try {
      await navigator.clipboard.writeText(fullUrls.join("\n"));
      showToast("success", `Copied ${selectedItems.length} URL(s).`);
    } catch {
      showToast("error", "Copy failed.");
    }
  };

  const handleBulkDetach = async () => {
    if (selectedItems.length === 0) return;
    const totalUsages = selectedItems.reduce((sum, i) => sum + i.usages.length, 0);
    if (totalUsages === 0) return;
    if (!confirm(ADMIN_UI.mediaBulk.detachConfirm(selectedItems.length))) return;
    let success = 0;
    let failed = 0;
    for (const item of selectedItems) {
      for (const usage of item.usages) {
        try {
          const res = await fetch("/api/media-detach", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: item.url, usage }),
          });
          if (res.ok) success++;
          else failed++;
        } catch {
          failed++;
        }
      }
    }
    if (failed > 0) showToast("error", `Detached ${success}, failed ${failed}.`);
    else showToast("success", `Detached ${success} usage(s).`);
    setSelectedUrls(new Set());
    fetchItems();
  };

  useEffect(() => {
    setPage(1);
    setSelectedUrls(new Set());
  }, [filter, searchQuery]);

  const lightboxItem = lightboxIndex !== null && lightboxIndex < filtered.length ? filtered[lightboxIndex] ?? null : null;
  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);
  const goPrev = () => setLightboxIndex((i) => (i === null || i <= 0 ? i : i - 1));
  const goNext = () => setLightboxIndex((i) => (i === null || i >= filtered.length - 1 ? i : i + 1));
  const hasPrev = lightboxIndex !== null && lightboxIndex > 0;
  const hasNext = lightboxIndex !== null && lightboxIndex < filtered.length - 1;

  useEffect(() => {
    if (lightboxIndex !== null && lightboxIndex >= filtered.length) setLightboxIndex(null);
  }, [lightboxIndex, filtered.length]);

  useEffect(() => {
    if (lightboxIndex !== null) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [lightboxIndex]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setLightboxIndex(null);
        return;
      }
      if (lightboxIndex === null) return;
      if (e.key === "ArrowLeft") setLightboxIndex((i) => (i !== null && i > 0 ? i - 1 : i));
      if (e.key === "ArrowRight") setLightboxIndex((i) => (i !== null && i < filtered.length - 1 ? i + 1 : i));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIndex, filtered.length]);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const usageBadge = (u: MediaUsage) => {
    const colors =
      u.type === "portfolio"
        ? "bg-emerald-500/20 text-emerald-400"
        : u.type === "blog"
          ? "bg-violet-500/20 text-violet-400"
          : "bg-blue-500/20 text-blue-400";
    return (
      <span
        key={`${u.type}-${u.label}-${u.context ?? ""}`}
        className={`inline-block rounded px-1.5 py-0.5 text-xs ${colors}`}
      >
        {u.type}: {u.label}
        {u.context ? ` (${u.context})` : ""}
      </span>
    );
  };

  const usageLabel = (u: MediaUsage) =>
    `${u.type}: ${u.label}${u.context ? ` (${u.context})` : ""}`;

  const formatDate = (iso?: string) => {
    if (!iso) return "—";
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("hr-HR", { day: "2-digit", month: "2-digit", year: "numeric" });
    } catch {
      return iso;
    }
  };

  const getFullUrl = (url: string) =>
    typeof window !== "undefined" ? `${window.location.origin}${url}` : url;

  const handleDelete = async (item: MediaItem) => {
    if (!item.url.startsWith("/uploads/")) {
      showToast("error", ADMIN_UI.media.deleteError);
      return;
    }
    if (!confirm(ADMIN_UI.media.deleteConfirm)) return;
    try {
      const res = await fetch("/api/media-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: item.url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || ADMIN_UI.media.deleteError);
      showToast("success", ADMIN_UI.media.deleteSuccess);
      fetchItems();
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : ADMIN_UI.media.deleteError);
    }
  };

  const handleDownload = (item: MediaItem) => {
    try {
      const fullUrl = getFullUrl(item.url);
      const a = document.createElement("a");
      a.href = fullUrl;
      a.download = item.filename;
      a.target = "_blank";
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      showToast("error", ADMIN_UI.media.downloadError);
    }
  };

  const handleCopyUrl = async (item: MediaItem) => {
    try {
      const fullUrl = getFullUrl(item.url);
      await navigator.clipboard.writeText(fullUrl);
      setCopiedUrl(item.url);
      setTimeout(() => setCopiedUrl(null), 2000);
      showToast("success", ADMIN_UI.media.urlCopied);
    } catch {
      showToast("error", "Copy failed.");
    }
  };

  const handleDetach = async (item: MediaItem, usage: MediaUsage) => {
    setDetachOpenFor(null);
    try {
      const res = await fetch("/api/media-detach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: item.url, usage }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || ADMIN_UI.media.detachError);
      showToast("success", ADMIN_UI.media.detachSuccess);
      fetchItems();
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : ADMIN_UI.media.detachError);
    }
  };

  const formatUsageForDetach = (u: MediaUsage) =>
    `${u.type}: ${u.label}${u.context ? ` (${u.context})` : ""}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex w-64 items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/50 focus-within:border-zinc-600 focus-within:ring-1 focus-within:ring-zinc-500">
            <Search className="ml-3 h-4 w-4 shrink-0 text-zinc-500" strokeWidth={2} />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={ADMIN_UI.media.searchPlaceholder}
              className="w-full min-w-0 bg-transparent py-2 pr-3 text-sm text-zinc-200 outline-none placeholder:text-zinc-500"
              aria-label="Search images"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-zinc-500" />
            <span className="text-sm text-zinc-500">Filter:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {(["all", "portfolio", "blog", "page"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  filter === f
                    ? "bg-zinc-700 text-zinc-100"
                    : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50 hover:text-zinc-300"
                }`}
              >
                {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <span className="text-sm text-zinc-500">
            {filtered.length} image{filtered.length !== 1 ? "s" : ""}
            {totalPages > 1 && ` · Page ${safePage} of ${totalPages}`}
          </span>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-zinc-700 p-1">
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={`rounded-md p-1.5 transition-colors ${
              viewMode === "grid" ? "bg-zinc-700 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
            }`}
            title="Grid view"
          >
            <Grid3X3 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`rounded-md p-1.5 transition-colors ${
              viewMode === "list" ? "bg-zinc-700 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
            }`}
            title="List view"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {selectedUrls.size > 0 && !loading && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-400">
              {ADMIN_UI.mediaBulk.selectedCount(selectedUrls.size)}
            </span>
            <button
              type="button"
              onClick={selectAllOnPage}
              className="text-sm text-zinc-500 hover:text-zinc-300"
            >
              {ADMIN_UI.mediaBulk.selectPage}
            </button>
            <button
              type="button"
              onClick={selectAllFiltered}
              className="text-sm text-zinc-500 hover:text-zinc-300"
            >
              {ADMIN_UI.mediaBulk.selectAll}
            </button>
            <button
              type="button"
              onClick={deselectAll}
              className="text-sm text-zinc-500 hover:text-zinc-300"
            >
              {ADMIN_UI.mediaBulk.deselectAll}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBulkDownload}
              className="flex items-center gap-2 rounded-lg bg-zinc-700 px-3 py-1.5 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-600"
            >
              <Download className="h-4 w-4" />
              {ADMIN_UI.mediaBulk.downloadSelected}
            </button>
            <button
              type="button"
              onClick={handleBulkCopyUrls}
              className="flex items-center gap-2 rounded-lg bg-zinc-700 px-3 py-1.5 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-600"
            >
              <Copy className="h-4 w-4" />
              {ADMIN_UI.mediaBulk.copyUrls}
            </button>
            {selectedItems.some((i) => i.usages.length > 0) && (
              <button
                type="button"
                onClick={handleBulkDetach}
                className="flex items-center gap-2 rounded-lg bg-zinc-700 px-3 py-1.5 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-600"
              >
                <Unlink className="h-4 w-4" />
                {ADMIN_UI.mediaBulk.detachSelected}
              </button>
            )}
            {selectedDeletable.length > 0 && (
              <button
                type="button"
                onClick={handleBulkDelete}
                className="flex items-center gap-2 rounded-lg bg-red-600/80 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-600"
              >
                <Trash2 className="h-4 w-4" />
                {ADMIN_UI.mediaBulk.deleteSelected}
              </button>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 py-16 text-center text-zinc-500">
          <ImageIcon className="mx-auto mb-4 h-12 w-12 text-zinc-600" />
          <p>No images found{filter !== "all" ? ` in ${filter}` : ""}.</p>
        </div>
      ) : viewMode === "list" ? (
        <div className="overflow-hidden rounded-xl border border-zinc-800">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/80">
                <th className="w-10 px-2 py-3 text-left">
                  <button
                    type="button"
                    onClick={() => {
                      const allOnPageSelected = paginatedItems.every((i) => selectedUrls.has(i.url));
                      if (allOnPageSelected) deselectAll();
                      else selectAllOnPage();
                    }}
                    className="rounded p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
                    aria-label={paginatedItems.every((i) => selectedUrls.has(i.url)) ? "Deselect all" : "Select all on page"}
                  >
                    {paginatedItems.every((i) => selectedUrls.has(i.url)) && paginatedItems.length > 0 ? (
                      <CheckSquare className="h-5 w-5 text-zinc-300" />
                    ) : (
                      <Square className="h-5 w-5" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Thumb</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Filename</th>
                <th className="min-w-[7rem] whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">{ADMIN_UI.media.uploadDate}</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Used in</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((item, idx) => (
                <tr
                  key={item.url}
                  className={`border-b border-zinc-800/80 transition-colors last:border-0 hover:bg-zinc-800/30 ${
                    selectedUrls.has(item.url) ? "bg-zinc-800/50" : ""
                  }`}
                >
                  <td className="w-10 px-2 py-2">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toggleSelect(item.url); }}
                      className="rounded p-1.5 text-zinc-500 transition-colors hover:bg-zinc-700 hover:text-zinc-300"
                      aria-label={selectedUrls.has(item.url) ? "Deselect" : "Select"}
                    >
                      {selectedUrls.has(item.url) ? (
                        <CheckSquare className="h-5 w-5 text-zinc-300" />
                      ) : (
                        <Square className="h-5 w-5" />
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-2">
                    <button
                      type="button"
                      onClick={() => openLightbox(startIdx + idx)}
                      className="block shrink-0 cursor-pointer rounded transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
                      aria-label={`Preview ${item.filename}`}
                    >
                      <img
                        src={item.thumb || item.url}
                        alt={item.filename}
                        className="h-12 w-12 rounded object-cover"
                      />
                    </button>
                  </td>
                  <td className="px-4 py-2">
                    <span className="font-mono text-sm text-zinc-300">{item.filename}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 text-sm text-zinc-400">
                    {formatDate(item.uploadDate)}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex flex-wrap gap-1.5">
                      {item.usages.map((u) => (
                        <span
                          key={`${u.type}-${u.label}-${u.context ?? ""}`}
                          className={`inline-block rounded px-1.5 py-0.5 text-xs ${
                            u.type === "portfolio"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : u.type === "blog"
                                ? "bg-violet-500/20 text-violet-400"
                                : "bg-blue-500/20 text-blue-400"
                          }`}
                        >
                          {usageLabel(u)}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => handleDownload(item)}
                        className="rounded p-1.5 text-zinc-500 transition-colors hover:bg-zinc-700 hover:text-zinc-300"
                        title={ADMIN_UI.media.download}
                        aria-label={ADMIN_UI.media.download}
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopyUrl(item)}
                        className="rounded p-1.5 text-zinc-500 transition-colors hover:bg-zinc-700 hover:text-zinc-300"
                        title={ADMIN_UI.media.copyUrl}
                        aria-label={ADMIN_UI.media.copyUrl}
                      >
                        {copiedUrl === item.url ? (
                          <Check className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                      {item.usages.length > 0 && (
                        <div className="relative" ref={detachOpenFor === item.url ? detachDropdownRef : undefined}>
                          <button
                            type="button"
                            onClick={() => setDetachOpenFor(detachOpenFor === item.url ? null : item.url)}
                            className="rounded p-1.5 text-zinc-500 transition-colors hover:bg-zinc-700 hover:text-zinc-300"
                            title={ADMIN_UI.media.detach}
                            aria-label={ADMIN_UI.media.detach}
                          >
                            <Unlink className="h-4 w-4" />
                          </button>
                          {detachOpenFor === item.url && (
                            <div className="absolute right-0 top-full z-20 mt-1 min-w-[12rem] rounded-lg border border-zinc-700 bg-zinc-900 py-1 shadow-xl">
                              <p className="px-3 py-1.5 text-xs font-medium text-zinc-500">
                                {ADMIN_UI.media.detachConfirm}
                              </p>
                              {item.usages.map((u) => (
                                <button
                                  key={`${u.type}-${u.label}-${u.context ?? ""}`}
                                  type="button"
                                  onClick={() => handleDetach(item, u)}
                                  className="block w-full px-3 py-2 text-left text-sm text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
                                >
                                  {formatUsageForDetach(u)}
                                </button>
                              ))}
                              <button
                                type="button"
                                onClick={() => setDetachOpenFor(null)}
                                className="block w-full px-3 py-2 text-left text-sm text-zinc-500 hover:bg-zinc-800"
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                      {item.url.startsWith("/uploads/") && (
                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          className="rounded p-1.5 text-zinc-500 transition-colors hover:bg-red-500/20 hover:text-red-400"
                          title={ADMIN_UI.media.delete}
                          aria-label={ADMIN_UI.media.delete}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
          {paginatedItems.map((item, idx) => (
            <div
              key={item.url}
              className={`group relative aspect-square overflow-hidden rounded-lg border bg-zinc-900/50 text-left transition-colors hover:border-zinc-600 focus-within:ring-2 focus-within:ring-zinc-500 focus-within:ring-offset-2 focus-within:ring-offset-zinc-900 ${
                selectedUrls.has(item.url) ? "border-zinc-500 ring-2 ring-zinc-500/50" : "border-zinc-800"
              }`}
            >
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); toggleSelect(item.url); }}
                className="absolute left-2 top-2 z-10 rounded p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800/80 hover:text-zinc-300"
                aria-label={selectedUrls.has(item.url) ? "Deselect" : "Select"}
              >
                {selectedUrls.has(item.url) ? (
                  <CheckSquare className="h-5 w-5 text-zinc-100" />
                ) : (
                  <Square className="h-5 w-5" />
                )}
              </button>
              <button
                type="button"
                onClick={() => openLightbox(startIdx + idx)}
                className="absolute inset-0 flex items-center justify-center"
              >
                <img
                  src={item.thumb || item.url}
                  alt={item.filename}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="absolute inset-x-0 bottom-0 p-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <p className="truncate text-xs text-zinc-300">{item.filename}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {item.usages.map(usageBadge)}
                  </div>
                </div>
              </button>
            </div>
          ))}
        </div>
      )}

      {!loading && filtered.length > 0 && totalPages > 1 && (
        <nav
          className="flex flex-wrap items-center justify-center gap-2 border-t border-zinc-800 pt-6"
          aria-label="Media pagination"
        >
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage <= 1}
            className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>
          <div className="flex items-center gap-1">
            {(() => {
              const show = new Set<number>([1, totalPages, safePage, safePage - 1, safePage + 1]);
              const valid = [...show].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
              const sorted: (number | "ellipsis")[] = [];
              for (let i = 0; i < valid.length; i++) {
                sorted.push(valid[i]);
                if (i < valid.length - 1 && valid[i + 1] - valid[i] > 1) sorted.push("ellipsis");
              }
              return sorted;
            })().map((p, i) =>
                p === "ellipsis" ? (
                  <span key={`e-${i}`} className="px-2 text-zinc-500">…</span>
                ) : p === safePage ? (
                  <span
                    key={p}
                    className="inline-flex h-9 min-w-[2.25rem] items-center justify-center rounded-lg bg-zinc-700 px-2 text-sm font-medium text-zinc-100"
                    aria-current="page"
                  >
                    {p}
                  </span>
                ) : (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p)}
                    className="inline-flex h-9 min-w-[2.25rem] items-center justify-center rounded-lg px-2 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
                  >
                    {p}
                  </button>
                )
              )}
          </div>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage >= totalPages}
            className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Next page"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="ml-2 flex items-center gap-1 border-l border-zinc-700 pl-4">
            <span className="text-sm text-zinc-500">Go to</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={pageJumpInput}
              onChange={(e) => setPageJumpInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const n = parseInt(pageJumpInput, 10);
                  if (!isNaN(n) && n >= 1 && n <= totalPages) {
                    setPage(n);
                    setPageJumpInput("");
                  }
                }
              }}
              placeholder={String(safePage)}
              className="h-9 w-14 rounded-lg border border-zinc-700 bg-zinc-800/50 px-2 text-center text-sm text-zinc-200 outline-none placeholder:text-zinc-500 focus:border-zinc-600 focus:ring-1 focus:ring-zinc-500 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              aria-label="Go to page"
            />
            <button
              type="button"
              onClick={() => {
                const n = parseInt(pageJumpInput, 10);
                if (!isNaN(n) && n >= 1 && n <= totalPages) {
                  setPage(n);
                  setPageJumpInput("");
                }
              }}
              className="rounded-lg px-2 py-1.5 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
              aria-label="Go to page"
            >
              Go
            </button>
          </div>
        </nav>
      )}

      <AnimatePresence>
        {lightboxItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] flex flex-col bg-zinc-950"
            onClick={closeLightbox}
            role="dialog"
            aria-modal="true"
            aria-label="Image preview"
          >
            <div className="absolute left-0 right-0 top-0 z-20 flex items-center px-6 py-6 md:px-12">
              <div className="flex-1" />
              {filtered.length > 1 && (
                <p className="text-[10px] font-medium tracking-[0.3em] text-white/60">
                  {lightboxIndex !== null && lightboxIndex + 1} / {filtered.length}
                </p>
              )}
              <div className="flex flex-1 items-center justify-end">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); closeLightbox(); }}
                  className="flex h-10 w-10 shrink-0 items-center justify-center text-white/70 transition-all duration-200 hover:text-white"
                  aria-label="Close"
                >
                  <X className="h-6 w-6" strokeWidth={1.5} />
                </button>
              </div>
            </div>

            {hasPrev && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); goPrev(); }}
                className="absolute left-2 top-1/2 z-20 hidden -translate-y-1/2 p-2 text-white/30 transition-all duration-300 hover:scale-110 hover:text-white md:left-4 md:flex"
                aria-label="Previous"
              >
                <ChevronLeft className="h-12 w-12 md:h-14 md:w-14" strokeWidth={1.5} />
              </button>
            )}
            {hasNext && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); goNext(); }}
                className="absolute right-2 top-1/2 z-20 hidden -translate-y-1/2 p-2 text-white/30 transition-all duration-300 hover:scale-110 hover:text-white md:right-4 md:flex"
                aria-label="Next"
              >
                <ChevronRight className="h-12 w-12 md:h-14 md:w-14" strokeWidth={1.5} />
              </button>
            )}

            <motion.div
              key={lightboxItem.url}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="relative z-10 flex min-h-0 flex-1 items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="flex h-[100vh] shrink-0 items-center justify-center"
                style={{ maxWidth: "min(95vw, 2048px)" }}
              >
                <img
                  src={lightboxItem.url}
                  alt={lightboxItem.filename}
                  className="max-h-full max-w-full select-none object-contain pointer-events-none"
                  draggable={false}
                />
              </div>

              <div
                className="absolute bottom-0 left-0 right-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.85)_0%,rgba(0,0,0,0.4)_25%,rgba(0,0,0,0.1)_50%,transparent_100%)] pb-10 pt-32 md:pb-12 md:pt-36"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mx-auto max-w-2xl px-6 text-center md:px-12">
                  <div className="inline-block rounded-lg border border-white/10 bg-black/50 px-4 py-2 backdrop-blur-sm">
                    <p className="text-[14px] font-medium leading-relaxed tracking-[0.15em] text-white/80">
                      {lightboxItem.filename}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {toast && (
        <div
          className={`${ADMIN_UI.toast.container} ${
            toast.type === "success" ? ADMIN_UI.toast.success : ADMIN_UI.toast.error
          }`}
        >
          {toast.type === "success" ? (
            <Check className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <span className={ADMIN_UI.toast.text}>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
