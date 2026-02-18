"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { GalleryImage } from "@/lib/getGallery";
import { VENUES } from "./VenueSelect";

const SLIDES = [
  { label: "Concerts", slug: "concerts" },
  { label: "Sport", slug: "sport" },
  { label: "Animals", slug: "animals" },
  { label: "Interiors", slug: "interiors" },
  { label: "Zagreb", slug: "zagreb" },
  { label: "Food & Drink", slug: "food-drink" },
] as const;

function normalizeCategory(cat: string): string {
  return cat
    .toLowerCase()
    .replace(/\s*&\s*/g, "-")
    .replace(/\s+/g, "-");
}

function getHeroImageForCategory(
  images: GalleryImage[],
  slug: string
): GalleryImage | null {
  const normalized = slug.toLowerCase();
  const inCategory = images.filter(
    (img) => normalizeCategory(img.category) === normalized
  );
  return inCategory.find((img) => img.isHero) ?? null;
}

interface HeroSliderProps {
  images: GalleryImage[];
}

export default function HeroSlider({ images }: HeroSliderProps) {
  const [current, setCurrent] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const slideData = SLIDES.map((s) => ({
    ...s,
    image: getHeroImageForCategory(images, s.slug),
  }));

  const goTo = useCallback(
    (index: number) => setCurrent((Math.max(0, index) + SLIDES.length) % SLIDES.length),
    []
  );

  const goNext = useCallback(() => goTo(current + 1), [current, goTo]);
  const goPrev = useCallback(() => goTo(current - 1), [current, goTo]);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > 30) {
        e.preventDefault();
        if (e.deltaY > 0) goNext();
        else goPrev();
      }
    };
    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [goNext, goPrev]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goPrev, goNext]);

  useEffect(() => {
    const interval = setInterval(() => goNext(), 4000);
    return () => clearInterval(interval);
  }, [goNext]);

  const handleTouchStart = (e: React.TouchEvent) =>
    setTouchStart(e.touches[0].clientY);
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientY;
    if (Math.abs(diff) > 50) diff > 0 ? goNext() : goPrev();
    setTouchStart(null);
  };

  const slide = slideData[current];
  const heroImg = slide.image;

  return (
    <div
      className="relative h-screen w-full overflow-hidden bg-zinc-950"
      data-cursor-aperture
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="absolute inset-0"
        >
          {heroImg ? (
            <img
              src={heroImg.src}
              alt={heroImg.alt || slide.label}
              className="h-full w-full object-cover"
              style={{
                objectPosition: heroImg.thumbnailFocus || "50% 50%",
              }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-zinc-900">
              <span className="text-4xl font-serif text-white/30">
                {slide.label}
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-zinc-950/50" />
        </motion.div>
      </AnimatePresence>

      <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between p-8 md:p-12 lg:p-16">
        <div className="flex flex-1 flex-col justify-center">
          <h2 className="font-serif text-5xl font-bold tracking-tight text-white md:text-7xl lg:text-8xl">
            {slide.label.toUpperCase()}
          </h2>
          {(heroImg?.title || heroImg?.venue) && (
            <p className="mt-4 max-w-md text-lg text-white/80 md:text-xl">
              {heroImg.title}
              {heroImg.venue && (
                <>
                  {heroImg.title ? " " : ""}
                  <span className="text-white/70">@</span>{" "}
                  {VENUES.find((v) => v.slug === heroImg.venue)?.label ?? heroImg.venue}
                </>
              )}
            </p>
          )}
          {!["animals", "interiors", "food-drink"].includes(slide.slug) &&
            (heroImg?.capturedAt || heroImg?.createdAt) && (
              <p className="mt-2 text-sm text-white/60">
                {new Date(
                  heroImg.capturedAt || heroImg.createdAt || ""
                ).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            )}

          <Link
            href={`/?category=${slide.slug}#gallery`}
            className="pointer-events-auto mt-10 inline-flex w-fit items-center gap-2 text-white transition-opacity hover:opacity-80"
          >
            <span className="text-sm font-medium tracking-widest">
              View Gallery
            </span>
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>

        <div className="flex items-end justify-end">
          <div className="pointer-events-auto flex items-center gap-4">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                goPrev();
              }}
              className="text-white/70 transition-colors hover:text-white"
              aria-label="Previous"
            >
              <span className="text-sm tracking-widest">←</span>
            </button>
            <span className="font-mono text-sm text-white/80">
              {String(current + 1).padStart(2, "0")} — {String(SLIDES.length).padStart(2, "0")}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                goNext();
              }}
              className="text-white/70 transition-colors hover:text-white"
              aria-label="Next"
            >
              <span className="text-sm tracking-widest">→</span>
            </button>
          </div>
        </div>
      </div>

      <Link
        href={`/?category=${slide.slug}#gallery`}
        className="absolute inset-0 z-10"
        aria-label={`View ${slide.label} gallery`}
      />
    </div>
  );
}
