"use client";

import { useState, useEffect } from "react";
import { useCallback } from "react";
import { Loader2 } from "lucide-react";
import BlockNoteEditor from "./BlockNoteEditorDynamic";

interface PageContent {
  title: string;
  html: string;
}

interface PagesData {
  about: PageContent;
  contact: PageContent;
}

interface AdminPagesProps {
  page: "about" | "contact";
}

export default function AdminPages({ page }: AdminPagesProps) {
  const [pages, setPages] = useState<PagesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aboutTitle, setAboutTitle] = useState("");
  const [aboutHtml, setAboutHtml] = useState("");
  const [contactTitle, setContactTitle] = useState("");
  const [contactHtml, setContactHtml] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchPages = useCallback(async () => {
    try {
      const res = await fetch("/api/pages");
      if (res.ok) {
        const data = await res.json();
        setPages(data);
        setAboutTitle(data.about?.title ?? "About");
        setAboutHtml(data.about?.html ?? "");
        setContactTitle(data.contact?.title ?? "Contact");
        setContactHtml(data.contact?.html ?? "");
      }
    } catch {
      setPages({ about: { title: "About", html: "" }, contact: { title: "Contact", html: "" } });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/pages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          about: { title: aboutTitle, html: aboutHtml },
          contact: { title: contactTitle, html: contactHtml },
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      showToast("success", "Pages saved.");
    } catch {
      showToast("error", "Failed to save pages.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  const title = page === "about" ? aboutTitle : contactTitle;
  const setTitle = page === "about" ? setAboutTitle : setContactTitle;
  const content = page === "about" ? aboutHtml : contactHtml;
  const setContent = page === "about" ? setAboutHtml : setContactHtml;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
        <label className="mb-2 block text-sm font-medium text-zinc-400">
          Naslov stranice
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={page === "about" ? "About" : "Contact"}
          className="w-full rounded-lg border border-zinc-600 bg-zinc-700/50 px-4 py-3 text-xl font-semibold tracking-tight text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm text-zinc-400">
          {page === "about" ? "Sadržaj About stranice" : "Sadržaj Contact stranice"}
        </label>
        <p className="mb-2 rounded-lg bg-zinc-800/80 px-3 py-2 text-xs text-zinc-400">
          <strong className="text-zinc-300">Blok editor:</strong> Naciljaj blok ili klikni unutra → lijevo se pojavi izbornik (⋮⋮ +). Upiši <kbd className="rounded bg-zinc-700 px-1.5 py-0.5">/</kbd> za tip bloka (naslov, lista, slika…). Označi tekst za formatiranje (bold, boja, link).
        </p>
        <p className="mb-2 rounded-lg bg-zinc-800/50 px-3 py-2 text-xs text-zinc-500">
          <strong className="text-zinc-400">Promjena tipa bloka (npr. H1 → H3):</strong> Označi tekst u bloku → iznad se pojavi toolbar s dropdownom tipa bloka (prva ikona). Klikni na nju da vidiš trenutni stil i odaberi drugi (Heading 1, 2, 3, Paragraf…).
        </p>
        <BlockNoteEditor
          key={page}
          content={content}
          onChange={setContent}
          minHeight="300px"
        />
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-zinc-700 px-4 py-2 text-sm font-medium text-zinc-100 transition-colors hover:bg-zinc-600 disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save pages"
          )}
        </button>
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
