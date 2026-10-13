import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ProseContent from "@/components/ProseContent";
import BlogGallery from "@/components/BlogGallery";
import { getBlog, getBlogPostById } from "@/lib/blog";
import { formatBlogDate, getDisplayCategories, getShortCategoryLabel } from "@/data/blogCategories";

export async function generateStaticParams() {
  const { posts } = await getBlog();
  return posts.map((post) => ({ id: post.id }));
}

export default async function AdminBlogPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getBlogPostById(id);

  if (!post) notFound();

  const categories = getDisplayCategories(post);

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <article className="mx-auto max-w-4xl px-6 py-12">
        <Link
          href={`/admin/blog/edit/${post.id}`}
          className="mb-8 inline-flex items-center gap-2 text-sm text-zinc-600 transition-colors hover:text-zinc-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Natrag na uređivanje
        </Link>

        <div className="mb-6 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
          Admin preview (draft/published)
        </div>

        <h1 className="mb-2 font-serif text-4xl tracking-tight">{post.title}</h1>
        <p className="mb-8 text-sm text-zinc-500">
          {formatBlogDate(post.date)}
          {post.time ? ` · ${post.time}` : ""}
          {categories.length > 0
            ? ` · ${categories.map((slug) => getShortCategoryLabel(slug)).join(", ")}`
            : ""}
          {post.status === "draft" ? " · Draft" : " · Published"}
        </p>

        {post.thumbnail ? (
          <div className="mb-10 overflow-hidden rounded-xl bg-zinc-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.thumbnail}
              alt=""
              className="h-auto w-full object-cover"
              style={{ objectPosition: post.thumbnailFocus || "50% 50%" }}
            />
          </div>
        ) : null}

        <ProseContent
          html={post.body || ""}
          className="prose prose-zinc max-w-none prose-headings:font-serif"
        />

        {post.galleryImages && post.galleryImages.length > 0 ? (
          <div className="mt-12">
            <BlogGallery images={post.galleryImages} />
          </div>
        ) : null}
      </article>
    </div>
  );
}
