import { Suspense } from "react";
import Header from "@/components/Header";
import BlogList from "@/components/BlogList";
import BlogSidebar from "@/components/blog/BlogSidebar";
import SearchWidget from "@/components/blog/SearchWidget";
import type { BlogPost } from "@/lib/blog";

export default function BlogListLayout({
  posts,
  currentPage,
  totalPages,
  title = "Blog",
}: {
  posts: BlogPost[];
  currentPage: number;
  totalPages: number;
  title?: string;
}) {
  return (
    <div className="min-h-screen bg-white">
      <Suspense fallback={<div className="h-16" />}>
        <Header />
      </Suspense>
      <div className="mx-auto max-w-7xl px-6 py-24">
        {/* Mobile: search na vrhu – vizual kao na gallery (donja crta, bez okvira) */}
        <div className="mb-6 lg:hidden">
          <Suspense fallback={<div className="h-12 animate-pulse rounded border-b border-zinc-200" />}>
            <SearchWidget variant="minimal" />
          </Suspense>
        </div>
        <div className="flex flex-col gap-12 lg:flex-row lg:gap-16">
          <main className="min-w-0 flex-1">
            <h1 className="theme-page-title font-normal tracking-tight">
              {title}
            </h1>
            <Suspense fallback={<p className="mt-8 text-zinc-500">Učitavanje…</p>}>
              <BlogList
                posts={posts}
                currentPage={currentPage}
                totalPages={totalPages}
              />
            </Suspense>
          </main>
          <aside className="w-full shrink-0 lg:w-80">
            <div className="sticky top-24">
              <BlogSidebar posts={posts} />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
