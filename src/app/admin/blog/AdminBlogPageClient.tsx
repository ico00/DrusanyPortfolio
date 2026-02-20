"use client";

import { useRouter, useSearchParams } from "next/navigation";
import AdminBlog from "@/components/AdminBlog";

export default function AdminBlogPageClient({
  listOnly,
}: {
  listOnly: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filter = searchParams.get("filter");
  const contentHealthFilter = (filter === "no-seo" || filter === "no-featured" ? filter : "") as "" | "no-seo" | "no-featured";
  const onClearContentHealthFilter = () => {
    router.push("/admin/blog");
  };
  return (
    <AdminBlog
      listOnly={listOnly}
      contentHealthFilter={contentHealthFilter}
      onClearContentHealthFilter={onClearContentHealthFilter}
    />
  );
}
