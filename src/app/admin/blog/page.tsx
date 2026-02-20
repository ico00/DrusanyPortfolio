import { Suspense } from "react";
import AdminBlogPageClient from "./AdminBlogPageClient";

export default function AdminBlogPage() {
  return (
    <div className="px-8 py-8 lg:px-12 lg:py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Blog</h1>
        <p className="mt-1 text-sm text-zinc-400">Create and manage blog posts</p>
      </div>
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8">
        <Suspense fallback={<div className="flex min-h-[200px] items-center justify-center text-zinc-500">Loading…</div>}>
          <AdminBlogPageClient listOnly />
        </Suspense>
      </div>
    </div>
  );
}
