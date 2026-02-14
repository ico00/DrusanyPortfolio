import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import AdminClient from "@/components/AdminClient";

export default function AdminPage() {
  if (process.env.NODE_ENV === "production") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-6 text-zinc-400">
        <p className="mb-2 text-center text-lg">
          Admin panel is only available during local development.
        </p>
        <p className="mb-8 text-center text-sm text-zinc-500">
          Run <code className="rounded bg-zinc-800 px-2 py-0.5">npm run dev</code> and visit /admin
        </p>
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg border border-zinc-700 px-4 py-2 text-sm transition-colors hover:border-zinc-600 hover:text-zinc-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to gallery
        </Link>
      </div>
    );
  }

  return <AdminClient />;
}
