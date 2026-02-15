import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import blogData from "@/data/blog.json";
import type { BlogPost } from "@/lib/blog";

export default function BlogPage() {
  const posts = (blogData as { posts: BlogPost[] }).posts ?? [];

  return (
    <div className="min-h-screen bg-white">
      <Suspense fallback={<div className="h-16" />}>
        <Header />
      </Suspense>
      <div className="mx-auto max-w-2xl px-6 py-24">
        <Link
          href="/"
          className="mb-12 inline-flex items-center gap-2 text-sm font-extralight tracking-widest text-zinc-600 transition-colors hover:text-zinc-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <h1 className="font-serif text-3xl font-normal tracking-tight text-zinc-900 md:text-4xl">
          Blog
        </h1>
        {posts.length === 0 ? (
          <p className="mt-8 text-lg leading-relaxed text-zinc-600">
            Coming soon.
          </p>
        ) : (
          <ul className="mt-12 space-y-8">
            {posts.map((post) => (
              <li key={post.id}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="group block rounded-lg border border-zinc-200/60 p-6 transition-colors hover:border-zinc-300 hover:bg-zinc-50/50"
                >
                  {post.thumbnail && (
                    <div className="mb-4 aspect-video overflow-hidden rounded-lg bg-zinc-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={post.thumbnail}
                        alt=""
                        className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
                      />
                    </div>
                  )}
                  <h2 className="font-serif text-xl font-normal text-zinc-900 group-hover:text-zinc-700">
                    {post.title}
                  </h2>
                  <p className="mt-2 text-sm text-zinc-500">{post.date}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
