import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-2xl px-6 py-24">
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
        <p className="mt-8 text-lg leading-relaxed text-zinc-600">
          Uskoro.
        </p>
      </div>
    </div>
  );
}
