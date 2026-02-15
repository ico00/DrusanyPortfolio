import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import { getPages } from "@/lib/pages";

export default async function AboutPage() {
  const pages = await getPages();
  const { title, html } = pages.about;

  return (
    <div className="min-h-screen bg-zinc-950">
      <Suspense fallback={<div className="h-16" />}>
        <Header />
      </Suspense>
      <main className="pt-16">
        <div className="mx-auto max-w-2xl px-6 py-24 md:py-32 lg:py-40">
          <Link
            href="/"
            className="mb-16 inline-flex items-center gap-2 text-sm font-extralight tracking-[0.2em] text-white/60 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <h1 className="mb-12 font-serif text-4xl font-light tracking-tight text-white md:text-5xl">
            {title}
          </h1>
          <div
            className="prose prose-invert prose-lg max-w-none [&_a]:text-white/80 [&_a]:underline [&_a:hover]:text-white"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </main>
    </div>
  );
}
