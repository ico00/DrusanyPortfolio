import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import { getBlog } from "@/lib/blog";
import BlogList from "@/components/BlogList";
import type { BlogPost } from "@/lib/blog";

export default async function BlogPage() {
  const { posts } = await getBlog();

  return (
    <div className="min-h-screen bg-white">
      <Suspense fallback={<div className="h-16" />}>
        <Header />
      </Suspense>
      <div className="mx-auto max-w-4xl px-6 py-24">
        <Link
          href="/"
          className="mb-12 inline-flex items-center gap-2 text-sm font-extralight tracking-widest text-zinc-600 transition-colors hover:text-zinc-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Natrag
        </Link>
        <h1 className="font-serif text-3xl font-normal tracking-tight text-zinc-900 md:text-4xl">
          Blog
        </h1>
        <Suspense fallback={<p className="mt-8 text-zinc-500">Učitavanje…</p>}>
          <BlogList posts={posts as BlogPost[]} />
        </Suspense>
      </div>
    </div>
  );
}
