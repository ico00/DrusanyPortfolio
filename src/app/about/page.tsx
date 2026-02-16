import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import AboutImage from "@/components/AboutImage";
import PressSection from "@/components/PressSection";
import GearSection from "@/components/GearSection";
import AboutNav from "@/components/AboutNav";
import ProseContent from "@/components/ProseContent";
import { getPages } from "@/lib/pages";
import { getPress } from "@/lib/press";
import { getGear } from "@/lib/gear";

export default async function AboutPage() {
  const [pages, press, gear] = await Promise.all([
    getPages(),
    getPress(),
    getGear(),
  ]);
  const { title, html, quote } = pages.about;

  return (
    <div className="min-h-screen bg-zinc-950">
      <Suspense fallback={<div className="h-16" />}>
        <Header />
      </Suspense>

      <div className="flex flex-col pt-16 lg:flex-row">
        {/* Lijevo – statična slika (fixed na desktopu, uža ~40%) */}
        <aside className="fixed left-0 top-16 bottom-0 hidden w-2/5 lg:block">
          <div className="relative h-full w-full bg-zinc-900">
            <AboutImage src="/about-photo.jpg" />
            {quote && (
              <div className="absolute inset-x-0 bottom-0 p-6 lg:p-8">
                <p className="w-full max-w-full font-serif text-lg italic leading-relaxed text-white/90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] lg:text-xl">
                  &ldquo;{quote}&rdquo;
                </p>
              </div>
            )}
          </div>
        </aside>
        {/* Mobil: slika na vrhu (prije scrollabilnog teksta) */}
        <div className="relative aspect-[4/5] w-full bg-zinc-900 lg:hidden">
          <AboutImage src="/about-photo.jpg" />
          {quote && (
            <div className="absolute inset-x-0 bottom-0 p-6">
              <p className="w-full max-w-full font-serif text-lg italic leading-relaxed text-white/90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                &ldquo;{quote}&rdquo;
              </p>
            </div>
          )}
        </div>

        {/* Desno – scrollabilni tekst */}
        <main className="min-h-screen flex-1 overflow-y-auto lg:ml-[40%]">
          <div className="mx-auto max-w-2xl px-6 py-12 pb-24 md:py-16 md:pb-24 lg:py-20 lg:pb-24">
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
            <ProseContent
              id="about"
              html={html}
              className="prose prose-invert prose-lg max-w-none [&_a]:text-white/80 [&_a]:underline [&_a:hover]:text-white"
            />
            <div id="press">
              <PressSection items={press.items} />
            </div>
            <div id="gear">
              <GearSection items={gear.items} />
            </div>
          </div>
        </main>
        <AboutNav />
      </div>
    </div>
  );
}
