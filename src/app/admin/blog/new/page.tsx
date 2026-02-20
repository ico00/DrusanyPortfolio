import AdminBlogNewClient from "./AdminBlogNewClient";

export default function AdminBlogNewPage() {
  return (
    <div className="px-8 py-8 lg:px-12 lg:py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">New post</h1>
        <p className="mt-1 text-sm text-zinc-400">Create new blog post</p>
      </div>
      <AdminBlogNewClient />
    </div>
  );
}
