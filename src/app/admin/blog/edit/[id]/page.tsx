import { getBlog } from "@/lib/blog";
import AdminBlogEditClient from "./AdminBlogEditClient";

export async function generateStaticParams() {
  const { posts } = await getBlog();
  return posts.map((post) => ({ id: post.id }));
}

export default async function AdminBlogEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="px-8 py-8 lg:px-12 lg:py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Edit post</h1>
        <p className="mt-1 text-sm text-zinc-400">Edit blog post</p>
      </div>
      <AdminBlogEditClient id={id} />
    </div>
  );
}
