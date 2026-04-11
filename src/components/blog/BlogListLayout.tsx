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
  initialCategorySlug,
}: {
  posts: BlogPost[];
  currentPage: number;
  totalPages: number;
  /** Kada je postavljeno (ruta /blog/kategorija/[slug]), filter i OG-friendly URL. */
  initialCategorySlug?: string;
}) {
  return (
    <div className="min-h-screen bg-white">
      <Suspense fallback={<div className="h-16" />}>
        <Header forceLightMode />
      </Suspense>
      <div className="mx-auto max-w-7xl px-6 py-24">
        <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-zinc-50" />}>
          <div className="mb-6 lg:hidden">
            <SearchWidget variant="minimal" />
          </div>
          <div className="flex flex-col gap-12 lg:flex-row lg:gap-16">
            <main className="min-w-0 flex-1">
              <BlogList
                posts={posts}
                currentPage={currentPage}
                totalPages={totalPages}
                initialCategorySlug={initialCategorySlug}
              />
            </main>
            <aside className="w-full shrink-0 lg:w-80">
              <div className="sticky top-24">
                <BlogSidebar posts={posts} />
              </div>
            </aside>
          </div>
        </Suspense>
      </div>
    </div>
  );
}
