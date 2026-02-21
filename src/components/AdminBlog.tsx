"use client";

import { useState, useEffect, useCallback, useRef, useMemo, memo } from "react";
import { useRouter } from "next/navigation";
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
  ChevronLeft,
  ChevronRight,
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
import BlockNoteErrorBoundary from "./BlockNoteErrorBoundary";
import DatePicker from "./DatePicker";
import BlogCategorySelect from "./BlogCategorySelect";
import StatusSelect from "./StatusSelect";
import FilterSelect from "./FilterSelect";
import FilterMultiSelect from "./FilterMultiSelect";
import {
  getBlogCategoryLabel,
  getDisplayCategories,
  getShortCategoryLabel,
  getPostCategories,
  formatBlogDate,
  getBlogCategoryOptions,
  postHasCategory,
} from "@/data/blogCategories";
import { THUMBNAIL_FOCUS_OPTIONS } from "@/data/thumbnailFocus";
import { generateBlogSlug } from "@/lib/slug";
import type { BlogPost, BlogSeo } from "@/lib/blog";
import { Search } from "lucide-react";
import { useUnsavedChanges } from "@/contexts/UnsavedChangesContext";
import { ADMIN_UI } from "@/data/adminUI";

const META_DESCRIPTION_MAX = 160;

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
function formatMonthOption(yearMonth: string): string {
  const [y, m] = yearMonth.split("-").map(Number);
  if (!y || !m || m < 1 || m > 12) return yearMonth;
  return `${MONTHS[m - 1]} ${y}`;
}

function SortableGalleryItem({
  url,
  selected,
  isFeatured,
  onToggleSelect,
  onSetFeatured,
  onRemove,
}: {
  url: string;
  selected: boolean;
  isFeatured: boolean;
  onToggleSelect: () => void;
  onSetFeatured: () => void;
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
        isFeatured
          ? "border-amber-500/80 ring-2 ring-amber-500/30"
          : selected
            ? "border-zinc-500 ring-2 ring-zinc-500/50"
            : "border-zinc-800"
      }`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="absolute left-2 top-2 z-10 flex cursor-grab items-center justify-center rounded p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800/80 hover:text-zinc-300 active:cursor-grabbing"
        aria-label={ADMIN_UI.blog.dragReorder}
      >
        <GripVertical className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onToggleSelect(); }}
        className="absolute right-2 top-2 z-10 rounded p-1.5 transition-colors hover:bg-zinc-800/80"
        aria-label={selected ? ADMIN_UI.blog.deselect : ADMIN_UI.blog.select}
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
          onClick={(e) => { e.stopPropagation(); onSetFeatured(); }}
          className={`rounded-full p-2 transition-colors ${
            isFeatured ? "bg-amber-500/80 text-white" : "bg-zinc-700 text-zinc-400 hover:bg-amber-500/80 hover:text-white"
          }`}
          aria-label={isFeatured ? ADMIN_UI.blog.featuredImage : ADMIN_UI.blog.setFeatured}
        >
          <Star className={`h-4 w-4 ${isFeatured ? "fill-current" : ""}`} />
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="rounded-full bg-zinc-700 p-2 text-zinc-400 transition-colors hover:bg-red-600/80 hover:text-white"
          aria-label={ADMIN_UI.blog.removeImage}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

const MemoizedBlockNoteSection = memo(function MemoizedBlockNoteSection({
  content,
  onBodyChange,
  slug,
  date,
  canUpload,
  editorKey,
  onRetry,
}: {
  content: string;
  onBodyChange: (html: string) => void;
  slug: string;
  date: string;
  canUpload: boolean;
  editorKey: string;
  onRetry: () => void;
}) {
  const uploadFileFn = useCallback(
    async (file: File): Promise<{ props: { url: string; previewWidth: number } }> => {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("slug", slug);
      fd.append("date", date);
      fd.append("type", "content");
      const res = await fetch("/api/blog-upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || ADMIN_UI.messages.uploadError);
      return { props: { url: data.url, previewWidth: 512 } };
    },
    [slug, date]
  );
  return (
    <BlockNoteErrorBoundary onRetry={onRetry}>
      <BlockNoteEditor
        key={editorKey}
        content={content}
        onChange={onBodyChange}
        minHeight="300px"
        uploadFile={canUpload ? uploadFileFn : undefined}
      />
    </BlockNoteErrorBoundary>
  );
});

interface AdminBlogProps {
  contentHealthFilter?: "" | "no-seo" | "no-featured";
  onClearContentHealthFilter?: () => void;
  /** Samo popis – Edit vodi na /admin/blog/edit/[id] */
  listOnly?: boolean;
  /** Samo forma – za stranicu /admin/blog/edit/[id] */
  formOnly?: boolean;
  /** ID posta za edit (kad je formOnly) */
  editId?: string | null;
  /** Novi članak (formOnly) */
  createMode?: boolean;
}

export default function AdminBlog({
  contentHealthFilter = "",
  onClearContentHealthFilter,
  listOnly = false,
  formOnly = false,
  editId = null,
  createMode = false,
}: AdminBlogProps) {
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(formOnly && editId ? editId : null);
  const [editLoading, setEditLoading] = useState(!!(formOnly && editId));
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
    status: "draft" as "draft" | "published",
    body: "",
    seo: { metaTitle: "", metaDescription: "", keywords: "" } as BlogSeo,
  });
  const [bulkTitle, setBulkTitle] = useState("");
  const [bulkDescription, setBulkDescription] = useState("");
  const [uploadingFeatured, setUploadingFeatured] = useState(false);
  const [thumbnailCacheBust, setThumbnailCacheBust] = useState<string | null>(null);
  const thumbnailBustCounterRef = useRef(0);
  const [listThumbnailBust, setListThumbnailBust] = useState<Record<string, number>>({});
  const [editorRetryKey, setEditorRetryKey] = useState(0);
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
  const applyToAllRef = useRef<"overwrite" | "add" | "cancel" | null>(null);
  const [selectedGalleryUrls, setSelectedGalleryUrls] = useState<Set<string>>(new Set());
  const initialFormRef = useRef<string | null>(null);
  const unsavedCtx = useUnsavedChanges();

  const getFormSnapshot = useCallback((f: typeof form) => {
    return JSON.stringify({
      ...f,
      categories: [...(f.categories ?? [])].sort(),
      galleryMetadata: Object.fromEntries(
        Object.entries(f.galleryMetadata ?? {}).sort(([a], [b]) => a.localeCompare(b))
      ),
    });
  }, []);

  useEffect(() => {
    if (!unsavedCtx) return;
    if (!editingId && !creating) {
      unsavedCtx.setUnsavedChanges(false);
      return;
    }
    if (editLoading) return;
    const isDirty = initialFormRef.current !== null && getFormSnapshot(form) !== initialFormRef.current;
    unsavedCtx.setUnsavedChanges(isDirty);
  }, [form, editingId, creating, editLoading, getFormSnapshot, unsavedCtx]);
  const [listStatusFilter, setListStatusFilter] = useState<string>("");
  const [listCategoryFilter, setListCategoryFilter] = useState<string[]>([]);
  const [listMonthFilter, setListMonthFilter] = useState<string>("");
  const [listDateSort, setListDateSort] = useState<"newest" | "oldest">("newest");
  const [listPage, setListPage] = useState(1);

  const ADMIN_POSTS_PER_PAGE = 20;
  const featuredInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const listMonthOptions = useMemo(() => {
    const months = new Set<string>();
    for (const p of posts) {
      const m = p.date?.slice(0, 7);
      if (m && /^\d{4}-\d{2}$/.test(m)) months.add(m);
    }
    return [
      { value: "", label: ADMIN_UI.blog.allDates },
      ...Array.from(months)
        .sort((a, b) => b.localeCompare(a))
        .map((m) => ({ value: m, label: formatMonthOption(m) })),
    ];
  }, [posts]);

  useEffect(() => {
    setListPage(1);
  }, [listStatusFilter, listCategoryFilter, listMonthFilter, listDateSort, contentHealthFilter]);

  const filteredCount = useMemo(() => {
    let f = posts;
    if (contentHealthFilter === "no-seo") f = f.filter((p) => !p.seo?.metaDescription?.trim());
    else if (contentHealthFilter === "no-featured") f = f.filter((p) => !p.thumbnail?.trim());
    if (listStatusFilter) f = f.filter((p) => (p.status ?? "published") === listStatusFilter);
    if (listCategoryFilter.length > 0) f = f.filter((p) => listCategoryFilter.some((s) => postHasCategory(p, s)));
    if (listMonthFilter) f = f.filter((p) => p.date?.slice(0, 7) === listMonthFilter);
    return f.length;
  }, [posts, contentHealthFilter, listStatusFilter, listCategoryFilter, listMonthFilter]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filteredCount / ADMIN_POSTS_PER_PAGE));
    if (listPage > maxPage) setListPage(maxPage);
  }, [filteredCount, listPage]);

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

  const fetchSinglePost = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/blog?id=${encodeURIComponent(id)}`);
      if (res.ok) return res.json();
    } catch {
      // ignore
    }
    return null;
  }, []);

  useEffect(() => {
    if (formOnly && editId) {
      setLoading(true);
      fetchSinglePost(editId).then((post) => {
        setLoading(false);
        if (post) {
          formOnlyEditLoaded.current = true;
          openEdit(post);
        }
      });
      return;
    }
    if (formOnly && createMode) {
      setLoading(false);
      return;
    }
    fetchBlog();
  // openEdit intentionally omitted – used in async .then() when already defined
  }, [formOnly, editId, createMode, fetchSinglePost, fetchBlog]);

  const formOnlyEditLoaded = useRef(false);

  const formOnlyCreateLoaded = useRef(false);
  useEffect(() => {
    if (formOnly && createMode && !formOnlyCreateLoaded.current) {
      formOnlyCreateLoaded.current = true;
      openCreate();
    }
  }, [formOnly, createMode]);

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

  const openEdit = useCallback(async (post: BlogPost & { body?: string }) => {
    setEditingId(post.id);
    setEditLoading(true);
    setSelectedGalleryUrls(new Set());
    setThumbnailCacheBust(null);
    setEditorRetryKey((k) => k + 1);
    try {
      const full = post.body !== undefined ? post : await fetchPostWithBody(post.slug);
      const formData = {
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
        status: (post.status === "draft" ? "draft" : "published") as "draft" | "published",
        body: full?.body ?? "",
        seo: post.seo ?? { metaTitle: "", metaDescription: "", keywords: "" },
      };
      setForm(formData);
      bodyRef.current = formData.body;
      initialFormRef.current = JSON.stringify({
        ...formData,
        categories: [...formData.categories].sort(),
        galleryMetadata: Object.fromEntries(
          Object.entries(formData.galleryMetadata ?? {}).sort(([a], [b]) => a.localeCompare(b))
        ),
      });
    } finally {
      setEditLoading(false);
    }
  }, [fetchPostWithBody]);

  const handleEditClick = useCallback(
    (post: BlogPost) => {
      if (listOnly) {
        router.push(`/admin/blog/edit/${post.id}`);
      } else {
        openEdit(post);
      }
    },
    [listOnly, router, openEdit]
  );

  const openCreate = () => {
    setCreating(true);
    setThumbnailCacheBust(null);
    setEditorRetryKey((k) => k + 1);
    const formData = {
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
      status: "published" as const,
      body: "",
      seo: { metaTitle: "", metaDescription: "", keywords: "" } as BlogSeo,
    };
    setForm(formData);
    bodyRef.current = "";
    initialFormRef.current = getFormSnapshot(formData);
  };

  const closeForm = useCallback(async (opts?: { skipUnsavedCheck?: boolean }) => {
    const skipCheck = opts?.skipUnsavedCheck;
    if (!skipCheck && unsavedCtx?.hasUnsavedChanges) {
      const leave = await unsavedCtx.confirmUnsaved();
      if (!leave) return;
    }
    if (bodyDebounceRef.current) {
      clearTimeout(bodyDebounceRef.current);
      bodyDebounceRef.current = null;
    }
    bodyRef.current = null;
    setEditingId(null);
    setCreating(false);
    setSelectedGalleryUrls(new Set());
    setThumbnailCacheBust(null);
    initialFormRef.current = null;
    unsavedCtx?.setUnsavedChanges(false);
    if (formOnly) {
      router.push("/admin/blog");
    }
  }, [formOnly, router, unsavedCtx]);

  const uploadFeatured = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !form.slug.trim() || !form.date.trim()) {
      if (!form.slug.trim()) showToast("error", ADMIN_UI.messages.slugDateRequired);
      else if (!form.date.trim()) showToast("error", ADMIN_UI.messages.dateRequired);
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
      if (!res.ok) throw new Error(data.error || ADMIN_UI.messages.uploadError);
      document.activeElement instanceof HTMLElement && document.activeElement.blur();
      thumbnailBustCounterRef.current += 1;
      setForm((f) => ({ ...f, thumbnail: data.url }));
      setThumbnailCacheBust(`${Date.now()}-${thumbnailBustCounterRef.current}-${Math.random().toString(36).slice(2)}`);
      showToast("success", ADMIN_UI.messages.featuredUploadSuccess);
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : ADMIN_UI.messages.uploadError);
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
      showToast("error", ADMIN_UI.messages.imageFormatError);
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
      showToast("error", ADMIN_UI.messages.imageFormatError);
      return;
    }
    setGalleryFiles(selected);
  };

  const uploadGallerySingle = async (
    file: File,
    opts: { overwrite?: boolean; addWithSuffix?: boolean; index?: number } = {}
  ): Promise<{ ok: boolean; duplicate?: boolean; rateLimited?: boolean; data?: unknown }> => {
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
    if (res.status === 429) return { ok: false, rateLimited: true, data };
    if (res.status === 409 && data.error === "Duplicate") return { ok: false, duplicate: true, data };
    return { ok: false, data };
  };

  const handleDuplicateChoice = useCallback(
    (action: "overwrite" | "add" | "cancel", applyToAll?: boolean) => {
      if (applyToAll) applyToAllRef.current = action;
      duplicateResolveRef.current?.(action);
      duplicateResolveRef.current = null;
      setDuplicateModal(null);
    },
    []
  );

  const bodyRef = useRef<string | null>(null);
  const bodyDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const BODY_DEBOUNCE_MS = 200;

  const handleBodyChange = useCallback((html: string) => {
    bodyRef.current = html;
    if (bodyDebounceRef.current) clearTimeout(bodyDebounceRef.current);
    bodyDebounceRef.current = setTimeout(() => {
      bodyDebounceRef.current = null;
      setForm((f) => ({ ...f, body: html }));
    }, BODY_DEBOUNCE_MS);
  }, []);

  const handleEditorRetry = useCallback(() => {
    setEditorRetryKey((k) => k + 1);
  }, []);

  const uploadGalleryBatch = async () => {
    if (
      galleryFiles.length === 0 ||
      !form.slug.trim() ||
      !form.date.trim()
    ) {
      if (!form.slug.trim()) showToast("error", ADMIN_UI.messages.slugDateRequired);
      else if (!form.date.trim()) showToast("error", ADMIN_UI.messages.dateRequired);
      return;
    }
    setGalleryUploadProgress({ current: 0, total: galleryFiles.length });
    applyToAllRef.current = null;
    const newUrls: string[] = [];
    let rateLimitedAt: number | null = null;
    try {
      for (let i = 0; i < galleryFiles.length; i++) {
        setGalleryUploadProgress({ current: i + 1, total: galleryFiles.length });
        const file = galleryFiles[i];
        let result = await uploadGallerySingle(file, { index: i });

        if (result.rateLimited) {
          rateLimitedAt = i;
          break;
        }

        if (result.duplicate && result.data) {
          let choice: "overwrite" | "add" | "cancel";
          if (applyToAllRef.current) {
            choice = applyToAllRef.current;
          } else {
            const d = result.data as { existingSrc?: string; filename?: string; existingSize?: number };
            const filePreviewUrl = URL.createObjectURL(file);
            choice = await new Promise<"overwrite" | "add" | "cancel">((resolve) => {
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
          }

          if (choice === "overwrite") {
            result = await uploadGallerySingle(file, { overwrite: true, index: i });
          } else if (choice === "add") {
            result = await uploadGallerySingle(file, { addWithSuffix: true, index: i });
          }
          if (result.rateLimited) {
            rateLimitedAt = i;
            break;
          }
        }

        if (result.ok && result.data) {
          newUrls.push((result.data as { url: string }).url);
        } else if (!result.duplicate) {
          const err = (result.data as { error?: string })?.error || ADMIN_UI.messages.uploadError;
          showToast("error", err);
        }
      }
      if (newUrls.length > 0) {
        setForm((f) => ({ ...f, gallery: [...f.gallery, ...newUrls] }));
        showToast("success", ADMIN_UI.blog.imageAdded(newUrls.length));
      }
      if (rateLimitedAt !== null) {
        const remaining = galleryFiles.length - rateLimitedAt;
        setGalleryFiles(galleryFiles.slice(rateLimitedAt));
        showToast("error", ADMIN_UI.blog.rateLimit(newUrls.length, galleryFiles.length, remaining));
      } else {
        setGalleryFiles([]);
      }
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : ADMIN_UI.messages.uploadError);
      setGalleryFiles([]);
    } finally {
      setGalleryUploadProgress(null);
    }
  };

  const deleteBlogGalleryFile = async (url: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/blog-delete-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      return res.ok;
    } catch {
      return false;
    }
  };

  const removeGalleryImage = (url: string) => {
    void deleteBlogGalleryFile(url).then((ok) => {
      if (!ok) showToast("error", ADMIN_UI.blog.fileNotDeleted);
    });
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

  const handleBulkDeleteGallery = async () => {
    if (selectedGalleryUrls.size === 0) return;
    if (!confirm(ADMIN_UI.blog.deleteImagesConfirm(selectedGalleryUrls.size))) return;
    const urls = Array.from(selectedGalleryUrls);
    const urlSet = new Set(urls);
    setForm((f) => {
      const nextMeta = { ...f.galleryMetadata };
      urls.forEach((u) => delete nextMeta[u]);
      return {
        ...f,
        gallery: f.gallery.filter((u) => !urlSet.has(u)),
        galleryMetadata: nextMeta,
      };
    });
    setSelectedGalleryUrls(new Set());
    let failed = 0;
    for (const url of urls) {
      const ok = await deleteBlogGalleryFile(url);
      if (!ok) failed++;
    }
    showToast(failed > 0 ? "error" : "success", failed > 0 ? ADMIN_UI.blog.deleteFailed(failed) : ADMIN_UI.blog.removedFromGallery);
  };

  const handleBulkApplyMetadata = () => {
    if (selectedGalleryUrls.size === 0) return;
    const title = bulkTitle.trim() || undefined;
    const description = bulkDescription.trim() || undefined;
    if (!title && !description) {
      showToast("error", "Enter title or description.");
      return;
    }
    setForm((f) => {
      const nextMeta = { ...f.galleryMetadata };
      selectedGalleryUrls.forEach((url) => {
        const existing = nextMeta[url] ?? {};
        nextMeta[url] = {
          ...existing,
          ...(title !== undefined && { title }),
          ...(description !== undefined ? { description } : {}),
        };
        if (description === undefined && "description" in nextMeta[url]) {
          delete nextMeta[url].description;
        }
      });
      return { ...f, galleryMetadata: nextMeta };
    });
    setBulkTitle("");
    setBulkDescription("");
    showToast("success", ADMIN_UI.blog.appliedTo(selectedGalleryUrls.size));
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    if (bodyDebounceRef.current) {
      clearTimeout(bodyDebounceRef.current);
      bodyDebounceRef.current = null;
      setForm((f) => ({ ...f, body: bodyRef.current ?? f.body }));
    }
    setSaving(true);
    try {
      const bodyToSave = bodyRef.current ?? form.body;
      const res = await fetch("/api/blog", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          ...form,
          body: bodyToSave,
        }),
      });
      if (!res.ok) throw new Error("Failed to update");
      showToast("success", ADMIN_UI.messages.blogSaveSuccess);
      const savedId = editingId;
      unsavedCtx?.setUnsavedChanges(false);
      closeForm({ skipUnsavedCheck: true });
      await fetchBlog();
      setListThumbnailBust((prev) => ({ ...prev, [savedId]: Date.now() }));
    } catch {
      showToast("error", ADMIN_UI.messages.blogSaveError);
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    if (bodyDebounceRef.current) {
      clearTimeout(bodyDebounceRef.current);
      bodyDebounceRef.current = null;
      setForm((f) => ({ ...f, body: bodyRef.current ?? f.body }));
    }
    setSaving(true);
    try {
      const slug =
        form.slug.trim() || generateBlogSlug(form.title, form.date) || crypto.randomUUID().slice(0, 8);
      const bodyToSave = bodyRef.current ?? form.body;
      const res = await fetch("/api/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          body: bodyToSave,
          slug: slug || crypto.randomUUID().slice(0, 8),
        }),
      });
      if (!res.ok) throw new Error("Failed to create");
      const created = await res.json();
      showToast("success", ADMIN_UI.messages.blogCreateSuccess);
      unsavedCtx?.setUnsavedChanges(false);
      closeForm({ skipUnsavedCheck: true });
      await fetchBlog();
      if (created?.id) {
        setListThumbnailBust((prev) => ({ ...prev, [created.id]: Date.now() }));
      }
    } catch {
      showToast("error", ADMIN_UI.messages.blogCreateError);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(ADMIN_UI.messages.blogDeleteConfirm)) return;
    try {
      const res = await fetch(`/api/blog?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      showToast("success", ADMIN_UI.messages.blogDeleteSuccess);
      unsavedCtx?.setUnsavedChanges(false);
      closeForm({ skipUnsavedCheck: true });
      fetchBlog();
    } catch {
      showToast("error", ADMIN_UI.messages.blogDeleteError);
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
        <h2 className="text-lg font-semibold text-zinc-200">{ADMIN_UI.blog.blogPosts}</h2>
        {!isFormOpen && (
          <button
            type="button"
            onClick={listOnly ? () => router.push("/admin/blog/new") : openCreate}
            className="flex items-center gap-2 rounded-lg bg-zinc-700 px-4 py-2 text-sm font-medium text-zinc-100 transition-colors hover:bg-zinc-600"
          >
            <Plus className="h-4 w-4" />
            {ADMIN_UI.blog.newPost}
          </button>
        )}
      </div>

      {isFormOpen ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-zinc-200">
              {creating ? ADMIN_UI.blog.newPost : ADMIN_UI.blog.editPost}
            </h3>
            <button
              type="button"
              onClick={() => closeForm()}
              className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm text-zinc-400">{ADMIN_UI.blog.title}</label>
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
                placeholder={ADMIN_UI.blog.postTitlePlaceholder}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-zinc-400">Slug (URL)</label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-zinc-100 placeholder-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                placeholder="yymmdd-slug (e.g. 251228-advent-2025)"
              />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="mb-2 block text-sm text-zinc-400">{ADMIN_UI.blog.date}</label>
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
                <label className="mb-2 block text-sm text-zinc-400">{ADMIN_UI.blog.time}</label>
                <input
                  type="time"
                  value={form.time}
                  onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-zinc-100 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <label className="text-sm text-zinc-400">Status</label>
                <div className="w-40">
                  <StatusSelect
                    value={form.status}
                    onChange={(v) =>
                      setForm((f) => ({ ...f, status: v }))
                    }
                  />
                </div>
                <span className="text-xs text-zinc-500">
                  {form.status === "draft" ? ADMIN_UI.blog.draftHint : ADMIN_UI.blog.publishedHint}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm text-zinc-400">{ADMIN_UI.blog.featuredPost}</label>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, featured: !f.featured }))}
                className={`rounded p-2 transition-colors ${
                  form.featured
                    ? "text-amber-400 hover:text-amber-300"
                    : "text-zinc-500 hover:text-zinc-400"
                }`}
                title={form.featured ? ADMIN_UI.blog.removeFromFeatured : ADMIN_UI.blog.addToFeatured}
                aria-label={form.featured ? ADMIN_UI.blog.removeFromFeatured : ADMIN_UI.blog.addToFeatured}
              >
                <Star
                  className={`h-5 w-5 ${form.featured ? "fill-amber-400" : ""}`}
                  strokeWidth={1.5}
                />
              </button>
              <span className="text-xs text-zinc-500">
                {form.featured ? ADMIN_UI.blog.showsInWidget : ADMIN_UI.blog.addToFeatured}
              </span>
              </div>
            </div>
            <div className="rounded-lg border-2 border-sky-500/30 bg-sky-950/25 p-4 ring-1 ring-sky-500/10">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-medium text-sky-300">
                <Search className="h-4 w-4 text-sky-400" />
                SEO Settings
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs text-zinc-500">Meta Title</label>
                  <input
                    type="text"
                    value={form.seo?.metaTitle ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        seo: { ...f.seo, metaTitle: e.target.value },
                      }))
                    }
                    placeholder={`Prazno = koristi naslov članka (${form.title || "—"})`}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                  />
                  <p className="mt-1 text-xs text-zinc-500">
                    Ako ostane prazno, koristi se naslov članka
                  </p>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-zinc-500">
                    Meta Description
                    <span
                      className={`ml-2 ${(form.seo?.metaDescription?.length ?? 0) > META_DESCRIPTION_MAX ? "text-amber-400" : "text-zinc-500"}`}
                    >
                      {(form.seo?.metaDescription?.length ?? 0)}/160
                    </span>
                  </label>
                  <textarea
                    value={form.seo?.metaDescription ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        seo: { ...f.seo, metaDescription: e.target.value },
                      }))
                    }
                    rows={3}
                    placeholder="Fotografije + event + lokacija + godina + što se vidi"
                    className={`w-full rounded-lg border px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 ${
                      (form.seo?.metaDescription?.length ?? 0) > META_DESCRIPTION_MAX
                        ? "border-amber-500 bg-zinc-800/50 focus:border-amber-500 focus:ring-amber-500"
                        : "border-zinc-700 bg-zinc-800/50 focus:border-zinc-500 focus:ring-zinc-500"
                    }`}
                  />
                  {(form.seo?.metaDescription?.length ?? 0) > META_DESCRIPTION_MAX && (
                    <p className="mt-1 text-xs text-amber-400">
                      Preporučeno max. 160 znakova za prikaz u rezultatima pretrage
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-xs text-zinc-500">Keywords (zarezom odvojeno)</label>
                  <input
                    type="text"
                    value={form.seo?.keywords ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        seo: { ...f.seo, keywords: e.target.value },
                      }))
                    }
                    placeholder="fotografija, advent, Zagreb, ..."
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm text-zinc-400">{ADMIN_UI.blog.category}</label>
              <BlogCategorySelect
                value={form.categories}
                onChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    categories: Array.isArray(v) ? v : v ? [v] : [],
                  }))
                }
                placeholder={ADMIN_UI.blog.selectCategories}
                multiple
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-zinc-400">Istaknuta slika</label>
              <p className="mb-2 text-xs text-zinc-500">
                {ADMIN_UI.blog.enterDateTitleBefore}{" "}
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
                        title={ADMIN_UI.blog.clickForFocus}
                      >
                        <img
                          key={`${form.thumbnail}-${thumbnailCacheBust ?? ""}`}
                          src={form.thumbnail + (thumbnailCacheBust ? `?t=${thumbnailCacheBust}` : "")}
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
                        aria-label={ADMIN_UI.blog.removeFeaturedImage}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-xs text-zinc-500">
                      {ADMIN_UI.blog.clickForFocus} · {ADMIN_UI.blog.orSelectFromGrid}
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
                    {form.thumbnail ? "Replace" : "Upload featured image"}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm text-zinc-400">{ADMIN_UI.blog.content}</label>
              {editLoading ? (
                <div className="flex min-h-[300px] items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800/50">
                  <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
                </div>
              ) : (
                <MemoizedBlockNoteSection
                  content={form.body}
                  onBodyChange={handleBodyChange}
                  slug={form.slug}
                  date={form.date}
                  canUpload={canUpload}
                  editorKey={`${editingId ?? "new"}-${editorRetryKey}-${canUpload ? "upload" : "no-upload"}`}
                  onRetry={handleEditorRetry}
                />
              )}
            </div>

            <div>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                <label className="text-sm text-zinc-400">
                  {ADMIN_UI.blog.galleryLabel}
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
                          {ADMIN_UI.blog.selectAll}
                        </button>
                        <button
                          type="button"
                          onClick={deselectAllGallery}
                          className="text-sm text-zinc-500 hover:text-zinc-300"
                        >
                          {ADMIN_UI.blog.deselectAll}
                        </button>
                        <span className="text-sm text-zinc-500">
                          {ADMIN_UI.blog.selectedCount(selectedGalleryUrls.size)}
                        </span>
                        <button
                          type="button"
                          onClick={handleBulkApplyMetadata}
                          disabled={!bulkTitle.trim() && !bulkDescription.trim()}
                          className="flex items-center gap-2 rounded-lg bg-zinc-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-500 disabled:opacity-50 disabled:hover:bg-zinc-600"
                        >
                          {ADMIN_UI.blog.applyToSelected}
                        </button>
                        <button
                          type="button"
                          onClick={handleBulkDeleteGallery}
                          className="flex items-center gap-2 rounded-lg bg-red-600/80 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                          {ADMIN_UI.blog.deleteSelected}
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={selectAllGallery}
                        className="text-sm text-zinc-500 hover:text-zinc-300"
                      >
                        {ADMIN_UI.blog.selectAll}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Bulk edit: naslov i opis za odabrane slike */}
              {selectedGalleryUrls.size > 0 && (
                <div className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-zinc-700 bg-zinc-800/50 p-3">
                  <div className="min-w-[12rem] flex-1">
                    <label className="mb-1 block text-xs text-zinc-500">{ADMIN_UI.blog.titleForSelected}</label>
                    <input
                      type="text"
                      value={bulkTitle}
                      onChange={(e) => setBulkTitle(e.target.value)}
                      placeholder={ADMIN_UI.blog.titlePlaceholder}
                      className="w-full rounded border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-zinc-500 focus:outline-none"
                    />
                  </div>
                  <div className="min-w-[12rem] flex-1">
                    <label className="mb-1 block text-xs text-zinc-500">{ADMIN_UI.blog.descriptionForSelected}</label>
                    <input
                      type="text"
                      value={bulkDescription}
                      onChange={(e) => setBulkDescription(e.target.value)}
                      placeholder={ADMIN_UI.blog.descriptionPlaceholder}
                      className="w-full rounded border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-zinc-500 focus:outline-none"
                    />
                  </div>
                  <p className="w-full text-xs text-zinc-500">
                    {ADMIN_UI.blog.clickSaveToPersist}{" "}
                    <code className="rounded bg-zinc-800 px-1">npm run build</code> {ADMIN_UI.blog.clickSaveSuffix}
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
                          isFeatured={form.thumbnail === url}
                          onToggleSelect={() => toggleGallerySelect(url)}
                          onSetFeatured={() => {
                            setForm((f) => ({
                              ...f,
                              thumbnail: url,
                              thumbnailFocus: f.thumbnail === url ? f.thumbnailFocus : "50% 50%",
                            }));
                            setThumbnailCacheBust(`${Date.now()}-${Math.random().toString(36).slice(2)}`);
                          }}
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
                    ? ADMIN_UI.blog.selectedImages(galleryFiles.length)
                    : ADMIN_UI.blog.newImages}
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
                          {ADMIN_UI.blog.clickOrDrag}
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
                      {ADMIN_UI.blog.addToGallery(galleryFiles.length)}
                    </>
                  ) : (
                    <>
                      <ImageIcon className="h-4 w-4" />
                      {ADMIN_UI.blog.addToGallery()}
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
                {ADMIN_UI.blog.delete}
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
                  Saving...
                </>
              ) : (
                creating ? ADMIN_UI.blog.createPost : ADMIN_UI.blog.save
              )}
            </button>
          </div>
        </div>
      ) : null}

      {!isFormOpen && (
      <>
      {/* Filter bar za listu blogova */}
      <div className="mb-4 flex flex-wrap items-end gap-4 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
        <div className="w-36">
          <FilterSelect
            label="Status"
            value={listStatusFilter}
            onChange={setListStatusFilter}
            options={[
              { value: "", label: "All" },
              { value: "draft", label: "Draft" },
              { value: "published", label: "Published" },
            ]}
          />
        </div>
        <div className="w-48">
          <FilterMultiSelect
            label="Category"
            value={listCategoryFilter}
            onChange={setListCategoryFilter}
            placeholder="All categories"
            options={getBlogCategoryOptions()
              .sort((a, b) => a.fullLabel.localeCompare(b.fullLabel, "hr"))
              .map((c) => ({ value: c.slug, label: c.fullLabel }))}
          />
        </div>
        <div className="w-40">
          <FilterSelect
            label="Month"
            value={listMonthFilter}
            onChange={setListMonthFilter}
            options={listMonthOptions}
          />
        </div>
        <div className="w-32">
          <FilterSelect
            label="Sort"
            value={listDateSort}
            onChange={(v) => setListDateSort(v as "newest" | "oldest")}
            options={[
              { value: "newest", label: "Newest" },
              { value: "oldest", label: "Oldest" },
            ]}
          />
        </div>
      </div>

      {contentHealthFilter && onClearContentHealthFilter && (
        <div className="mb-6 flex items-center justify-between gap-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <span className="text-sm text-amber-400">
            {contentHealthFilter === "no-seo"
              ? "Showing only posts without meta description (SEO)"
              : ADMIN_UI.blog.noFeaturedFilter}
          </span>
          <button
            type="button"
            onClick={onClearContentHealthFilter}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-amber-400 transition-colors hover:bg-amber-500/20 hover:text-amber-300"
          >
            Clear filter
          </button>
        </div>
      )}

      <div className="space-y-2">
        {(() => {
          let filtered =
            contentHealthFilter === "no-seo"
              ? posts.filter((p) => !p.seo?.metaDescription?.trim())
              : contentHealthFilter === "no-featured"
                ? posts.filter((p) => !p.thumbnail || !String(p.thumbnail).trim())
                : posts;
          if (listStatusFilter) {
            filtered = filtered.filter(
              (p) => (p.status ?? "published") === listStatusFilter
            );
          }
          if (listCategoryFilter.length > 0) {
            filtered = filtered.filter((p) =>
              listCategoryFilter.some((slug) => postHasCategory(p, slug))
            );
          }
          if (listMonthFilter) {
            filtered = filtered.filter(
              (p) => p.date?.slice(0, 7) === listMonthFilter
            );
          }
          const sorted = [...filtered].sort((a, b) => {
            const da = a.date + (a.time || "00:00");
            const db = b.date + (b.time || "00:00");
            return listDateSort === "oldest"
              ? da.localeCompare(db)
              : db.localeCompare(da);
          });
          const totalPages = Math.max(1, Math.ceil(sorted.length / ADMIN_POSTS_PER_PAGE));
          const safePage = Math.min(Math.max(1, listPage), totalPages);
          const paginated = sorted.slice(
            (safePage - 1) * ADMIN_POSTS_PER_PAGE,
            safePage * ADMIN_POSTS_PER_PAGE
          );
          return sorted.length === 0 ? (
          <p className="rounded-lg bg-zinc-800/50 py-8 text-center text-sm text-zinc-500">
            {contentHealthFilter || listStatusFilter || listCategoryFilter.length > 0 || listMonthFilter
              ? ADMIN_UI.blog.noPostsFilter
              : ADMIN_UI.blog.noPostsYet}
          </p>
        ) : (
          <>
          {paginated
            .map((post) => (
            <div
              key={post.id}
              className="flex items-center gap-4 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4"
            >
              <div className="h-14 w-20 shrink-0 overflow-hidden rounded-md bg-zinc-800">
                {post.thumbnail ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={post.thumbnail + (listThumbnailBust[post.id] ? `?t=${listThumbnailBust[post.id]}` : "")}
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
                <span
                  className={`rounded px-2 py-1 text-xs font-medium ${
                    post.status === "draft"
                      ? "bg-amber-500/20 text-amber-400"
                      : "bg-emerald-500/20 text-emerald-400"
                  }`}
                >
                  {post.status === "draft" ? "Draft" : "Published"}
                </span>
                {getDisplayCategories(post).length > 0 && (
                  <span className="flex flex-wrap items-center gap-1 rounded px-2 py-1 text-xs text-zinc-400">
                    {getDisplayCategories(post).map((slug) => (
                      <span
                        key={slug}
                        className="rounded bg-zinc-700/80 px-1.5 py-0.5"
                      >
                        {getShortCategoryLabel(slug)}
                      </span>
                    ))}
                  </span>
                )}
                <span className="flex items-center gap-1 rounded px-2 py-1.5 text-xs text-zinc-500">
                  SEO
                  {post.seo?.metaDescription?.trim() ? (
                    <Check className="h-4 w-4 text-emerald-500" strokeWidth={2.5} />
                  ) : (
                    <X className="h-4 w-4 text-red-500" strokeWidth={2.5} />
                  )}
                </span>
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
                      showToast("error", "Change failed.");
                    }
                  }}
                  className={`rounded p-2 transition-colors ${
                    post.featured
                      ? "text-amber-400 hover:text-amber-300"
                      : "text-zinc-500 hover:text-zinc-400"
                  }`}
                  title={post.featured ? ADMIN_UI.blog.removeFromFeatured : ADMIN_UI.blog.addToFeatured}
                  aria-label={post.featured ? ADMIN_UI.blog.removeFromFeatured : ADMIN_UI.blog.addToFeatured}
                >
                  <Star
                    className={`h-4 w-4 ${post.featured ? "fill-amber-400" : ""}`}
                    strokeWidth={1.5}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => handleEditClick(post)}
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
            ))}
          {totalPages > 1 && (
            <nav
              className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-zinc-800 pt-6"
              aria-label="Blog list pagination"
            >
              <span className="text-sm text-zinc-500">
                Stranica {safePage} od {totalPages} · {sorted.length} postova
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setListPage((p) => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                  className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Prethodna stranica"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prethodna
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                    .reduce<(number | "ellipsis")[]>((acc, p, i, arr) => {
                      if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("ellipsis");
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, i) =>
                      p === "ellipsis" ? (
                        <span key={`e-${i}`} className="px-2 text-zinc-500">…</span>
                      ) : p === safePage ? (
                        <span
                          key={p}
                          className="inline-flex h-9 min-w-[2.25rem] items-center justify-center rounded-md bg-zinc-700 px-2 text-sm font-medium text-white"
                          aria-current="page"
                        >
                          {p}
                        </span>
                      ) : (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setListPage(p as number)}
                          className="inline-flex h-9 min-w-[2.25rem] items-center justify-center rounded-md px-2 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
                        >
                          {p}
                        </button>
                      )
                    )}
                </div>
                <button
                  type="button"
                  onClick={() => setListPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                  className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Sljedeća stranica"
                >
                  Sljedeća
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </nav>
          )}
          </>
        );
        })()}
      </div>
      </>
      )}

      {duplicateModal && (
        <div
          className={ADMIN_UI.modal.overlayZ50}
          onClick={() => handleDuplicateChoice("cancel")}
        >
          <div
            className={ADMIN_UI.modal.cardWide}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={ADMIN_UI.modal.titleMb4}>
              {ADMIN_UI.duplicateModal.titlePrefix} &quot;{duplicateModal.filename}&quot; {ADMIN_UI.duplicateModal.titleSuffix}
            </h3>
            <p className={ADMIN_UI.modal.bodyMb4}>
              {ADMIN_UI.duplicateModal.question}
            </p>
            <div className="mb-6 flex gap-4">
              <div className="flex flex-1 flex-col items-center">
                <p className="mb-2 text-xs font-medium text-zinc-500">{ADMIN_UI.duplicateModal.newLabel}</p>
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
                <p className="mb-2 text-xs font-medium text-zinc-500">{ADMIN_UI.duplicateModal.existingLabel}</p>
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
                className={ADMIN_UI.buttons.neutral}
              >
                {ADMIN_UI.duplicateModal.overwrite}
              </button>
              <button
                type="button"
                onClick={() => handleDuplicateChoice("overwrite", true)}
                className={ADMIN_UI.buttons.neutral}
              >
                {ADMIN_UI.duplicateModal.overwriteAll}
              </button>
              <button
                type="button"
                onClick={() => handleDuplicateChoice("add")}
                className={ADMIN_UI.buttons.neutral}
              >
                {ADMIN_UI.duplicateModal.addSuffix}
              </button>
              <button
                type="button"
                onClick={() => handleDuplicateChoice("add", true)}
                className={ADMIN_UI.buttons.neutral}
              >
                {ADMIN_UI.duplicateModal.addAllSuffix}
              </button>
              <button
                type="button"
                onClick={() => handleDuplicateChoice("cancel")}
                className={ADMIN_UI.buttons.secondary}
              >
                {ADMIN_UI.duplicateModal.cancel}
              </button>
              <button
                type="button"
                onClick={() => handleDuplicateChoice("cancel", true)}
                className={ADMIN_UI.buttons.secondary}
              >
                {ADMIN_UI.duplicateModal.cancelAll}
              </button>
            </div>
          </div>
        </div>
      )}

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
