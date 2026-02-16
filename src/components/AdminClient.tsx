"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// Tamna tema za cijelu admin stranicu (uključujući BlockNote popovere koji renderaju u body)
function useAdminDarkTheme() {
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "dark");
    return () => document.documentElement.removeAttribute("data-theme");
  }, []);
}
import Link from "next/link";
import { DrusanyLogo } from "./Header";
import {
  Upload,
  Image as ImageIcon,
  Trash2,
  Check,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Star,
  Pencil,
  X,
  Square,
  CheckSquare,
  GripVertical,
  FileText,
  BookOpen,
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
} from "lucide-react";
import AdminPages from "./AdminPages";
import AdminBlog from "./AdminBlog";
import AdminDashboard from "./AdminDashboard";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import CategorySelect, { CATEGORIES } from "./CategorySelect";
import VenueSelect from "./VenueSelect";
import SportSelect from "./SportSelect";
import FoodDrinkSelect from "./FoodDrinkSelect";
import DateTimePicker from "./DateTimePicker";
import { generateSlug } from "@/lib/slug";

interface GalleryImage {
  id: string;
  title: string;
  category: string;
  alt: string;
  src: string;
  thumb?: string;
  width: number;
  height: number;
  capturedAt?: string;
  createdAt: string;
  isHero?: boolean;
  camera?: string;
  lens?: string;
  exposure?: string;
  aperture?: string;
  iso?: number;
  venue?: string;
  sport?: string;
  foodDrink?: string;
  keywords?: string;
  slug?: string;
}

type ToastType = "success" | "error" | null;

function normalizeCategory(cat: string): string {
  return cat
    .toLowerCase()
    .replace(/\s*&\s*/g, "-")
    .replace(/\s+/g, "-");
}

interface SortableImageCardProps {
  img: GalleryImage;
  selectedIds: Set<string>;
  toggleSelect: (id: string) => void;
  openEdit: (img: GalleryImage) => void;
  handleSetHero: (img: GalleryImage) => void;
  handleDelete: (img: GalleryImage) => void;
  deletingId: string | null;
  heroId: string | null;
  reordering: boolean;
}

function SortableImageCard({
  img,
  selectedIds,
  toggleSelect,
  openEdit,
  handleSetHero,
  handleDelete,
  deletingId,
  heroId,
  reordering,
}: SortableImageCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: img.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative overflow-hidden rounded-lg border bg-zinc-900/50 transition-colors ${
        isDragging ? "z-50 opacity-90 ring-2 ring-zinc-500" : ""
      } ${
        img.isHero
          ? "border-amber-500/80 ring-2 ring-amber-500/30"
          : selectedIds.has(img.id)
            ? "border-zinc-500 ring-2 ring-zinc-500/50"
            : "border-zinc-800"
      }`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        disabled={reordering}
        className="absolute left-2 top-2 z-10 flex cursor-grab items-center justify-center rounded p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800/80 hover:text-zinc-300 active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Povuci za promjenu redoslijeda"
      >
        <GripVertical className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); toggleSelect(img.id); }}
        className="absolute left-12 top-2 z-10 rounded p-1.5 transition-colors hover:bg-zinc-800/80"
        aria-label={selectedIds.has(img.id) ? "Deselect" : "Select"}
      >
        {selectedIds.has(img.id) ? (
          <CheckSquare className="h-5 w-5 text-zinc-100" />
        ) : (
          <Square className="h-5 w-5 text-zinc-400" />
        )}
      </button>
      <img
        src={img.thumb ?? img.src}
        alt={img.alt || img.title || "Gallery image"}
        className="aspect-square w-full object-cover"
      />
      <div className="absolute inset-0 flex items-center justify-center gap-2 bg-zinc-900/80 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); openEdit(img); }}
          className="rounded-full bg-zinc-700 p-2 text-zinc-400 transition-colors hover:bg-zinc-600 hover:text-white"
          aria-label="Edit description"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); handleSetHero(img); }}
          disabled={heroId === img.id}
          className={`rounded-full p-2 transition-colors disabled:opacity-50 ${img.isHero ? "bg-amber-500/80 text-white" : "bg-zinc-700 text-zinc-400 hover:bg-amber-500/80 hover:text-white"}`}
          aria-label={img.isHero ? "Remove hero" : "Set as hero"}
        >
          {heroId === img.id ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Star className={`h-4 w-4 ${img.isHero ? "fill-current" : ""}`} />
          )}
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); handleDelete(img); }}
          disabled={deletingId === img.id}
          className="rounded-full bg-zinc-700 p-2 text-zinc-400 transition-colors hover:bg-red-600/80 hover:text-white disabled:opacity-50"
          aria-label="Delete image"
        >
          {deletingId === img.id ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </button>
      </div>
      <div className="p-3">
        <p className="truncate text-sm font-medium text-zinc-200">
          {img.title || "Untitled"}
        </p>
        <p className="text-xs text-zinc-500">{img.category}</p>
        {(img.capturedAt || img.createdAt) && (
          <p className="mt-1 text-xs text-zinc-600">
            {new Date(img.capturedAt || img.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            })}
          </p>
        )}
      </div>
    </div>
  );
}

export default function AdminClient() {
  useAdminDarkTheme();

  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [capturedAt, setCapturedAt] = useState("");
  const [venue, setVenue] = useState("");
  const [sport, setSport] = useState("");
  const [foodDrink, setFoodDrink] = useState("");
  const [keywords, setKeywords] = useState("");
  const [isHero, setIsHero] = useState(false);
  const [loadingExif, setLoadingExif] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [heroId, setHeroId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    title: string;
    category: string;
    capturedAt: string;
    venue: string;
    sport: string;
    foodDrink: string;
    keywords: string;
    slug: string;
    camera: string;
    lens: string;
    exposure: string;
    aperture: string;
    iso: string;
  }>({
    title: "",
    category: "",
    capturedAt: "",
    venue: "",
    sport: "",
    foodDrink: "",
    keywords: "",
    slug: "",
    camera: "",
    lens: "",
    exposure: "",
    aperture: "",
    iso: "",
  });
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(
    null
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [duplicateModal, setDuplicateModal] = useState<{
    file: File;
    filePreviewUrl: string;
    existingSrc: string;
    existingThumb: string;
    filename: string;
    existingSize: number | null;
  } | null>(null);
  const duplicateResolveRef = useRef<((action: "overwrite" | "add" | "cancel") => void) | null>(null);
  const editFormRef = useRef<HTMLFormElement | null>(null);
  const [adminTab, setAdminTab] = useState<"dashboard" | "gallery" | "about" | "contact" | "blog">("dashboard");
  const [pagesExpanded, setPagesExpanded] = useState(false);
  const [galleryExpanded, setGalleryExpanded] = useState(false);

  useEffect(() => {
    if (adminTab === "about" || adminTab === "contact") {
      setPagesExpanded(true);
      setGalleryExpanded(false);
    }
  }, [adminTab]);

  useEffect(() => {
    if (adminTab === "gallery" && category) {
      setGalleryExpanded(true);
      setPagesExpanded(false);
    }
  }, [adminTab, category]);

  const fetchGallery = useCallback(async () => {
    try {
      const res = await fetch("/api/gallery");
      if (res.ok) {
        const data = await res.json();
        setImages(data.images || []);
      }
    } catch {
      setImages([]);
    } finally {
      setLoadingGallery(false);
    }
  }, []);

  useEffect(() => {
    fetchGallery();
  }, [fetchGallery]);

  useEffect(() => {
    if (files.length === 0) {
      setPreviewUrls([]);
      return;
    }
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviewUrls(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  const showToast = (type: ToastType, message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const uploadSingleFile = async (
    file: File,
    opts: { isHero?: boolean; overwrite?: boolean; addWithSuffix?: boolean } = {}
  ): Promise<{ ok: boolean; duplicate?: boolean; data?: unknown }> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    formData.append("category", category);
    formData.append("alt", title || "");
    formData.append("isHero", String(opts.isHero));
    if (capturedAt) formData.append("capturedAt", capturedAt);
    if (venue) formData.append("venue", venue);
    if (sport) formData.append("sport", sport);
    if (foodDrink) formData.append("foodDrink", foodDrink);
    if (keywords) formData.append("keywords", keywords);
    if (opts.overwrite) formData.append("overwrite", "true");
    if (opts.addWithSuffix) formData.append("addWithSuffix", "true");

    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();

    if (res.ok) return { ok: true, data };
    if (res.status === 409 && data.error === "Duplicate") return { ok: false, duplicate: true, data };
    return { ok: false, data };
  };

  const handleDuplicateChoice = useCallback(
    (action: "overwrite" | "add" | "cancel") => {
      duplicateResolveRef.current?.(action);
      duplicateResolveRef.current = null;
      setDuplicateModal(null);
    },
    []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) {
      showToast("error", "Select one or more images before submitting.");
      return;
    }

    setLoading(true);
    setUploadProgress({ current: 0, total: files.length });
    let successCount = 0;
    let failCount = 0;
    let lastError: string | null = null;

    try {
      for (let i = 0; i < files.length; i++) {
        setUploadProgress({ current: i + 1, total: files.length });
        const file = files[i];
        let result = await uploadSingleFile(file, { isHero: i === 0 && isHero });

        if (result.duplicate && result.data) {
          const d = result.data as { existingSrc?: string; existingThumb?: string; filename?: string; existingSize?: number };
          const filePreviewUrl = URL.createObjectURL(file);
          const choice = await new Promise<"overwrite" | "add" | "cancel">((resolve) => {
            duplicateResolveRef.current = resolve;
            setDuplicateModal({
              file,
              filePreviewUrl,
              existingSrc: d.existingSrc || "",
              existingThumb: d.existingThumb || "",
              filename: d.filename || "",
              existingSize: d.existingSize ?? null,
            });
          });
          URL.revokeObjectURL(filePreviewUrl);

          if (choice === "overwrite") {
            result = await uploadSingleFile(file, { isHero: i === 0 && isHero, overwrite: true });
          } else if (choice === "add") {
            result = await uploadSingleFile(file, { isHero: i === 0 && isHero, addWithSuffix: true });
          }
        }

        if (result.ok) {
          successCount++;
        } else {
          failCount++;
          lastError = (result.data as { error?: string })?.error || "Upload failed.";
        }
      }

      if (successCount > 0) {
        const failMsg =
          failCount > 0
            ? failCount === 1
              ? "1 skipped."
              : `${failCount} skipped.`
            : "";
        showToast(
          "success",
          failCount > 0
            ? `${successCount} added${failMsg ? `, ${failMsg}` : ""}`
            : files.length === 1
              ? "Image added to gallery."
              : `${successCount} images added to gallery.`
        );
        setFiles([]);
        setTitle("");
        setCapturedAt("");
        setVenue("");
        setSport("");
        setFoodDrink("");
        setIsHero(false);
        fetchGallery();
      }
      if (failCount > 0 && successCount === 0) {
        showToast("error", lastError || "Upload failed.");
      }
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
      setUploadProgress(null);
      setDuplicateModal(null);
      duplicateResolveRef.current = null;
    }
  };

  const processSelectedFiles = useCallback(
    async (selected: File[]) => {
      if (selected.length === 0) return;
      setFiles(selected);
      setTitle("");
      setCapturedAt("");
      setKeywords("");
      if (selected.length === 1) {
        setLoadingExif(true);
        try {
          const fd = new FormData();
          fd.append("file", selected[0]);
          const res = await fetch("/api/exif-preview", {
            method: "POST",
            body: fd,
          });
          if (res.ok) {
            const { date, description, keywords: exifKeywords } = await res.json();
            if (description) setTitle(description);
            if (date && typeof date === "string") {
              setCapturedAt(date.length >= 16 ? date.slice(0, 16) : date);
            }
            if (exifKeywords && typeof exifKeywords === "string") setKeywords(exifKeywords);
          }
        } catch {
          // EXIF preview failed, leave fields empty
        } finally {
          setLoadingExif(false);
        }
      }
    },
    []
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []).filter((f) =>
      f.type.startsWith("image/")
    );
    if (selected.length === 0 && e.target.files?.length) {
      showToast("error", "Select images (JPEG, PNG, WebP or GIF).");
      return;
    }
    await processSelectedFiles(selected);
    e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const selected = Array.from(e.dataTransfer.files ?? []).filter((f) =>
      f.type.startsWith("image/")
    );
    if (selected.length === 0 && e.dataTransfer.files?.length) {
      showToast("error", "Select images (JPEG, PNG, WebP or GIF).");
      return;
    }
    await processSelectedFiles(selected);
  };

  const handleDelete = async (img: GalleryImage) => {
    if (!confirm(`Delete image "${img.title || "Untitled"}"?`)) return;

    setDeletingId(img.id);
    try {
      const res = await fetch("/api/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: img.id }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Delete failed");
      }

      showToast("success", "Image deleted.");
      fetchGallery();
    } catch (err) {
      showToast(
        "error",
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetHero = async (img: GalleryImage) => {
    setHeroId(img.id);
    try {
      const res = await fetch("/api/hero", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: img.id, isHero: !img.isHero }),
      });
      if (!res.ok) throw new Error(await res.json().then((d) => d.error));
      showToast("success", img.isHero ? "Hero removed." : "Set as hero.");
      fetchGallery();
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Error.");
    } finally {
      setHeroId(null);
    }
  };

  const categoryImages = images.filter(
    (img) => normalizeCategory(img.category) === normalizeCategory(category)
  );

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(categoryImages.map((img) => img.id)));
  };

  const deselectAll = () => setSelectedIds(new Set());

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleReorder = useCallback(
    async (newOrder: string[]) => {
      if (!category) return;
      setReordering(true);
      try {
        const res = await fetch("/api/reorder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ category, order: newOrder }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Reorder failed");
        showToast("success", "Redoslijed spremljen.");
        fetchGallery();
      } catch (err) {
        showToast("error", err instanceof Error ? err.message : "Greška pri spremanju.");
      } finally {
        setReordering(false);
      }
    },
    [category]
  );

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} image${selectedIds.size > 1 ? "s" : ""}?`)) return;

    setBulkDeleting(true);
    const ids = Array.from(selectedIds);
    let success = 0;
    let failed = 0;
    for (const id of ids) {
      try {
        const res = await fetch("/api/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
        const data = await res.json();
        if (res.ok) success++;
        else failed++;
      } catch {
        failed++;
      }
    }
    setBulkDeleting(false);
    setSelectedIds(new Set());
    fetchGallery();
    if (failed > 0) {
      showToast("error", `Deleted ${success}, failed ${failed}.`);
    } else {
      showToast("success", `Deleted ${success} image${success > 1 ? "s" : ""}.`);
    }
  };

  useEffect(() => {
    setSelectedIds(new Set());
  }, [category]);

  useEffect(() => {
    if (!editingId) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setEditingId(null);
      } else if (e.key === "Enter" && !e.shiftKey) {
        const target = e.target as HTMLElement;
        if (target.closest('[role="listbox"]') || target.getAttribute("aria-haspopup") === "listbox") return;
        e.preventDefault();
        editFormRef.current?.requestSubmit();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editingId]);

  const openEdit = (img: GalleryImage) => {
    setEditingId(img.id);
    let capturedAtLocal = "";
    if (img.capturedAt) {
      const d = new Date(img.capturedAt);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const h = String(d.getHours()).padStart(2, "0");
      const min = String(d.getMinutes()).padStart(2, "0");
      capturedAtLocal = `${y}-${m}-${day}T${h}:${min}`;
    }
    setEditForm({
      title: img.title || "",
      category: img.category || "",
      capturedAt: capturedAtLocal,
      venue: img.venue || "",
      sport: img.sport || "",
      foodDrink: (img as { foodDrink?: string }).foodDrink || "",
      keywords: img.keywords || "",
      slug: img.slug || "",
      camera: img.camera || "",
      lens: img.lens || "",
      exposure: img.exposure || "",
      aperture: img.aperture || "",
      iso: img.iso != null ? String(img.iso) : "",
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setUpdatingId(editingId);
    try {
      const res = await fetch("/api/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          title: editForm.title,
          category: editForm.category,
          capturedAt: editForm.capturedAt || undefined,
          camera: editForm.camera || undefined,
          lens: editForm.lens || undefined,
          exposure: editForm.exposure || undefined,
          aperture: editForm.aperture || undefined,
          iso: editForm.iso ? parseInt(editForm.iso, 10) : undefined,
          venue: editForm.venue || undefined,
          sport: editForm.sport || undefined,
          foodDrink: editForm.foodDrink || undefined,
          keywords: editForm.keywords || undefined,
          slug: editForm.slug.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      showToast("success", "Description updated.");
      setEditingId(null);
      fetchGallery();
    } catch (err) {
      showToast(
        "error",
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="flex min-h-screen bg-zinc-950">
      {/* Sidebar - WordPress style */}
      <aside className="fixed left-0 top-0 z-40 flex h-screen w-56 flex-col border-r border-zinc-800 bg-zinc-900">
        <div className="flex flex-col gap-4 border-b border-zinc-800 px-4 py-4">
          <Link href="/" className="flex items-center" aria-label="Drusany">
            <DrusanyLogo className="h-8 w-auto" fill="#e4e4e7" />
          </Link>
          <div className="flex flex-col gap-1">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Admin</p>
            <Link href="/" className="flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-zinc-100">
              <ArrowLeft className="h-4 w-4" />
              Back to site
            </Link>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-0.5 px-3">
            <button
              type="button"
              onClick={() => setAdminTab("dashboard")}
              className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                adminTab === "dashboard"
                  ? "border-l-2 border-amber-500/80 bg-zinc-800 text-white"
                  : "border-l-2 border-transparent text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-200"
              }`}
            >
              <LayoutDashboard className={`h-5 w-5 shrink-0 ${adminTab === "dashboard" ? "text-amber-400" : ""}`} />
              Dashboard
            </button>
            <div>
              <button
                type="button"
                onClick={() => {
                  setGalleryExpanded((e) => {
                    if (e) return false;
                    setPagesExpanded(false);
                    return true;
                  });
                  setAdminTab("gallery");
                }}
                className={`flex w-full items-center justify-between gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                  adminTab === "gallery"
                    ? "border-l-2 border-emerald-500/80 bg-zinc-800 text-white"
                    : "border-l-2 border-transparent text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-200"
                }`}
              >
                <span className="flex items-center gap-3">
                  <ImageIcon className={`h-5 w-5 shrink-0 ${adminTab === "gallery" ? "text-emerald-400" : ""}`} />
                  Gallery
                </span>
                {galleryExpanded ? (
                  <ChevronDown className="h-4 w-4 shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0" />
                )}
              </button>
              <div
                className={`grid overflow-hidden transition-[grid-template-rows] duration-200 ease-out ${
                  galleryExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
              >
                <div className="min-h-0">
                  <div className="ml-6 mt-0.5 space-y-0.5 border-l border-zinc-700 pl-2">
                    {CATEGORIES.map((cat) => {
                      const Icon = cat.icon;
                      const isActive = adminTab === "gallery" && normalizeCategory(category) === cat.slug;
                      return (
                        <button
                          key={cat.slug}
                          type="button"
                          onClick={() => {
                            setCategory(cat.slug);
                            setAdminTab("gallery");
                          }}
                          className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors ${
                            isActive
                              ? "text-white"
                              : "text-zinc-400 hover:text-zinc-200"
                          }`}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          {cat.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
            <div>
              <button
                type="button"
                onClick={() => {
                  setPagesExpanded((e) => {
                    if (e) return false;
                    setGalleryExpanded(false);
                    return true;
                  });
                }}
                className={`flex w-full items-center justify-between gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                  adminTab === "about" || adminTab === "contact"
                    ? "border-l-2 border-blue-500/80 bg-zinc-800 text-white"
                    : "border-l-2 border-transparent text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-200"
                }`}
              >
                <span className="flex items-center gap-3">
                  <FileText className={`h-5 w-5 shrink-0 ${adminTab === "about" || adminTab === "contact" ? "text-blue-400" : ""}`} />
                  Pages
                </span>
                {pagesExpanded ? (
                  <ChevronDown className="h-4 w-4 shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0" />
                )}
              </button>
              <div
                className={`grid overflow-hidden transition-[grid-template-rows] duration-200 ease-out ${
                  pagesExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
              >
                <div className="min-h-0">
                  <div className="ml-6 mt-0.5 space-y-0.5 border-l border-zinc-700 pl-2">
                    <button
                      type="button"
                      onClick={() => setAdminTab("about")}
                      className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors ${
                        adminTab === "about"
                          ? "text-white"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      About
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdminTab("contact")}
                      className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors ${
                        adminTab === "contact"
                          ? "text-white"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      Contact
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAdminTab("blog")}
              className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                adminTab === "blog"
                  ? "border-l-2 border-violet-500/80 bg-zinc-800 text-white"
                  : "border-l-2 border-transparent text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-200"
              }`}
            >
              <BookOpen className={`h-5 w-5 shrink-0 ${adminTab === "blog" ? "text-violet-400" : ""}`} />
              Blog
            </button>
          </nav>
        </div>
        <div className="border-t border-zinc-800 px-4 py-3">
          <p className="text-xs text-zinc-500">Local dev only</p>
        </div>
      </aside>

      {/* Main content - full width */}
      <main className="ml-56 min-h-screen flex-1">
        <div className="px-8 py-8 lg:px-12 lg:py-10">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
              {adminTab === "dashboard" && "Dashboard"}
              {adminTab === "gallery" && (category ? (CATEGORIES.find((c) => c.slug === normalizeCategory(category))?.label ?? category) : "Gallery")}
              {adminTab === "about" && "About"}
              {adminTab === "contact" && "Contact"}
              {adminTab === "blog" && "Blog"}
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              {adminTab === "dashboard" && "Overview of your content and statistics"}
              {adminTab === "gallery" && (category ? `Manage images in ${CATEGORIES.find((c) => c.slug === normalizeCategory(category))?.label ?? category}` : "Select a category from the sidebar")}
              {adminTab === "about" && "Edit About page content"}
              {adminTab === "contact" && "Edit Contact page content"}
              {adminTab === "blog" && "Create and manage blog posts"}
            </p>
          </div>

        {adminTab === "dashboard" && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8">
            <AdminDashboard />
          </div>
        )}

        {(adminTab === "about" || adminTab === "contact") && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8">
            <AdminPages page={adminTab} />
          </div>
        )}

        {adminTab === "blog" && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8">
            <AdminBlog />
          </div>
        )}

        {adminTab === "gallery" && (
        <>
        {/* Upload Form */}
        <form
          onSubmit={handleSubmit}
          className="mb-16 rounded-xl border border-zinc-800 bg-zinc-900/50 p-8"
        >
          <h2 className="mb-6 text-lg font-semibold text-zinc-200">
            New image{files.length > 1 ? "s" : ""}
            {category && (
              <span className="ml-2 text-sm font-normal text-zinc-500">
                → {CATEGORIES.find((c) => c.slug === normalizeCategory(category))?.label ?? category}
              </span>
            )}
          </h2>

          {!category && (
            <p className="mb-6 rounded-lg bg-zinc-800/80 py-4 text-center text-sm text-zinc-500">
              Select a category from the sidebar to add images.
            </p>
          )}

          {/* File input + preview */}
          <div className={`mb-6 ${!category ? "pointer-events-none opacity-50" : ""}`}>
            <label className="mb-3 block text-sm text-zinc-400">
              Image{files.length > 1 ? `s (${files.length})` : ""}
            </label>
            <div className="flex flex-wrap gap-3">
              <label
                className={`relative flex h-40 min-w-[10rem] flex-1 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
                  dragActive
                    ? "border-zinc-500 bg-zinc-800"
                    : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600 hover:bg-zinc-800"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
                {previewUrls.length > 0 ? (
                  <>
                    <div
                      className={`flex h-full w-full overflow-auto rounded p-1 ${
                        previewUrls.length === 1
                          ? "items-center justify-center"
                          : "flex-wrap gap-1"
                      }`}
                    >
                      {previewUrls.length === 1 ? (
                        <img
                          src={previewUrls[0]}
                          alt="Preview"
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <>
                          {previewUrls.slice(0, 6).map((url, i) => (
                            <img
                              key={i}
                              src={url}
                              alt={`Preview ${i + 1}`}
                              className="h-full max-h-36 min-w-0 flex-1 object-cover rounded"
                            />
                          ))}
                          {previewUrls.length > 6 && (
                            <div className="flex h-full min-w-[4rem] flex-1 items-center justify-center rounded bg-zinc-800 text-sm text-zinc-500">
                              +{previewUrls.length - 6}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    {loadingExif && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-zinc-900/80">
                        <span className="flex items-center gap-2 text-sm text-zinc-300">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Reading EXIF...
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <Upload className="mb-2 h-10 w-10 text-zinc-500" />
                    <span className="text-sm text-zinc-500">
                      Click or drag images
                    </span>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* Metadata fields */}
          <div className={!category ? "pointer-events-none opacity-50" : ""}>
            <div>
              <label
                htmlFor="title"
                className="mb-2 block text-sm text-zinc-400"
              >
                Title
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={files.length > 1 ? "Optional – leave empty to use EXIF per image" : "Image title"}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-zinc-100 placeholder-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              />
            </div>

            {normalizeCategory(category) === "concerts" && (
              <div className="mt-6">
                <label
                  htmlFor="venue"
                  className="mb-2 block text-sm text-zinc-400"
                >
                  Venue
                </label>
                <VenueSelect
                  id="venue"
                  value={venue}
                  onChange={setVenue}
                  placeholder="Select venue"
                />
              </div>
            )}

            {normalizeCategory(category) === "sport" && (
              <div className="mt-6">
                <label
                  htmlFor="sport"
                  className="mb-2 block text-sm text-zinc-400"
                >
                  Vrsta sporta
                </label>
                <SportSelect
                  id="sport"
                  value={sport}
                  onChange={setSport}
                  placeholder="Select sport"
                />
              </div>
            )}

            {normalizeCategory(category) === "food-drink" && (
              <div className="mt-6">
                <label
                  htmlFor="foodDrink"
                  className="mb-2 block text-sm text-zinc-400"
                >
                  Food ili Drink
                </label>
                <FoodDrinkSelect
                  id="foodDrink"
                  value={foodDrink}
                  onChange={setFoodDrink}
                  placeholder="Select type"
                />
              </div>
            )}

            <div className="mt-6">
              <label
                htmlFor="capturedAt"
                className="mb-2 block text-sm text-zinc-400"
              >
                Capture date
              </label>
              <DateTimePicker
                id="capturedAt"
                value={capturedAt}
                onChange={setCapturedAt}
              />
            </div>

            <div className="mt-6">
              <label htmlFor="keywords" className="mb-2 block text-sm text-zinc-400">
                Keywords
              </label>
              <input
                id="keywords"
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="From EXIF (IPTC/XMP)"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-zinc-100 placeholder-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              />
            </div>
            <div className="mt-6 flex items-center gap-3">
              <input
                id="isHero"
                type="checkbox"
                checked={isHero}
                onChange={(e) => setIsHero(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-zinc-100 focus:ring-zinc-500"
              />
              <label htmlFor="isHero" className="text-sm text-zinc-400">
                Hero image for this category (shown on homepage)
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || files.length === 0 || !category}
            className="mt-8 flex items-center gap-2 rounded-lg bg-zinc-100 px-6 py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {uploadProgress
                  ? `Uploading ${uploadProgress.current}/${uploadProgress.total}...`
                  : "Uploading..."}
              </>
            ) : (
              <>
                <ImageIcon className="h-4 w-4" />
                {files.length > 1 ? `Add ${files.length} to gallery` : "Add to gallery"}
              </>
            )}
          </button>
        </form>

        {/* Gallery list – only for selected category */}
        <section>
          {!category ? (
            <p className="rounded-xl border border-zinc-800 bg-zinc-900/30 py-12 text-center text-zinc-500">
              Select a category from the sidebar to view and manage its gallery.
            </p>
          ) : loadingGallery ? (
            <div className="flex items-center gap-2 text-zinc-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading...</span>
            </div>
          ) : (
            <>
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-lg font-semibold text-zinc-200">
                  {CATEGORIES.find((c) => c.slug === normalizeCategory(category))?.label ?? category}{" "}
                  ({categoryImages.length})
                </h2>
                {categoryImages.length > 0 && (
                  <div className="flex items-center gap-3">
                    {selectedIds.size > 0 ? (
                      <>
                        <button
                          type="button"
                          onClick={selectAll}
                          className="text-sm text-zinc-500 hover:text-zinc-300"
                        >
                          Select all
                        </button>
                        <button
                          type="button"
                          onClick={deselectAll}
                          className="text-sm text-zinc-500 hover:text-zinc-300"
                        >
                          Deselect all
                        </button>
                        <span className="text-sm text-zinc-500">
                          {selectedIds.size} selected
                        </span>
                        <button
                          type="button"
                          onClick={handleBulkDelete}
                          disabled={bulkDeleting}
                          className="flex items-center gap-2 rounded-lg bg-red-600/80 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50"
                        >
                          {bulkDeleting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          Delete selected
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={selectAll}
                        className="text-sm text-zinc-500 hover:text-zinc-300"
                      >
                        Select all
                      </button>
                    )}
                  </div>
                )}
              </div>

              {categoryImages.length === 0 ? (
                <p className="rounded-xl border border-zinc-800 bg-zinc-900/30 py-12 text-center text-zinc-500">
                  No images in this category. Add the first one using the form above.
                </p>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(event) => {
                    const { active, over } = event;
                    if (over && active.id !== over.id) {
                      const oldIndex = categoryImages.findIndex((img) => img.id === active.id);
                      const newIndex = categoryImages.findIndex((img) => img.id === over.id);
                      if (oldIndex >= 0 && newIndex >= 0) {
                        const newOrder = arrayMove(
                          categoryImages.map((i) => i.id),
                          oldIndex,
                          newIndex
                        );
                        handleReorder(newOrder);
                      }
                    }
                  }}
                >
                  <SortableContext
                    items={categoryImages.map((i) => i.id)}
                    strategy={rectSortingStrategy}
                  >
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                      {categoryImages.map((img) => (
                        <SortableImageCard
                          key={img.id}
                          img={img}
                          selectedIds={selectedIds}
                          toggleSelect={toggleSelect}
                          openEdit={openEdit}
                          handleSetHero={handleSetHero}
                          handleDelete={handleDelete}
                          deletingId={deletingId}
                          heroId={heroId}
                          reordering={reordering}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </>
          )}
        </section>

        {/* Duplicate resolution modal */}
        {duplicateModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/90 p-4"
            onClick={() => handleDuplicateChoice("cancel")}
          >
            <div
              className="w-full max-w-2xl rounded-xl border border-zinc-700 bg-zinc-900 p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="mb-4 text-lg font-semibold text-zinc-200">
                Duplicate: &quot;{duplicateModal.filename}&quot; already exists
              </h3>
              <p className="mb-4 text-sm text-zinc-500">
                Choose how to proceed:
              </p>
              <div className="mb-6 flex gap-4">
                <div className="flex flex-1 flex-col items-center">
                  <p className="mb-2 text-xs font-medium text-zinc-500">New (uploading)</p>
                  <img
                    src={duplicateModal.filePreviewUrl}
                    alt="New"
                    className="h-40 w-full rounded-lg object-contain bg-zinc-800"
                  />
                  <p className="mt-1.5 text-xs text-zinc-600">
                    {duplicateModal.file.size >= 1024 * 1024
                      ? `${(duplicateModal.file.size / 1024 / 1024).toFixed(1)} MB`
                      : `${(duplicateModal.file.size / 1024).toFixed(1)} KB`}
                  </p>
                </div>
                <div className="flex flex-1 flex-col items-center">
                  <p className="mb-2 text-xs font-medium text-zinc-500">Existing in gallery</p>
                  <img
                    src={duplicateModal.existingThumb || duplicateModal.existingSrc}
                    alt="Existing"
                    className="h-40 w-full rounded-lg object-contain bg-zinc-800"
                  />
                  <p className="mt-1.5 text-xs text-zinc-600">
                    {duplicateModal.existingSize != null
                      ? duplicateModal.existingSize >= 1024 * 1024
                        ? `${(duplicateModal.existingSize / 1024 / 1024).toFixed(1)} MB`
                        : `${(duplicateModal.existingSize / 1024).toFixed(1)} KB`
                      : "—"}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => handleDuplicateChoice("overwrite")}
                  className="rounded-lg bg-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-600"
                >
                  Overwrite
                </button>
                <button
                  type="button"
                  onClick={() => handleDuplicateChoice("add")}
                  className="rounded-lg bg-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-600"
                >
                  Add as _2
                </button>
                <button
                  type="button"
                  onClick={() => handleDuplicateChoice("cancel")}
                  className="rounded-lg border border-zinc-600 bg-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700"
                >
                  Cancel (skip)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit modal */}
        {editingId && (
          <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 p-4"
            onClick={() => setEditingId(null)}
          >
            <div
              className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-zinc-200">Edit description</h3>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form ref={editFormRef} onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm text-zinc-400">
                    Title / Description
                  </label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => {
                      const v = e.target.value;
                      setEditForm((f) => ({
                        ...f,
                        title: v,
                        slug: generateSlug(v, f.venue, f.capturedAt),
                      }));
                    }}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-zinc-100 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                    placeholder="Depeche Mode, Arena Zagreb..."
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-zinc-400">
                    Category
                  </label>
                  <CategorySelect
                    value={editForm.category}
                    onChange={(v) =>
                      setEditForm((f) => ({ ...f, category: v }))
                    }
                    placeholder="Select category"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-zinc-400">
                    Capture date
                  </label>
                  <DateTimePicker
                    value={editForm.capturedAt}
                    onChange={(v) =>
                      setEditForm((f) => ({
                        ...f,
                        capturedAt: v,
                        slug: generateSlug(f.title, f.venue, v),
                      }))
                    }
                  />
                </div>
                {normalizeCategory(editForm.category) === "concerts" && (
                  <div>
                    <label className="mb-1 block text-sm text-zinc-400">
                      Venue
                    </label>
                    <VenueSelect
                      value={editForm.venue}
                      onChange={(v) =>
                        setEditForm((f) => ({
                          ...f,
                          venue: v,
                          slug: generateSlug(f.title, v, f.capturedAt),
                        }))
                      }
                      placeholder="Select venue"
                    />
                  </div>
                )}
                {normalizeCategory(editForm.category) === "sport" && (
                  <div>
                    <label className="mb-1 block text-sm text-zinc-400">
                      Vrsta sporta
                    </label>
                    <SportSelect
                      value={editForm.sport}
                      onChange={(v) =>
                        setEditForm((f) => ({ ...f, sport: v }))
                      }
                      placeholder="Select sport"
                    />
                  </div>
                )}
                {normalizeCategory(editForm.category) === "food-drink" && (
                  <div>
                    <label className="mb-1 block text-sm text-zinc-400">
                      Food ili Drink
                    </label>
                    <FoodDrinkSelect
                      value={editForm.foodDrink}
                      onChange={(v) =>
                        setEditForm((f) => ({ ...f, foodDrink: v }))
                      }
                      placeholder="Select type"
                    />
                  </div>
                )}
                <div>
                  <label className="mb-1 block text-sm text-zinc-400">
                    Keywords
                  </label>
                  <input
                    type="text"
                    value={editForm.keywords}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, keywords: e.target.value }))
                    }
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-zinc-100 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                    placeholder="concert, live, arena"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-zinc-400">
                    Slug (za direktne linkove)
                  </label>
                  <input
                    type="text"
                    value={editForm.slug}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, slug: e.target.value }))
                    }
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-zinc-100 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                    placeholder="depeche-mode-arena-zagreb-2013"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-sm text-zinc-400">
                      Camera
                    </label>
                    <input
                      type="text"
                      value={editForm.camera}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, camera: e.target.value }))
                      }
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-zinc-100 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                      placeholder="Canon EOS 5D"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-zinc-400">
                      Lens
                    </label>
                    <input
                      type="text"
                      value={editForm.lens}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, lens: e.target.value }))
                      }
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-zinc-100 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                      placeholder="EF 24-70mm f/2.8"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-zinc-400">
                      Exposure
                    </label>
                    <input
                      type="text"
                      value={editForm.exposure}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, exposure: e.target.value }))
                      }
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-zinc-100 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                      placeholder="1/500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-zinc-400">
                      Aperture
                    </label>
                    <input
                      type="text"
                      value={editForm.aperture}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, aperture: e.target.value }))
                      }
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-zinc-100 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                      placeholder="f/2.8"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-zinc-400">
                      ISO
                    </label>
                    <input
                      type="text"
                      value={editForm.iso}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, iso: e.target.value }))
                      }
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-zinc-100 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                      placeholder="400"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={updatingId === editingId}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-zinc-100 px-4 py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-200 disabled:opacity-50"
                  >
                    {updatingId === editingId ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        Save
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="rounded-lg border border-zinc-600 px-4 py-2.5 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        </>
        )}

        {/* Toast */}
        {toast && (
          <div
            className={`fixed bottom-6 right-6 flex items-center gap-2 rounded-lg px-4 py-3 shadow-lg ${
              toast.type === "success"
                ? "bg-emerald-600 text-white"
                : "bg-red-600 text-white"
            }`}
          >
            {toast.type === "success" ? (
              <Check className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        )}
        </div>
      </main>
    </div>
  );
}
