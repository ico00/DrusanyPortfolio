"use client";

import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { DrusanyLogo } from "./Header";
import {
  ArrowLeft,
  Image as ImageIcon,
  FileText,
  BookOpen,
  LayoutDashboard,
  Palette,
  Images,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { CATEGORIES } from "./CategorySelect";
import { useUnsavedChanges } from "@/contexts/UnsavedChangesContext";

function normalizeCategory(cat: string): string {
  return cat
    .toLowerCase()
    .replace(/\s*&\s*/g, "-")
    .replace(/\s+/g, "-");
}

function AdminNavLink({
  href,
  className,
  children,
  onClick,
  ...rest
}: React.ComponentProps<typeof Link>) {
  const router = useRouter();
  const unsaved = useUnsavedChanges();

  const handleClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (unsaved?.hasUnsavedChanges) {
      e.preventDefault();
      const leave = await unsaved.confirmUnsaved();
      if (!leave) return;
      unsaved.setUnsavedChanges(false);
      router.push(href as string);
    }
  };

  return (
    <Link href={href} className={className} onClick={handleClick} {...rest}>
      {children}
    </Link>
  );
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");
  const category = searchParams.get("category") ?? "";

  const isMainAdmin = pathname === "/admin" || (pathname?.startsWith("/admin") && !pathname?.startsWith("/admin/blog"));
  const isBlogRoute = pathname?.startsWith("/admin/blog");

  const [galleryExpanded, setGalleryExpanded] = useState(false);
  const [pagesExpanded, setPagesExpanded] = useState(false);

  useEffect(() => {
    if (tab === "about" || tab === "contact" || tab === "blogPage" || tab === "homePage") {
      setPagesExpanded(true);
      setGalleryExpanded(false);
    }
  }, [tab]);

  useEffect(() => {
    if (tab === "gallery" && (category || searchParams.get("filter"))) {
      setGalleryExpanded(true);
      setPagesExpanded(false);
    }
  }, [tab, category, searchParams]);

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-56 flex-col border-r border-zinc-800 bg-zinc-900">
      <div className="flex flex-col gap-4 border-b border-zinc-800 px-4 py-4">
        <AdminNavLink href="/" className="flex items-center" aria-label="Drusany">
          <DrusanyLogo className="h-8 w-auto" fill="#e4e4e7" />
        </AdminNavLink>
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Admin</p>
          <AdminNavLink href="/" className="flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-zinc-100">
            <ArrowLeft className="h-4 w-4" />
            Back to site
          </AdminNavLink>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-0.5 px-3">
          <AdminNavLink
            href="/admin"
            className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium transition-colors ${
              isMainAdmin && (!tab || tab === "dashboard")
                ? "border-l-2 border-amber-500/80 bg-zinc-800 text-white"
                : "border-l-2 border-transparent text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-200"
            }`}
            onClick={() => {
              setGalleryExpanded(false);
              setPagesExpanded(false);
            }}
          >
            <LayoutDashboard className={`h-5 w-5 shrink-0 ${isMainAdmin && (!tab || tab === "dashboard") ? "text-amber-400" : ""}`} />
            Dashboard
          </AdminNavLink>
          <div>
            <AdminNavLink
              href="/admin?tab=gallery"
              className={`flex w-full items-center justify-between gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                tab === "gallery"
                  ? "border-l-2 border-emerald-500/80 bg-zinc-800 text-white"
                  : "border-l-2 border-transparent text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-200"
              }`}
              onClick={() => {
                setGalleryExpanded((prev) => !prev);
                setPagesExpanded(false);
              }}
            >
              <span className="flex items-center gap-3">
                <ImageIcon className={`h-5 w-5 shrink-0 ${tab === "gallery" ? "text-emerald-400" : ""}`} />
                Gallery
              </span>
              {galleryExpanded ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
            </AdminNavLink>
            <div
              className={`grid overflow-hidden transition-[grid-template-rows] duration-200 ease-out ${
                galleryExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="min-h-0">
                <div className="ml-6 mt-0.5 space-y-0.5 border-l border-zinc-700 pl-2">
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const isActive = tab === "gallery" && normalizeCategory(category) === cat.slug;
                    return (
                      <AdminNavLink
                        key={cat.slug}
                        href={`/admin?tab=gallery&category=${cat.slug}`}
                        className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors ${
                          isActive ? "text-white" : "text-zinc-400 hover:text-zinc-200"
                        }`}
                        onClick={() => setPagesExpanded(false)}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {cat.label}
                      </AdminNavLink>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
          <div>
            <AdminNavLink
              href="/admin?tab=homePage"
              className={`flex w-full items-center justify-between gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                tab === "about" || tab === "contact" || tab === "blogPage" || tab === "homePage"
                  ? "border-l-2 border-blue-500/80 bg-zinc-800 text-white"
                  : "border-l-2 border-transparent text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-200"
              }`}
              onClick={() => {
                setPagesExpanded((prev) => !prev);
                setGalleryExpanded(false);
              }}
            >
              <span className="flex items-center gap-3">
                <FileText
                  className={`h-5 w-5 shrink-0 ${
                    tab === "about" || tab === "contact" || tab === "blogPage" || tab === "homePage"
                      ? "text-blue-400"
                      : ""
                  }`}
                />
                Pages
              </span>
              {pagesExpanded ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
            </AdminNavLink>
            <div
              className={`grid overflow-hidden transition-[grid-template-rows] duration-200 ease-out ${
                pagesExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="min-h-0">
                <div className="ml-6 mt-0.5 space-y-0.5 border-l border-zinc-700 pl-2">
                  <AdminNavLink
                    href="/admin?tab=homePage"
                    className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors ${
                      tab === "homePage" ? "text-white" : "text-zinc-400 hover:text-zinc-200"
                    }`}
                    onClick={() => setGalleryExpanded(false)}
                  >
                    Home
                  </AdminNavLink>
                  <AdminNavLink
                    href="/admin?tab=about"
                    className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors ${
                      tab === "about" ? "text-white" : "text-zinc-400 hover:text-zinc-200"
                    }`}
                    onClick={() => setGalleryExpanded(false)}
                  >
                    About
                  </AdminNavLink>
                  <AdminNavLink
                    href="/admin?tab=contact"
                    className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors ${
                      tab === "contact" ? "text-white" : "text-zinc-400 hover:text-zinc-200"
                    }`}
                    onClick={() => setGalleryExpanded(false)}
                  >
                    Contact
                  </AdminNavLink>
                  <AdminNavLink
                    href="/admin?tab=blogPage"
                    className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors ${
                      tab === "blogPage" ? "text-white" : "text-zinc-400 hover:text-zinc-200"
                    }`}
                    onClick={() => setGalleryExpanded(false)}
                  >
                    Blog page
                  </AdminNavLink>
                </div>
              </div>
            </div>
          </div>
          <AdminNavLink
            href="/admin?tab=media"
            className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium transition-colors ${
              tab === "media"
                ? "border-l-2 border-cyan-500/80 bg-zinc-800 text-white"
                : "border-l-2 border-transparent text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-200"
            }`}
            onClick={() => {
              setGalleryExpanded(false);
              setPagesExpanded(false);
            }}
          >
            <Images className={`h-5 w-5 shrink-0 ${tab === "media" ? "text-cyan-400" : ""}`} />
            Media
          </AdminNavLink>
          <AdminNavLink
            href="/admin/blog"
            className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium transition-colors ${
              isBlogRoute
                ? "border-l-2 border-violet-500/80 bg-zinc-800 text-white"
                : "border-l-2 border-transparent text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-200"
            }`}
            onClick={() => {
              setGalleryExpanded(false);
              setPagesExpanded(false);
            }}
          >
            <BookOpen className={`h-5 w-5 shrink-0 ${isBlogRoute ? "text-violet-400" : ""}`} />
            Blog
          </AdminNavLink>
          <AdminNavLink
            href="/admin?tab=theme"
            className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium transition-colors ${
              tab === "theme"
                ? "border-l-2 border-amber-500/80 bg-zinc-800 text-white"
                : "border-l-2 border-transparent text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-200"
            }`}
            onClick={() => {
              setGalleryExpanded(false);
              setPagesExpanded(false);
            }}
          >
            <Palette className={`h-5 w-5 shrink-0 ${tab === "theme" ? "text-amber-400" : ""}`} />
            Theme
          </AdminNavLink>
        </nav>
      </div>
      <div className="border-t border-zinc-800 px-4 py-6">
        <p className="text-xs text-zinc-500">Local dev only</p>
      </div>
    </aside>
  );
}
