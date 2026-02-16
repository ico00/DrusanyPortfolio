import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import ProseContent from "@/components/ProseContent";
import blogData from "../../../data/blog.json";

export function generateStaticParams() {
  const posts = (blogData as { posts: { slug: string }[] }).posts ?? [];
  return posts.length > 0 ? posts.map((p) => ({ slug: p.slug })) : [{ slug: "_" }];
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const posts = (blogData as { posts: { slug: string; title: string; date: string; thumbnail?: string; body: string }[] })
    .posts ?? [];
  const post = posts.find((p) => p.slug === slug);
  if (!post) {
    if (slug === "_") {
      return (
        <div className="min-h-screen bg-white">
          <Suspense fallback={<div className="h-16" />}>
            <Header />
          </Suspense>
          <article className="mx-auto max-w-2xl px-6 py-24">
            <Link
              href="/blog"
              className="mb-12 inline-flex items-center gap-2 text-sm font-extralight tracking-widest text-zinc-600 transition-colors hover:text-zinc-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Blog
            </Link>
            <p className="text-lg text-zinc-600">Coming soon.</p>
          </article>
        </div>
      );
    }
    notFound();
  }

  return (
    <div className="min-h-screen bg-white">
      <Suspense fallback={<div className="h-16" />}>
        <Header />
      </Suspense>
      <article className="mx-auto max-w-2xl px-6 py-24">
        <Link
          href="/blog"
          className="mb-12 inline-flex items-center gap-2 text-sm font-extralight tracking-widest text-zinc-600 transition-colors hover:text-zinc-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Blog
        </Link>
        {post.thumbnail && (
          <div className="mb-8 aspect-video overflow-hidden rounded-lg bg-zinc-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.thumbnail}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
        )}
        <header className="mb-8">
          <h1 className="font-serif text-3xl font-normal tracking-tight text-zinc-900 md:text-4xl">
            {post.title}
          </h1>
          <time
            dateTime={post.date}
            className="mt-2 block text-sm text-zinc-500"
          >
            {post.date}
          </time>
        </header>
        <ProseContent
          html={post.body}
          className="prose prose-zinc max-w-none prose-headings:font-serif prose-a:text-zinc-600 prose-a:underline prose-a:hover:text-zinc-900"
        />
      </article>
    </div>
  );
}
