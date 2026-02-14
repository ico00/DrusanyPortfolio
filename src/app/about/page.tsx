import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/Header";

export default function AboutPage() {
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
          <h1 className="font-serif text-4xl font-normal tracking-tight text-white md:text-5xl lg:text-6xl">
            About
          </h1>
          <div className="mt-12 border-l-2 border-white/20 pl-8">
            <p className="text-lg leading-relaxed text-zinc-400 md:text-xl">
              Photographer focused on natural light and authentic moments.
              I shoot portraits, landscapes and documentary photography.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
