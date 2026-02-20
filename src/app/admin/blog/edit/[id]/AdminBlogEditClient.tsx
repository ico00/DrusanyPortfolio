"use client";

import AdminBlog from "@/components/AdminBlog";

export default function AdminBlogEditClient({ id }: { id: string }) {
  return <AdminBlog formOnly editId={id} />;
}
