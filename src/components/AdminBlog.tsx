"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  AlertCircle,
  Upload,
  Image as ImageIcon,
  GripVertical,
  Square,
  CheckSquare,
  Star,
} from "lucide-react";
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
import BlockNoteEditor from "./BlockNoteEditorDynamic";
import DatePicker from "./DatePicker";
import BlogCategorySelect from "./BlogCategorySelect";
import {
  getBlogCategoryLabel,
  getDisplayCategories,
  getShortCategoryLabel,
  getPostCategories,
  formatBlogDate,
} from "@/data/blogCategories";
import { THUMBNAIL_FOCUS_OPTIONS } from "@/data/thumbnailFocus";
import { generateBlogSlug } from "@/lib/slug";
import type { BlogPost } from "@/lib/blog";

function SortableGalleryItem({
  url,
  selected,
  onToggleSelect,
  onRemove,
}: {
  url: string;
  selected: boolean;
  onToggleSelect: () => void;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: url });

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
        selected ? "border-zinc-500 ring-2 ring-zinc-500/50" : "border-zinc-800"
      }`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="absolute left-2 top-2 z-10 flex cursor-grab items-center justify-center rounded p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800/80 hover:text-zinc-300 active:cursor-grabbing"
        aria-label="Povuci za promjenu redoslijeda"
      >
        <GripVertical className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onToggleSelect(); }}
        className="absolute right-2 top-2 z-10 rounded p-1.5 transition-colors hover:bg-zinc-800/80"
        aria-label={selected ? "Odznači" : "Označi"}
      >
        {selected ? (
          <CheckSquare className="h-5 w-5 text-zinc-100" />
        ) : (
          <Square className="h-5 w-5 text-zinc-400" />
        )}
      </button>
      <img
        src={url}
        alt=""
        className="h-32 w-44 object-cover"
      />
      <div className="absolute inset-0 flex items-center justify-center gap-2 bg-zinc-900/80 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="rounded-full bg-zinc-700 p-2 text-zinc-400 transition-colors hover:bg-red-600/80 hover:text-white"
          aria-label="Obriši sliku"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function AdminBlog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    title: "",
    slug: "",
    date: new Date().toISOString().slice(0, 10),
    time: "",
    categories: [] as string[],
    thumbnail: "",
    thumbnailFocus: "50% 50%",
    gallery: [] as string[],
    galleryMetadata: {} as Record<string, { title?: string; description?: string }>,
    featured: false,
    body: "",
  });
  const [bulkTitle, setBulkTitle] = useState("");
  const [bulkDescription, setBulkDescription] = useState("");
  const [uploadingFeatured, setUploadingFeatured] = useState(false);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviewUrls, setGalleryPreviewUrls] = useState<string[]>([]);
  const [galleryDragActive, setGalleryDragActive] = useState(false);
  const [galleryUploadProgress, setGalleryUploadProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [duplicateModal, setDuplicateModal] = useState<{
    file: File;
    filePreviewUrl: string;
    existingSrc: string;
    filename: string;
    existingSize: number | null;
  } | null>(null);
  const duplicateResolveRef = useRef<((action: "overwrite" | "add" | "cancel") => void) | null>(null);
  const [selectedGalleryUrls, setSelectedGalleryUrls] = useState<Set<string>>(new Set());
  const featuredInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const fetchBlog = useCallback(async () => {
    try {
      const res = await fetch("/api/blog");
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts ?? []);
      }
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBlog();
  }, [fetchBlog]);

  useEffect(() => {
    if (galleryFiles.length === 0) {
      setGalleryPreviewUrls([]);
      return;
    }
    const urls = galleryFiles.map((f) => URL.createObjectURL(f));
    setGalleryPreviewUrls(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [galleryFiles]);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchPostWithBody = useCallback(async (slug: string) => {
    const res = await fetch(`/api/blog?slug=${encodeURIComponent(slug)}`);
    if (!res.ok) return null;
    return res.json();
  }, []);

  const openEdit = async (post: BlogPost) => {
    setEditingId(post.id);
    setEditLoading(true);
    setSelectedGalleryUrls(new Set());
    try {
      const full = await fetchPostWithBody(post.slug);
      setForm({
        title: post.title,
        slug: post.slug,
        date: post.date,
        time: post.time ?? "",
        categories: getPostCategories(post),
        thumbnail: post.thumbnail ?? "",
        thumbnailFocus: post.thumbnailFocus ?? "50% 50%",
        gallery: post.gallery ?? [],
        galleryMetadata: post.galleryMetadata ?? {},
        featured: post.featured ?? false,
        body: full?.body ?? "",
      });
    } finally {
      setEditLoading(false);
    }
  };

  const openCreate = () => {
    setCreating(true);
    setForm({
      title: "",
      slug: "",
      date: new Date().toISOString().slice(0, 10),
      time: "",
      categories: [],
      thumbnail: "",
      thumbnailFocus: "50% 50%",
      gallery: [],
      galleryMetadata: {},
      featured: false,
      body: "",
    });
  };

  const closeForm = () => {
    setEditingId(null);
    setCreating(false);
    setSelectedGalleryUrls(new Set());
  };

  const uploadFeatured = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !form.slug.trim() || !form.date.trim()) {
      if (!form.slug.trim()) showToast("error", "Unesi naslov i spremi članak prije uploada.");
      else if (!form.date.trim()) showToast("error", "Unesi datum prije uploada.");
      e.target.value = "";
      return;
    }
    setUploadingFeatured(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("slug", form.slug);
      fd.append("date", form.date);
      fd.append("type", "featured");
      const res = await fetch("/api/blog-upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload nije uspio");
      setForm((f) => ({ ...f, thumbnail: data.url }));
      showToast("success", "Istaknuta slika uploadana.");
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Upload nije uspio.");
    } finally {
      setUploadingFeatured(false);
      e.target.value = "";
    }
  };

  const handleGalleryFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []).filter((f) =>
      f.type.startsWith("image/")
    );
    if (selected.length === 0 && e.target.files?.length) {
      showToast("error", "Odaberi slike (JPEG, PNG, WebP ili GIF).");
      return;
    }
    setGalleryFiles(selected);
    e.target.value = "";
  };

  const handleGalleryDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setGalleryDragActive(true);
  };

  const handleGalleryDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setGalleryDragActive(false);
  };

  const handleGalleryDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setGalleryDragActive(false);
    const selected = Array.from(e.dataTransfer.files ?? []).filter((f) =>
      f.type.startsWith("image/")
    );
    if (selected.length === 0 && e.dataTransfer.files?.length) {
      showToast("error", "Odaberi slike (JPEG, PNG, WebP ili GIF).");
      return;
    }
    setGalleryFiles(selected);
  };

  const uploadGallerySingle = async (
    file: File,
    opts: { overwrite?: boolean; addWithSuffix?: boolean; index?: number } = {}
  ): Promise<{ ok: boolean; duplicate?: boolean; data?: unknown }> => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("originalFilename", file.name || "");
    fd.append("slug", form.slug);
    fd.append("date", form.date);
    fd.append("type", "gallery");
    if (opts.index != null) fd.append("index", String(opts.index));
    if (opts.overwrite) fd.append("overwrite", "true");
    if (opts.addWithSuffix) fd.append("addWithSuffix", "true");
    const res = await fetch("/api/blog-upload", { method: "POST", body: fd });
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

  const uploadGalleryBatch = async () => {
    if (
      galleryFiles.length === 0 ||
      !form.slug.trim() ||
      !form.date.trim()
    ) {
      if (!form.slug.trim()) showToast("error", "Unesi naslov i spremi članak prije uploada.");
      else if (!form.date.trim()) showToast("error", "Unesi datum prije uploada.");
      return;
    }
    setGalleryUploadProgress({ current: 0, total: galleryFiles.length });
    const newUrls: string[] = [];
    try {
      for (let i = 0; i < galleryFiles.length; i++) {
        setGalleryUploadProgress({ current: i + 1, total: galleryFiles.length });
        const file = galleryFiles[i];
        let result = await uploadGallerySingle(file, { index: i });

        if (result.duplicate && result.data) {
          const d = result.data as { existingSrc?: string; filename?: string; existingSize?: number };
          const filePreviewUrl = URL.createObjectURL(file);
          const choice = await new Promise<"overwrite" | "add" | "cancel">((resolve) => {
            duplicateResolveRef.current = resolve;
            setDuplicateModal({
              file,
              filePreviewUrl,
              existingSrc: d.existingSrc || "",
              filename: d.filename || "",
              existingSize: d.existingSize ?? null,
            });
          });
          URL.revokeObjectURL(filePreviewUrl);

          if (choice === "overwrite") {
            result = await uploadGallerySingle(file, { overwrite: true, index: i });
          } else if (choice === "add") {
            result = await uploadGallerySingle(file, { addWithSuffix: true, index: i });
          }
        }

        if (result.ok && result.data) {
          newUrls.push((result.data as { url: string }).url);
        } else if (!result.duplicate) {
          const err = (result.data as { error?: string })?.error || "Upload nije uspio";
          showToast("error", err);
        }
      }
      if (newUrls.length > 0) {
        setForm((f) => ({ ...f, gallery: [...f.gallery, ...newUrls] }));
        showToast(
          "success",
          newUrls.length === 1
            ? "Slika dodana u galeriju."
            : `${newUrls.length} slika dodano u galeriju.`
        );
      }
      setGalleryFiles([]);
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Upload nije uspio.");
    } finally {
      setGalleryUploadProgress(null);
    }
  };

  const deleteBlogGalleryFile = async (url: string) => {
    try {
      await fetch("/api/blog-delete-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
    } catch {
      // Ignoriraj – datoteka možda već ne postoji
    }
  };

  const removeGalleryImage = (url: string) => {
    deleteBlogGalleryFile(url);
    setForm((f) => {
      const nextMeta = { ...f.galleryMetadata };
      delete nextMeta[url];
      return {
        ...f,
        gallery: f.gallery.filter((u) => u !== url),
        galleryMetadata: nextMeta,
      };
    });
    setSelectedGalleryUrls((s) => {
      const next = new Set(s);
      next.delete(url);
      return next;
    });
  };

  const toggleGallerySelect = (url: string) => {
    setSelectedGalleryUrls((s) => {
      const next = new Set(s);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  };

  // Pri selekciji slike u galeriji, prikaži njen title/description u poljima
  useEffect(() => {
    if (selectedGalleryUrls.size === 0) {
      setBulkTitle("");
      setBulkDescription("");
      return;
    }
    const firstUrl = form.gallery.find((g) => selectedGalleryUrls.has(g));
    if (firstUrl) {
      const meta = form.galleryMetadata[firstUrl];
      setBulkTitle(meta?.title ?? "");
      setBulkDescription(meta?.description ?? "");
    }
  }, [selectedGalleryUrls, form.gallery, form.galleryMetadata]);

  const selectAllGallery = () => {
    setSelectedGalleryUrls(new Set(form.gallery));
  };

  const deselectAllGallery = () => setSelectedGalleryUrls(new Set());

  const handleBulkDeleteGallery = () => {
    if (selectedGalleryUrls.size === 0) return;
    if (!confirm(`Obrisati ${selectedGalleryUrls.size} slik${selectedGalleryUrls.size === 1 ? "u" : "a"}?`)) return;
    selectedGalleryUrls.forEach((url) => deleteBlogGalleryFile(url));
    setForm((f) => {
      const nextMeta = { ...f.galleryMetadata };
      selectedGalleryUrls.forEach((u) => delete nextMeta[u]);
      return {
        ...f,
        gallery: f.gallery.filter((u) => !selectedGalleryUrls.has(u)),
        galleryMetadata: nextMeta,
      };
    });
    setSelectedGalleryUrls(new Set());
    showToast("success", "Slike uklonjene iz galerije.");
  };

  const handleBulkApplyMetadata = () => {
    if (selectedGalleryUrls.size === 0) return;
    const title = bulkTitle.trim() || undefined;
    const description = bulkDescription.trim() || undefined;
    if (!title && !description) {
      showToast("error", "Unesi naslov ili opis.");
      return;
    }
    setForm((f) => {
      const nextMeta = { ...f.galleryMetadata };
      selectedGalleryUrls.forEach((url) => {
        nextMeta[url] = {
          ...(nextMeta[url] ?? {}),
          ...(title !== undefined && { title }),
          ...(description !== undefined && { description }),
        };
      });
      return { ...f, galleryMetadata: nextMeta };
    });
    setBulkTitle("");
    setBulkDescription("");
    showToast("success", `Primijenjeno na ${selectedGalleryUrls.size} slik${selectedGalleryUrls.size === 1 ? "u" : "a"}. Klikni Spremi da se sačuvaju.`);
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      const res = await fetch("/api/blog", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          ...form,
        }),
      });
      if (!res.ok) throw new Error("Failed to update");
      showToast("success", "Članak ažuriran.");
      closeForm();
      fetchBlog();
    } catch {
      showToast("error", "Ažuriranje nije uspjelo.");
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      const slug =
        form.slug.trim() || generateBlogSlug(form.title, form.date) || crypto.randomUUID().slice(0, 8);
      const res = await fetch("/api/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          slug: slug || crypto.randomUUID().slice(0, 8),
        }),
      });
      if (!res.ok) throw new Error("Failed to create");
      showToast("success", "Članak kreiran.");
      closeForm();
      fetchBlog();
    } catch {
      showToast("error", "Kreiranje nije uspjelo.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Obrisati ovaj članak?")) return;
    try {
      const res = await fetch(`/api/blog?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      showToast("success", "Članak obrisan.");
      closeForm();
      fetchBlog();
    } catch {
      showToast("error", "Brisanje nije uspjelo.");
    }
  };

  const canUpload = form.slug.trim().length > 0 && /^\d{4}-\d{2}-\d{2}$/.test(form.date);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  const isFormOpen = creating || editingId;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-200">Članci bloga</h2>
        {!isFormOpen && (
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-2 rounded-lg bg-zinc-700 px-4 py-2 text-sm font-medium text-zinc-100 transition-colors hover:bg-zinc-600"
          >
            <Plus className="h-4 w-4" />
            Novi članak
          </button>
        )}
      </div>

      {isFormOpen ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-zinc-200">
              {creating ? "Novi članak" : "Uredi članak"}
            </h3>
            <button
              type="button"
              onClick={closeForm}
              className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm text-zinc-400">Naslov</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => {
                  const v = e.target.value;
                  setForm((f) => ({
                    ...f,
                    title: v,
                    ...(creating ? { slug: generateBlogSlug(v, f.date) } : {}),
                  }));
                }}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-zinc-100 placeholder-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                placeholder="Naslov članka"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-zinc-400">Slug (URL)</label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-zinc-100 placeholder-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                placeholder="yymmdd-naslov (npr. 251228-advent-2025)"
              />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="mb-2 block text-sm text-zinc-400">Datum</label>
                <DatePicker
                  value={form.date}
                  onChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      date: v,
                      ...(creating ? { slug: generateBlogSlug(f.title, v) } : {}),
                    }))
                  }
                />
              </div>
              <div className="w-24">
                <label className="mb-2 block text-sm text-zinc-400">Vrijeme</label>
                <input
                  type="time"
                  value={form.time}
                  onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-zinc-100 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm text-zinc-400">Istaknuti post</label>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, featured: !f.featured }))}
                className={`rounded p-2 transition-colors ${
                  form.featured
                    ? "text-amber-400 hover:text-amber-300"
                    : "text-zinc-500 hover:text-zinc-400"
                }`}
                title={form.featured ? "Ukloni iz istaknutih" : "Dodaj u istaknute"}
                aria-label={form.featured ? "Ukloni iz istaknutih" : "Dodaj u istaknute"}
              >
                <Star
                  className={`h-5 w-5 ${form.featured ? "fill-amber-400" : ""}`}
                  strokeWidth={1.5}
                />
              </button>
              <span className="text-xs text-zinc-500">
                {form.featured ? "Prikazuje se u widgetu istaknutih" : "Dodaj u istaknute"}
              </span>
            </div>
            <div>
              <label className="mb-2 block text-sm text-zinc-400">Kategorije</label>
              <BlogCategorySelect
                value={form.categories}
                onChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    categories: Array.isArray(v) ? v : v ? [v] : [],
                  }))
                }
                placeholder="Odaberi kategorije"
                multiple
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-zinc-400">Istaknuta slika</label>
              <p className="mb-2 text-xs text-zinc-500">
                Unesi datum i naslov prije uploada. Slike idu u{" "}
                <code className="rounded bg-zinc-800 px-1">/uploads/blog/[datum]-[slug]/</code>
              </p>
              <div className="flex flex-wrap items-start gap-4">
                {form.thumbnail ? (
                  <div className="space-y-2">
                    <div className="relative">
                      <div
                        className="relative aspect-video w-full max-w-md cursor-crosshair overflow-hidden rounded-lg bg-zinc-800"
                        onClick={(e) => {
                          const target = e.currentTarget;
                          const rect = target.getBoundingClientRect();
                          const x = ((e.clientX - rect.left) / rect.width) * 100;
                          const y = ((e.clientY - rect.top) / rect.height) * 100;
                          const xPercent = Math.round(Math.max(0, Math.min(100, x)));
                          const yPercent = Math.round(Math.max(0, Math.min(100, y)));
                          setForm((f) => ({
                            ...f,
                            thumbnailFocus: `${xPercent}% ${yPercent}%`,
                          }));
                        }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            (e.target as HTMLElement).focus();
                          }
                        }}
                        title="Klikni na sliku da postaviš fokus točku"
                      >
                        <img
                          src={form.thumbnail}
                          alt=""
                          className="pointer-events-none h-full w-full object-cover"
                          style={{ objectPosition: form.thumbnailFocus }}
                          draggable={false}
                        />
                        {(() => {
                          const [x, y] = (form.thumbnailFocus || "50% 50%")
                            .split(" ")
                            .map((s) => parseFloat(s) || 50);
                          return (
                            <div
                              className="pointer-events-none absolute h-6 w-6 rounded-full border-2 border-amber-400 bg-amber-400/20 shadow-lg"
                              style={{
                                left: `${x}%`,
                                top: `${y}%`,
                                transform: "translate(-50%, -50%)",
                              }}
                            />
                          );
                        })()}
                      </div>
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, thumbnail: "" }))}
                        className="absolute right-2 top-2 z-10 rounded-full bg-zinc-800/90 p-2 text-zinc-400 backdrop-blur-sm transition-colors hover:bg-red-600/90 hover:text-white"
                        aria-label="Ukloni istaknutu sliku"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-xs text-zinc-500">
                      Klikni na sliku da postaviš fokus točku · ili odaberi iz mreže:
                    </p>
                    <div className="grid w-fit grid-cols-3 gap-0.5">
                      {THUMBNAIL_FOCUS_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() =>
                            setForm((f) => ({ ...f, thumbnailFocus: opt.value }))
                          }
                          title={opt.label}
                          className={`h-6 w-6 rounded border text-[10px] transition-colors ${
                            form.thumbnailFocus === opt.value
                              ? "border-amber-500 bg-amber-500/30 text-amber-400"
                              : "border-zinc-600 bg-zinc-800 text-zinc-500 hover:border-zinc-500 hover:bg-zinc-700"
                          }`}
                        >
                          •
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
                <div>
                  <input
                    ref={featuredInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={uploadFeatured}
                    disabled={!canUpload || uploadingFeatured}
                  />
                  <button
                    type="button"
                    onClick={() => featuredInputRef.current?.click()}
                    disabled={!canUpload || uploadingFeatured}
                    className="flex items-center gap-2 rounded-lg border border-dashed border-zinc-600 px-4 py-3 text-sm text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-300 disabled:opacity-50"
                  >
                    {uploadingFeatured ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    {form.thumbnail ? "Zamijeni" : "Upload istaknute slike"}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm text-zinc-400">Sadržaj</label>
              {editLoading ? (
                <div className="flex min-h-[300px] items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800/50">
                  <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
                </div>
              ) : (
                <BlockNoteEditor
                  key={editingId ?? "new"}
                  content={form.body}
                  onChange={(html) => setForm((f) => ({ ...f, body: html }))}
                  minHeight="300px"
                  uploadFile={
                  canUpload
                    ? async (file: File) => {
                        const fd = new FormData();
                        fd.append("file", file);
                        fd.append("slug", form.slug);
                        fd.append("date", form.date);
                        fd.append("type", "content");
                        const res = await fetch("/api/blog-upload", {
                          method: "POST",
                          body: fd,
                        });
                        const data = await res.json();
                        if (!res.ok)
                          throw new Error(data.error || "Upload nije uspio");
                        return {
                          props: { url: data.url, previewWidth: 512 },
                        };
                      }
                    : undefined
                }
              />
              )}
            </div>

            <div>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                <label className="text-sm text-zinc-400">
                  Galerija članka
                  {form.gallery.length > 0 && (
                    <span className="ml-2 text-zinc-500">({form.gallery.length})</span>
                  )}
                </label>
                {form.gallery.length > 0 && (
                  <div className="flex items-center gap-3">
                    {selectedGalleryUrls.size > 0 ? (
                      <>
                        <button
                          type="button"
                          onClick={selectAllGallery}
                          className="text-sm text-zinc-500 hover:text-zinc-300"
                        >
                          Odaberi sve
                        </button>
                        <button
                          type="button"
                          onClick={deselectAllGallery}
                          className="text-sm text-zinc-500 hover:text-zinc-300"
                        >
                          Odznači sve
                        </button>
                        <span className="text-sm text-zinc-500">
                          {selectedGalleryUrls.size} odabrano
                        </span>
                        <button
                          type="button"
                          onClick={handleBulkApplyMetadata}
                          disabled={!bulkTitle.trim() && !bulkDescription.trim()}
                          className="flex items-center gap-2 rounded-lg bg-zinc-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-500 disabled:opacity-50 disabled:hover:bg-zinc-600"
                        >
                          Primijeni na odabrano
                        </button>
                        <button
                          type="button"
                          onClick={handleBulkDeleteGallery}
                          className="flex items-center gap-2 rounded-lg bg-red-600/80 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                          Obriši odabrano
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={selectAllGallery}
                        className="text-sm text-zinc-500 hover:text-zinc-300"
                      >
                        Odaberi sve
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Bulk edit: naslov i opis za odabrane slike */}
              {selectedGalleryUrls.size > 0 && (
                <div className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-zinc-700 bg-zinc-800/50 p-3">
                  <div className="min-w-[12rem] flex-1">
                    <label className="mb-1 block text-xs text-zinc-500">Naslov (za odabrane)</label>
                    <input
                      type="text"
                      value={bulkTitle}
                      onChange={(e) => setBulkTitle(e.target.value)}
                      placeholder="npr. Advent u Zagrebu"
                      className="w-full rounded border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-zinc-500 focus:outline-none"
                    />
                  </div>
                  <div className="min-w-[12rem] flex-1">
                    <label className="mb-1 block text-xs text-zinc-500">Opis (za odabrane)</label>
                    <input
                      type="text"
                      value={bulkDescription}
                      onChange={(e) => setBulkDescription(e.target.value)}
                      placeholder="npr. Trg bana Jelačića, prosinac 2025."
                      className="w-full rounded border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-zinc-500 focus:outline-none"
                    />
                  </div>
                  <p className="w-full text-xs text-zinc-500">
                    Klikni <strong>Spremi</strong> (gore) da se promjene sačuvaju. Nakon toga pokreni{" "}
                    <code className="rounded bg-zinc-800 px-1">npm run build</code> da se promjene vide na stranici.
                  </p>
                </div>
              )}

              {/* Već uploadane slike – drag-and-drop sortiranje */}
              {form.gallery.length > 0 && (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(event) => {
                    const { active, over } = event;
                    if (over && active.id !== over.id) {
                      const oldIndex = form.gallery.indexOf(active.id as string);
                      const newIndex = form.gallery.indexOf(over.id as string);
                      if (oldIndex >= 0 && newIndex >= 0) {
                        const newOrder = arrayMove(form.gallery, oldIndex, newIndex);
                        setForm((f) => ({ ...f, gallery: newOrder }));
                      }
                    }
                  }}
                >
                  <SortableContext
                    items={form.gallery}
                    strategy={rectSortingStrategy}
                  >
                    <div className="mb-4 flex flex-wrap gap-2">
                      {form.gallery.map((url) => (
                        <SortableGalleryItem
                          key={url}
                          url={url}
                          selected={selectedGalleryUrls.has(url)}
                          onToggleSelect={() => toggleGallerySelect(url)}
                          onRemove={() => removeGalleryImage(url)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}

              {/* Drag-and-drop zona (kao portfolio) */}
              <div className={!canUpload ? "pointer-events-none opacity-50" : ""}>
                <label className="mb-3 block text-xs text-zinc-500">
                  {galleryFiles.length > 0
                    ? `Odabrano slika: ${galleryFiles.length}`
                    : "Nove slike"}
                </label>
                <div className="flex flex-wrap gap-3">
                  <label
                    className={`relative flex h-40 min-w-[10rem] flex-1 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
                      galleryDragActive
                        ? "border-zinc-500 bg-zinc-800"
                        : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600 hover:bg-zinc-800"
                    }`}
                    onDragOver={handleGalleryDragOver}
                    onDragLeave={handleGalleryDragLeave}
                    onDrop={handleGalleryDrop}
                  >
                    <input
                      ref={galleryInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      multiple
                      className="hidden"
                      onChange={handleGalleryFileChange}
                      disabled={!canUpload}
                    />
                    {galleryPreviewUrls.length > 0 ? (
                      <div
                        className={`flex h-full w-full overflow-auto rounded p-1 ${
                          galleryPreviewUrls.length === 1
                            ? "items-center justify-center"
                            : "flex-wrap gap-1"
                        }`}
                      >
                        {galleryPreviewUrls.length === 1 ? (
                          <img
                            src={galleryPreviewUrls[0]}
                            alt="Preview"
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <>
                            {galleryPreviewUrls.slice(0, 6).map((url, i) => (
                              <img
                                key={i}
                                src={url}
                                alt={`Preview ${i + 1}`}
                                className="h-full max-h-36 min-w-0 flex-1 rounded object-cover"
                              />
                            ))}
                            {galleryPreviewUrls.length > 6 && (
                              <div className="flex h-full min-w-[4rem] flex-1 items-center justify-center rounded bg-zinc-800 text-sm text-zinc-500">
                                +{galleryPreviewUrls.length - 6}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ) : (
                      <>
                        <Upload className="mb-2 h-10 w-10 text-zinc-500" />
                        <span className="text-sm text-zinc-500">
                          Klikni ili povuci slike
                        </span>
                      </>
                    )}
                  </label>
                </div>

                <button
                  type="button"
                  onClick={uploadGalleryBatch}
                  disabled={!canUpload || galleryFiles.length === 0 || !!galleryUploadProgress}
                  className="mt-4 flex items-center gap-2 rounded-lg bg-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-100 transition-colors hover:bg-zinc-600 disabled:opacity-50"
                >
                  {galleryUploadProgress ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Upload {galleryUploadProgress.current}/{galleryUploadProgress.total}...
                    </>
                  ) : galleryFiles.length > 1 ? (
                    <>
                      <ImageIcon className="h-4 w-4" />
                      Dodaj {galleryFiles.length} u galeriju
                    </>
                  ) : (
                    <>
                      <ImageIcon className="h-4 w-4" />
                      Dodaj u galeriju
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            {editingId && (
              <button
                type="button"
                onClick={() => handleDelete(editingId)}
                className="rounded-lg border border-red-800/60 px-4 py-2 text-sm text-red-400 transition-colors hover:bg-red-900/30"
              >
                Obriši
              </button>
            )}
            <button
              type="button"
              onClick={creating ? handleCreate : handleSaveEdit}
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-zinc-700 px-4 py-2 text-sm font-medium text-zinc-100 transition-colors hover:bg-zinc-600 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Spremanje...
                </>
              ) : creating ? (
                "Kreiraj članak"
              ) : (
                "Spremi"
              )}
            </button>
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        {posts.length === 0 ? (
          <p className="rounded-lg bg-zinc-800/50 py-8 text-center text-sm text-zinc-500">
            Još nema članaka. Klikni &quot;Novi članak&quot; za kreiranje.
          </p>
        ) : (
          [...posts]
            .sort((a, b) => {
              const da = a.date + (a.time || "00:00");
              const db = b.date + (b.time || "00:00");
              return db.localeCompare(da);
            })
            .map((post) => (
            <div
              key={post.id}
              className="flex items-center gap-4 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4"
            >
              <div className="h-14 w-20 shrink-0 overflow-hidden rounded-md bg-zinc-800">
                {post.thumbnail ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={post.thumbnail}
                    alt=""
                    className="h-full w-full object-cover"
                    style={{
                      objectPosition: post.thumbnailFocus || "50% 50%",
                    }}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-zinc-600">
                    <ImageIcon className="h-6 w-6" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-medium text-zinc-200">{post.title || "Bez naslova"}</h4>
                <p className="text-sm text-zinc-500">
                  /blog/{post.slug}
                  {getDisplayCategories(post).length > 0 && (
                    <>
                      {" · "}
                      {getDisplayCategories(post).map((slug) => (
                        <span
                          key={slug}
                          className="mr-1 rounded bg-zinc-700/80 px-1.5 py-0.5 text-xs"
                        >
                          {getShortCategoryLabel(slug)}
                        </span>
                      ))}
                    </>
                  )}
                  {" · "}
                  {formatBlogDate(post.date)}
                  {post.time ? ` · ${post.time}` : " · —"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    const next = !post.featured;
                    try {
                      const res = await fetch("/api/blog", {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id: post.id, featured: next }),
                      });
                      if (res.ok) {
                        setPosts((prev) =>
                          prev.map((p) =>
                            p.id === post.id ? { ...p, featured: next } : p
                          )
                        );
                        showToast("success", next ? "Dodano u istaknute" : "Uklonjeno iz istaknutih");
                      }
                    } catch {
                      showToast("error", "Promjena nije uspjela.");
                    }
                  }}
                  className={`rounded p-2 transition-colors ${
                    post.featured
                      ? "text-amber-400 hover:text-amber-300"
                      : "text-zinc-500 hover:text-zinc-400"
                  }`}
                  title={post.featured ? "Ukloni iz istaknutih" : "Dodaj u istaknute"}
                  aria-label={post.featured ? "Ukloni iz istaknutih" : "Dodaj u istaknute"}
                >
                  <Star
                    className={`h-4 w-4 ${post.featured ? "fill-amber-400" : ""}`}
                    strokeWidth={1.5}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => openEdit(post)}
                  className="rounded p-2 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
                  aria-label="Edit"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(post.id)}
                  className="rounded p-2 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-red-400"
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            ))
        )}
      </div>

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
              Duplikat: &quot;{duplicateModal.filename}&quot; već postoji u galeriji
            </h3>
            <p className="mb-4 text-sm text-zinc-500">
              Kako želiš nastaviti?
            </p>
            <div className="mb-6 flex gap-4">
              <div className="flex flex-1 flex-col items-center">
                <p className="mb-2 text-xs font-medium text-zinc-500">Nova (upload)</p>
                <img
                  src={duplicateModal.filePreviewUrl}
                  alt="Nova"
                  className="h-40 w-full rounded-lg object-contain bg-zinc-800"
                />
                <p className="mt-1.5 text-xs text-zinc-600">
                  {duplicateModal.file.size >= 1024 * 1024
                    ? `${(duplicateModal.file.size / 1024 / 1024).toFixed(1)} MB`
                    : `${(duplicateModal.file.size / 1024).toFixed(1)} KB`}
                </p>
              </div>
              <div className="flex flex-1 flex-col items-center">
                <p className="mb-2 text-xs font-medium text-zinc-500">Postojeća u galeriji</p>
                <img
                  src={duplicateModal.existingSrc}
                  alt="Postojeća"
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
                Prepiši
              </button>
              <button
                type="button"
                onClick={() => handleDuplicateChoice("add")}
                className="rounded-lg bg-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-600"
              >
                Dodaj kao _2
              </button>
              <button
                type="button"
                onClick={() => handleDuplicateChoice("cancel")}
                className="rounded-lg border border-zinc-600 bg-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700"
              >
                Odustani (preskoči)
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          className={`fixed bottom-6 right-6 flex items-center gap-2 rounded-lg px-4 py-3 shadow-lg ${
            toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
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
  );
}
