"use client";

import { useState, useEffect } from "react";
import { useCallback } from "react";
import { Loader2, Check, AlertCircle, Search } from "lucide-react";
import BlockNoteEditor from "./BlockNoteEditorDynamic";

interface SeoContent {
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string;
}

interface PageContent {
  title: string;
  html: string;
  seo?: SeoContent;
}

interface AboutPageContent extends PageContent {
  quote?: string;
}

interface ContactPageContent extends PageContent {
  email?: string;
  formspreeEndpoint?: string;
}

interface BlogPageContent {
  title: string;
  seo?: SeoContent;
}

interface HomePageContent {
  title: string;
  seo?: SeoContent;
}

interface PagesData {
  about: AboutPageContent;
  contact: ContactPageContent;
  blog?: BlogPageContent;
  home?: HomePageContent;
}

const META_DESCRIPTION_MAX = 160;

interface AdminPagesProps {
  page: "about" | "contact" | "blog" | "home";
}

export default function AdminPages({ page }: AdminPagesProps) {
  const [pages, setPages] = useState<PagesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aboutTitle, setAboutTitle] = useState("");
  const [aboutHtml, setAboutHtml] = useState("");
  const [aboutQuote, setAboutQuote] = useState("");
  const [contactTitle, setContactTitle] = useState("");
  const [contactHtml, setContactHtml] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactFormspree, setContactFormspree] = useState("");
  const [aboutSeo, setAboutSeo] = useState<SeoContent>({ metaTitle: "", metaDescription: "", keywords: "" });
  const [contactSeo, setContactSeo] = useState<SeoContent>({ metaTitle: "", metaDescription: "", keywords: "" });
  const [blogTitle, setBlogTitle] = useState("");
  const [blogSeo, setBlogSeo] = useState<SeoContent>({ metaTitle: "", metaDescription: "", keywords: "" });
  const [homeTitle, setHomeTitle] = useState("");
  const [homeSeo, setHomeSeo] = useState<SeoContent>({ metaTitle: "", metaDescription: "", keywords: "" });
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchPages = useCallback(async () => {
    try {
      const res = await fetch("/api/pages");
      if (res.ok) {
        const data = await res.json();
        setPages(data);
        setAboutTitle(data.about?.title ?? "About");
        setAboutHtml(data.about?.html ?? "");
        setAboutQuote(data.about?.quote ?? "");
        setContactTitle(data.contact?.title ?? "Contact");
        setContactHtml(data.contact?.html ?? "");
        setContactEmail(data.contact?.email ?? "");
        setContactFormspree(data.contact?.formspreeEndpoint ?? "");
        setAboutSeo(data.about?.seo ?? { metaTitle: "", metaDescription: "", keywords: "" });
        setContactSeo(data.contact?.seo ?? { metaTitle: "", metaDescription: "", keywords: "" });
        setBlogTitle(data.blog?.title ?? "Blog");
        setBlogSeo(data.blog?.seo ?? { metaTitle: "", metaDescription: "", keywords: "" });
        setHomeTitle(data.home?.title ?? "Drusany | Photography");
        setHomeSeo(data.home?.seo ?? { metaTitle: "", metaDescription: "", keywords: "" });
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
          about: {
            title: aboutTitle,
            html: aboutHtml,
            quote: aboutQuote || undefined,
            seo: aboutSeo,
          },
          contact: {
            title: contactTitle,
            html: contactHtml,
            email: contactEmail || undefined,
            formspreeEndpoint: contactFormspree || undefined,
            seo: contactSeo,
          },
          blog: {
            title: blogTitle,
            seo: blogSeo,
          },
          home: {
            title: homeTitle,
            seo: homeSeo,
          },
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

  const title = page === "about" ? aboutTitle : page === "contact" ? contactTitle : page === "blog" ? blogTitle : homeTitle;
  const setTitle = page === "about" ? setAboutTitle : page === "contact" ? setContactTitle : page === "blog" ? setBlogTitle : setHomeTitle;
  const content = page === "about" ? aboutHtml : contactHtml;
  const setContent = page === "about" ? setAboutHtml : setContactHtml;
  const seo = page === "about" ? aboutSeo : page === "contact" ? contactSeo : page === "blog" ? blogSeo : homeSeo;
  const setSeo = page === "about" ? setAboutSeo : page === "contact" ? setContactSeo : page === "blog" ? setBlogSeo : setHomeSeo;
  const isBlogPage = page === "blog";
  const isHomePage = page === "home";

  return (
    <div className="space-y-14">
      {page === "contact" && !isBlogPage && !isHomePage && (
        <>
          <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
            <label className="mb-2 block text-sm font-medium text-zinc-400">
              Formspree endpoint (preporučeno)
            </label>
            <input
              type="url"
              value={contactFormspree}
              onChange={(e) => setContactFormspree(e.target.value)}
              placeholder="https://formspree.io/f/xxxxx"
              className="w-full rounded-lg border border-zinc-600 bg-zinc-700/50 px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <p className="mt-1 text-xs text-zinc-500">
              Kreiraj besplatni formu na formspree.io – poruke stižu na email. Ako prazno, koristi se mailto.
            </p>
          </div>
          <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
            <label className="mb-2 block text-sm font-medium text-zinc-400">
              Email (fallback za mailto)
            </label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="hello@example.com"
              className="w-full rounded-lg border border-zinc-600 bg-zinc-700/50 px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <p className="mt-1 text-xs text-zinc-500">
              Koristi se samo ako Formspree nije postavljen
            </p>
          </div>
        </>
      )}

      {page === "about" && !isBlogPage && !isHomePage && (
        <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
          <label className="mb-2 block text-sm font-medium text-zinc-400">
            Citat na slici (preko lijevog panela)
          </label>
          <input
            type="text"
            value={aboutQuote}
            onChange={(e) => setAboutQuote(e.target.value)}
            placeholder="Npr. Stay awhile and listen"
            className="w-full rounded-lg border border-zinc-600 bg-zinc-700/50 px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
          <p className="mt-1 text-xs text-zinc-500">
            Prikazuje se u donjem lijevom kutu slike na About stranici
          </p>
        </div>
      )}

      <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
        <label className="mb-2 block text-sm font-medium text-zinc-400">
          Naslov stranice
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={page === "about" ? "About" : page === "contact" ? "Contact" : page === "blog" ? "Blog" : "Drusany | Photography"}
          className="w-full rounded-lg border border-zinc-600 bg-zinc-700/50 px-4 py-3 text-xl font-semibold tracking-tight text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
        />
      </div>

      <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-medium text-zinc-400">
          <Search className="h-4 w-4" />
          SEO Settings
        </h3>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs text-zinc-500">Meta Title</label>
            <input
              type="text"
              value={seo.metaTitle ?? ""}
              onChange={(e) => setSeo((s) => ({ ...s, metaTitle: e.target.value }))}
              placeholder={`Prazno = koristi naslov stranice (${title || "—"})`}
              className="w-full rounded-lg border border-zinc-600 bg-zinc-700/50 px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <p className="mt-1 text-xs text-zinc-500">
              Ako ostane prazno, koristi se naslov stranice
            </p>
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-500">
              Meta Description
              <span
                className={`ml-2 ${(seo.metaDescription?.length ?? 0) > META_DESCRIPTION_MAX ? "text-amber-400" : "text-zinc-500"}`}
              >
                {(seo.metaDescription?.length ?? 0)}/160
              </span>
            </label>
            <textarea
              value={seo.metaDescription ?? ""}
              onChange={(e) => setSeo((s) => ({ ...s, metaDescription: e.target.value }))}
              rows={3}
              placeholder="Opis stranice za pretraživače i društvene mreže"
              className={`w-full rounded-lg border px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 ${
                (seo.metaDescription?.length ?? 0) > META_DESCRIPTION_MAX
                  ? "border-amber-500 focus:border-amber-500 focus:ring-amber-500"
                  : "border-zinc-600 bg-zinc-700/50 focus:border-amber-500 focus:ring-amber-500"
              }`}
            />
            {(seo.metaDescription?.length ?? 0) > META_DESCRIPTION_MAX && (
              <p className="mt-1 text-xs text-amber-400">
                Preporučeno max. 160 znakova za prikaz u rezultatima pretrage
              </p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-500">Keywords (zarezom odvojeno)</label>
            <input
              type="text"
              value={seo.keywords ?? ""}
              onChange={(e) => setSeo((s) => ({ ...s, keywords: e.target.value }))}
              placeholder="fotografija, portfolio, ..."
              className="w-full rounded-lg border border-zinc-600 bg-zinc-700/50 px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>
      </div>

      {!isBlogPage && !isHomePage && (
        <div>
          <label className="mb-2 block text-sm text-zinc-400">
            {page === "about" ? "Sadržaj About stranice" : "Uvodni tekst iznad kontakt forme"}
          </label>
          <BlockNoteEditor
            key={page}
            content={content}
            onChange={setContent}
            minHeight="300px"
          />
        </div>
      )}

      {isBlogPage && (
        <p className="rounded-lg bg-zinc-800/50 py-4 text-center text-sm text-zinc-500">
          SEO za glavnu blog stranicu (/blog) – popis svih članaka. Sadržaj se generira automatski.
        </p>
      )}

      {isHomePage && (
        <p className="rounded-lg bg-zinc-800/50 py-4 text-center text-sm text-zinc-500">
          SEO za početnu stranicu (/) – hero slider i galerija. Sadržaj se generira automatski.
        </p>
      )}

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
