"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect } from "react";
import { DrusanyLogo } from "@/components/Header";
import {
  ArrowLeft,
  Image as ImageIcon,
  FileText,
  BookOpen,
  LayoutDashboard,
  Palette,
  Images,
} from "lucide-react";
import { UnsavedChangesProvider, useUnsavedChanges } from "@/contexts/UnsavedChangesContext";

function NavLink({
  href,
  className,
  children,
  ...rest
}: React.ComponentProps<typeof Link>) {
  const router = useRouter();
  const unsaved = useUnsavedChanges();

  const handleClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
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

function AdminBlogLayoutInner({ children }: { children: React.ReactNode }) {
  const unsaved = useUnsavedChanges();

  useEffect(() => {
    if (!unsaved?.hasUnsavedChanges) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [unsaved?.hasUnsavedChanges]);

  const pathname = usePathname();
  const isMainAdmin = pathname === "/admin" || (pathname?.startsWith("/admin") && !pathname?.startsWith("/admin/blog"));
  const isBlogRoute = pathname?.startsWith("/admin/blog");

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <aside className="fixed left-0 top-0 z-40 flex h-screen w-56 flex-col border-r border-zinc-800 bg-zinc-900">
        <div className="flex flex-col gap-4 border-b border-zinc-800 px-4 py-4">
          <NavLink href="/" className="flex items-center" aria-label="Drusany">
            <DrusanyLogo className="h-8 w-auto" fill="#e4e4e7" />
          </NavLink>
          <div className="flex flex-col gap-1">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Admin</p>
            <NavLink href="/" className="flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-zinc-100">
              <ArrowLeft className="h-4 w-4" />
              Back to site
            </NavLink>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-0.5 px-3">
            <NavLink
              href="/admin"
              className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                isMainAdmin
                  ? "border-l-2 border-amber-500/80 bg-zinc-800 text-white"
                  : "border-l-2 border-transparent text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-200"
              }`}
            >
              <LayoutDashboard className={`h-5 w-5 shrink-0 ${isMainAdmin ? "text-amber-400" : ""}`} />
              Dashboard
            </NavLink>
            <NavLink
              href="/admin"
              className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium transition-colors border-l-2 border-transparent text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-200"
            >
              <ImageIcon className="h-5 w-5 shrink-0" />
              Gallery
            </NavLink>
            <NavLink
              href="/admin"
              className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium transition-colors border-l-2 border-transparent text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-200"
            >
              <FileText className="h-5 w-5 shrink-0" />
              Pages
            </NavLink>
            <NavLink
              href="/admin/blog"
              className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                isBlogRoute
                  ? "border-l-2 border-violet-500/80 bg-zinc-800 text-white"
                  : "border-l-2 border-transparent text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-200"
              }`}
            >
              <BookOpen className={`h-5 w-5 shrink-0 ${isBlogRoute ? "text-violet-400" : ""}`} />
              Blog
            </NavLink>
            <NavLink
              href="/admin?tab=media"
              className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium transition-colors border-l-2 border-transparent text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-200"
            >
              <Images className="h-5 w-5 shrink-0" />
              Media
            </NavLink>
            <NavLink
              href="/admin"
              className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium transition-colors border-l-2 border-transparent text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-200"
            >
              <Palette className="h-5 w-5 shrink-0" />
              Theme
            </NavLink>
          </nav>
        </div>
        <div className="border-t border-zinc-800 px-4 py-3">
          <p className="text-xs text-zinc-500">Local dev only</p>
        </div>
      </aside>
      <main className="ml-56 min-h-screen flex-1">{children}</main>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isBlogRoute = pathname?.startsWith("/admin/blog");

  if (!isBlogRoute) {
    return <>{children}</>;
  }

  return (
    <UnsavedChangesProvider>
      <AdminBlogLayoutInner>{children}</AdminBlogLayoutInner>
    </UnsavedChangesProvider>
  );
}
