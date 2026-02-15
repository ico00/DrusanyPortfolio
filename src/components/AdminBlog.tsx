"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import BlockNoteEditor from "./BlockNoteEditorDynamic";
import type { BlogPost } from "@/lib/blog";

export default function AdminBlog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    title: "",
    slug: "",
    date: new Date().toISOString().slice(0, 10),
    thumbnail: "",
    body: "",
  });
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

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

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const openEdit = (post: BlogPost) => {
    setEditingId(post.id);
    setForm({
      title: post.title,
      slug: post.slug,
      date: post.date,
      thumbnail: post.thumbnail,
      body: post.body,
    });
  };

  const openCreate = () => {
    setCreating(true);
    setForm({
      title: "",
      slug: "",
      date: new Date().toISOString().slice(0, 10),
      thumbnail: "",
      body: "",
    });
  };

  const closeForm = () => {
    setEditingId(null);
    setCreating(false);
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
      showToast("success", "Post updated.");
      closeForm();
      fetchBlog();
    } catch {
      showToast("error", "Failed to update post.");
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      const slug = form.slug.trim() || form.title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      const res = await fetch("/api/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          slug: slug || crypto.randomUUID().slice(0, 8),
        }),
      });
      if (!res.ok) throw new Error("Failed to create");
      showToast("success", "Post created.");
      closeForm();
      fetchBlog();
    } catch {
      showToast("error", "Failed to create post.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this post?")) return;
    try {
      const res = await fetch(`/api/blog?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      showToast("success", "Post deleted.");
      closeForm();
      fetchBlog();
    } catch {
      showToast("error", "Failed to delete post.");
    }
  };

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
        <h2 className="text-lg font-semibold text-zinc-200">Blog posts</h2>
        {!isFormOpen && (
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-2 rounded-lg bg-zinc-700 px-4 py-2 text-sm font-medium text-zinc-100 transition-colors hover:bg-zinc-600"
          >
            <Plus className="h-4 w-4" />
            New post
          </button>
        )}
      </div>

      {isFormOpen ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-zinc-200">
              {creating ? "New post" : "Edit post"}
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
              <label className="mb-2 block text-sm text-zinc-400">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-zinc-100 placeholder-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                placeholder="Post title"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-zinc-400">Slug (URL)</label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-zinc-100 placeholder-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                placeholder="url-slug"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-zinc-400">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-zinc-100 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-zinc-400">Thumbnail URL</label>
              <input
                type="text"
                value={form.thumbnail}
                onChange={(e) => setForm((f) => ({ ...f, thumbnail: e.target.value }))}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-zinc-100 placeholder-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                placeholder="/uploads/..."
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-zinc-400">Body (HTML)</label>
              <p className="mb-2 rounded-lg bg-zinc-800/80 px-3 py-2 text-xs text-zinc-400">
                <strong className="text-zinc-300">Blok editor:</strong> Naciljaj blok ili klikni unutra → lijevo se pojavi izbornik (⋮⋮ +). Upiši <kbd className="rounded bg-zinc-700 px-1.5 py-0.5">/</kbd> za tip bloka (naslov, lista, slika…). Označi tekst za formatiranje (bold, boja, link).
              </p>
              <p className="mb-2 rounded-lg bg-zinc-800/50 px-3 py-2 text-xs text-zinc-500">
                <strong className="text-zinc-400">Promjena tipa bloka (npr. H1 → H3):</strong> Označi tekst u bloku → iznad se pojavi toolbar s dropdownom tipa bloka (prva ikona). Klikni na nju da vidiš trenutni stil i odaberi drugi (Heading 1, 2, 3, Paragraf…).
              </p>
              <BlockNoteEditor
                key={editingId ?? "new"}
                content={form.body}
                onChange={(html) => setForm((f) => ({ ...f, body: html }))}
                minHeight="300px"
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            {editingId && (
              <button
                type="button"
                onClick={() => handleDelete(editingId)}
                className="rounded-lg border border-red-800/60 px-4 py-2 text-sm text-red-400 transition-colors hover:bg-red-900/30"
              >
                Delete
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
              ) : creating ? (
                "Create post"
              ) : (
                "Save"
              )}
            </button>
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        {posts.length === 0 ? (
          <p className="rounded-lg bg-zinc-800/50 py-8 text-center text-sm text-zinc-500">
            No blog posts yet. Click &quot;New post&quot; to create one.
          </p>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 p-4"
            >
              <div>
                <h4 className="font-medium text-zinc-200">{post.title || "Untitled"}</h4>
                <p className="text-sm text-zinc-500">
                  /blog/{post.slug} · {post.date}
                </p>
              </div>
              <div className="flex gap-2">
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

      {toast && (
        <div
          className={`fixed bottom-6 right-6 rounded-lg px-4 py-2 text-sm ${
            toast.type === "success" ? "bg-green-900/90 text-green-100" : "bg-red-900/90 text-red-100"
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
