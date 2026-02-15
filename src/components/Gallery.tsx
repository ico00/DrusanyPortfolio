"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Camera } from "lucide-react";
import type { GalleryImage } from "@/lib/getGallery";
import { VENUES } from "./VenueSelect";
import { SPORTS } from "./SportSelect";
import { FOOD_DRINK } from "./FoodDrinkSelect";

function normalizeCategory(cat: string): string {
  return cat
    .toLowerCase()
    .replace(/\s*&\s*/g, "-")
    .replace(/\s+/g, "-");
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.02,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const SWIPE_THRESHOLD = 50;

const BREAKPOINTS = [640, 768, 1024] as const;

function useColumnCount(): number {
  const [cols, setCols] = useState(4);
  useEffect(() => {
    const getCols = (w: number) => {
      if (w < BREAKPOINTS[0]) return 1;
      if (w < BREAKPOINTS[1]) return 2;
      if (w < BREAKPOINTS[2]) return 3;
      return 4;
    };
    const update = () => setCols(getCols(window.innerWidth));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return cols;
}

interface GalleryProps {
  images: GalleryImage[];
}

function normalizeVenue(v: string): string {
  return v.toLowerCase().replace(/\s+/g, "-").replace(/[čć]/g, "c").replace(/[š]/g, "s").replace(/[ž]/g, "z");
}

function normalizeSport(s: string): string {
  return s.toLowerCase().replace(/\s+/g, "-").replace(/[čć]/g, "c").replace(/[š]/g, "s").replace(/[ž]/g, "z");
}

export default function Gallery({ images }: GalleryProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const categorySlug = searchParams.get("category");
  const venueSlug = searchParams.get("venue");
  const sportSlug = searchParams.get("sport");
  const foodDrinkSlug = searchParams.get("foodDrink");
  const imageSlug = searchParams.get("image");
  const searchQuery = searchParams.get("q") ?? "";
  const columnCount = useColumnCount();

  useEffect(() => {
    if (categorySlug) {
      const t = setTimeout(() => window.scrollTo(0, 0), 50);
      return () => clearTimeout(t);
    }
  }, [categorySlug, venueSlug, sportSlug, foodDrinkSlug]);

  const filteredImages = useMemo(() => {
    if (!categorySlug) return images;
    const slug = categorySlug.toLowerCase();
    let result = images.filter(
      (img) => normalizeCategory(img.category) === slug
    );
    if (slug === "concerts" && venueSlug) {
      const v = venueSlug.toLowerCase();
      result = result.filter(
        (img) => img.venue && normalizeVenue(img.venue) === v
      );
    }
    if (slug === "sport" && sportSlug) {
      const s = sportSlug.toLowerCase();
      result = result.filter(
        (img) => img.sport && normalizeSport(img.sport) === s
      );
    }
    if (slug === "food-drink" && foodDrinkSlug) {
      const fd = foodDrinkSlug.toLowerCase();
      result = result.filter(
        (img) => (img as { foodDrink?: string }).foodDrink === fd
      );
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((img) => {
        const title = (img.title || "").toLowerCase();
        const alt = (img.alt || "").toLowerCase();
        const keywords = (img.keywords || "").toLowerCase();
        const venueLabel = img.venue
          ? (VENUES.find((v) => normalizeVenue(v.slug) === normalizeVenue(img.venue!))?.label ?? img.venue).toLowerCase()
          : "";
        const sportLabel = img.sport
          ? (SPORTS.find((s) => normalizeSport(s.slug) === normalizeSport(img.sport!))?.label ?? img.sport).toLowerCase()
          : "";
        const foodDrinkLabel = (img as { foodDrink?: string }).foodDrink
          ? (FOOD_DRINK.find((fd) => fd.slug === (img as { foodDrink?: string }).foodDrink)?.label ?? "").toLowerCase()
          : "";
        const category = (img.category || "").toLowerCase();
        return (
          title.includes(q) ||
          alt.includes(q) ||
          keywords.includes(q) ||
          venueLabel.includes(q) ||
          sportLabel.includes(q) ||
          foodDrinkLabel.includes(q) ||
          category.includes(q)
        );
      });
    }
    return result;
  }, [images, categorySlug, venueSlug, sportSlug, foodDrinkSlug, searchQuery]);

  const imageColumns = useMemo(() => {
    const cols: GalleryImage[][] = Array.from({ length: columnCount }, () => []);
    const heights: number[] = Array.from({ length: columnCount }, () => 0);
    filteredImages.forEach((img) => {
      const aspectRatio = img.width > 0 ? img.height / img.width : 1;
      const shortestIdx = heights.indexOf(Math.min(...heights));
      cols[shortestIdx].push(img);
      heights[shortestIdx] += aspectRatio;
    });
    return cols;
  }, [filteredImages, columnCount]);

  const isConcerts = categorySlug?.toLowerCase() === "concerts";
  const isSport = categorySlug?.toLowerCase() === "sport";
  const isFoodDrink = categorySlug?.toLowerCase() === "food-drink";

  const imagesBeforeSearch = useMemo(() => {
    if (!categorySlug) return images;
    const slug = categorySlug.toLowerCase();
    let result = images.filter(
      (img) => normalizeCategory(img.category) === slug
    );
    if (slug === "concerts" && venueSlug) {
      const v = venueSlug.toLowerCase();
      result = result.filter(
        (img) => img.venue && normalizeVenue(img.venue) === v
      );
    }
    if (slug === "sport" && sportSlug) {
      const s = sportSlug.toLowerCase();
      result = result.filter(
        (img) => img.sport && normalizeSport(img.sport) === s
      );
    }
    if (slug === "food-drink" && foodDrinkSlug) {
      const fd = foodDrinkSlug.toLowerCase();
      result = result.filter(
        (img) => (img as { foodDrink?: string }).foodDrink === fd
      );
    }
    return result;
  }, [images, categorySlug, venueSlug, sportSlug, foodDrinkSlug]);

  const isSearchEmpty = searchQuery.trim() && imagesBeforeSearch.length > 0 && filteredImages.length === 0;

  const venuesWithImages = useMemo(() => {
    if (!isConcerts) return [];
    const concerts = images.filter(
      (img) => normalizeCategory(img.category) === "concerts"
    );
    const venueSlugsPresent = new Set(
      concerts
        .filter((img) => img.venue)
        .map((img) => normalizeVenue(img.venue!))
    );
    return VENUES.filter((v) => venueSlugsPresent.has(v.slug));
  }, [images, isConcerts]);

  const sportsWithImages = useMemo(() => {
    if (!isSport) return [];
    const sportImages = images.filter(
      (img) => normalizeCategory(img.category) === "sport"
    );
    const sportSlugsPresent = new Set(
      sportImages
        .filter((img) => img.sport)
        .map((img) => normalizeSport(img.sport!))
    );
    return SPORTS.filter((s) => sportSlugsPresent.has(s.slug));
  }, [images, isSport]);

  const foodDrinkWithImages = useMemo(() => {
    if (!isFoodDrink) return [];
    const fdImages = images.filter(
      (img) => normalizeCategory(img.category) === "food-drink"
    );
    const fdSlugsPresent = new Set(
      fdImages
        .filter((img) => (img as { foodDrink?: string }).foodDrink)
        .map((img) => (img as { foodDrink?: string }).foodDrink!)
    );
    return FOOD_DRINK.filter((fd) => fdSlugsPresent.has(fd.slug));
  }, [images, isFoodDrink]);

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [showCopyright, setShowCopyright] = useState(false);
  const [showExif, setShowExif] = useState(false);
  const touchStartX = useRef<number>(0);

  const lightboxImage = useMemo(
    () => (lightboxIndex !== null ? filteredImages[lightboxIndex] ?? null : null),
    [lightboxIndex, filteredImages]
  );

  const updateUrlWithImage = useCallback(
    (slug: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (slug) {
        params.set("image", slug);
      } else {
        params.delete("image");
      }
      const q = params.toString();
      router.replace(q ? `${pathname}?${q}#gallery` : `${pathname}#gallery`, { scroll: false });
    },
    [searchParams, router, pathname]
  );

  const openLightbox = useCallback(
    (img: GalleryImage) => {
      const idx = filteredImages.findIndex((i) => i.id === img.id);
      setLightboxIndex(idx >= 0 ? idx : 0);
    },
    [filteredImages]
  );

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  const goPrev = useCallback(() => {
    setLightboxIndex((i) => {
      if (i === null || i <= 0) return i;
      return i - 1;
    });
  }, []);

  const goNext = useCallback(() => {
    setLightboxIndex((i) => {
      if (i === null || i >= filteredImages.length - 1) return i;
      return i + 1;
    });
  }, [filteredImages.length]);

  const hasPrev = lightboxIndex !== null && lightboxIndex > 0;
  const hasNext = lightboxIndex !== null && lightboxIndex < filteredImages.length - 1;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const deltaX = e.changedTouches[0].clientX - touchStartX.current;
      if (deltaX > SWIPE_THRESHOLD && hasPrev) goPrev();
      else if (deltaX < -SWIPE_THRESHOLD && hasNext) goNext();
    },
    [hasPrev, hasNext, goPrev, goNext]
  );

  useEffect(() => {
    if (imageSlug && filteredImages.length > 0) {
      const idx = filteredImages.findIndex((img) => img.slug === imageSlug);
      if (idx >= 0) setLightboxIndex(idx);
    }
  }, [imageSlug, filteredImages]);

  useEffect(() => {
    if (lightboxIndex === null) {
      setShowCopyright(false);
      setShowExif(false);
    }
  }, [lightboxIndex]);

  useEffect(() => {
    const slug = lightboxIndex === null ? null : (filteredImages[lightboxIndex]?.slug ?? null);
    if (imageSlug === slug) return;
    const params = new URLSearchParams(searchParams.toString());
    if (slug) params.set("image", slug);
    else params.delete("image");
    const q = params.toString();
    router.replace(q ? `${pathname}?${q}#gallery` : `${pathname}#gallery`, { scroll: false });
  }, [lightboxIndex, filteredImages, imageSlug, searchParams, pathname, router]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (lightboxIndex === null) return;
      if (e.key === "ArrowLeft" && hasPrev) goPrev();
      if (e.key === "ArrowRight" && hasNext) goNext();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [closeLightbox, lightboxIndex, hasPrev, hasNext, goPrev, goNext]);

  useEffect(() => {
    if (lightboxImage) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [lightboxImage]);

  if (filteredImages.length === 0 && !isSearchEmpty) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center py-24 text-center">
        <p className="text-lg text-zinc-500">
          {categorySlug
            ? `No images in category "${categorySlug}".`
            : "Gallery is empty."}
        </p>
        <p className="mt-2 text-sm text-zinc-400">
          {categorySlug ? (
            <a href="/#gallery" className="underline hover:text-zinc-600">
              View all images
            </a>
          ) : (
            <>
              Add images via the{" "}
              <a href="/admin" className="underline hover:text-zinc-600">
                admin panel
              </a>
              .
            </>
          )}
        </p>
      </div>
    );
  }

  return (
    <div id="gallery">
      {categorySlug && (
        <div className="mb-8 flex flex-wrap items-center gap-8">
          {isConcerts && (
            <>
              <span className="text-xs font-extralight tracking-widest text-zinc-500">
                Venue:
              </span>
              <Link
                href={`/?category=concerts#gallery`}
                className={`inline-block pb-1 text-xs font-extralight tracking-widest transition-[color,border-color] duration-200 ${
                  !venueSlug
                    ? "border-b border-zinc-900 text-zinc-900"
                    : "border-b border-transparent text-zinc-600 hover:border-zinc-900 hover:text-zinc-900"
                }`}
              >
                All
              </Link>
              {venuesWithImages.map((v) => (
                <Link
                  key={v.slug}
                  href={`/?category=concerts&venue=${v.slug}#gallery`}
                  className={`inline-block pb-1 text-xs font-extralight tracking-widest transition-[color,border-color] duration-200 ${
                    venueSlug === v.slug
                      ? "border-b border-zinc-900 text-zinc-900"
                      : "border-b border-transparent text-zinc-600 hover:border-zinc-900 hover:text-zinc-900"
                  }`}
                >
                  {v.label}
                </Link>
              ))}
            </>
          )}
          {isSport && (
            <>
              <span className="text-xs font-extralight tracking-widest text-zinc-500">
                Sport:
              </span>
              <Link
                href={`/?category=sport#gallery`}
                className={`inline-block pb-1 text-xs font-extralight tracking-widest transition-[color,border-color] duration-200 ${
                  !sportSlug
                    ? "border-b border-zinc-900 text-zinc-900"
                    : "border-b border-transparent text-zinc-600 hover:border-zinc-900 hover:text-zinc-900"
                }`}
              >
                All
              </Link>
              {sportsWithImages.map((s) => (
                <Link
                  key={s.slug}
                  href={`/?category=sport&sport=${s.slug}#gallery`}
                  className={`inline-block pb-1 text-xs font-extralight tracking-widest transition-[color,border-color] duration-200 ${
                    sportSlug === s.slug
                      ? "border-b border-zinc-900 text-zinc-900"
                      : "border-b border-transparent text-zinc-600 hover:border-zinc-900 hover:text-zinc-900"
                  }`}
                >
                  {s.label}
                </Link>
              ))}
            </>
          )}
          {isFoodDrink && (
            <>
              <span className="text-xs font-extralight tracking-widest text-zinc-500">
                Type:
              </span>
              <Link
                href={`/?category=food-drink#gallery`}
                className={`inline-block pb-1 text-xs font-extralight tracking-widest transition-[color,border-color] duration-200 ${
                  !foodDrinkSlug
                    ? "border-b border-zinc-900 text-zinc-900"
                    : "border-b border-transparent text-zinc-600 hover:border-zinc-900 hover:text-zinc-900"
                }`}
              >
                All
              </Link>
              {foodDrinkWithImages.map((fd) => (
                <Link
                  key={fd.slug}
                  href={`/?category=food-drink&foodDrink=${fd.slug}#gallery`}
                  className={`inline-block pb-1 text-xs font-extralight tracking-widest transition-[color,border-color] duration-200 ${
                    foodDrinkSlug === fd.slug
                      ? "border-b border-zinc-900 text-zinc-900"
                      : "border-b border-transparent text-zinc-600 hover:border-zinc-900 hover:text-zinc-900"
                  }`}
                >
                  {fd.label}
                </Link>
              ))}
            </>
          )}
        </div>
      )}
      <motion.div
        className="grid gap-2 sm:gap-4"
        style={{ gridTemplateColumns: `repeat(${columnCount}, 1fr)` }}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {imageColumns.map((column, colIndex) => (
          <div key={colIndex} className="flex flex-col gap-2 sm:gap-4">
            <AnimatePresence mode="sync">
              {column.map((img) => (
                <motion.div
                  key={img.id}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="overflow-hidden"
                >
            <button
              type="button"
              data-cursor-hover
              data-cursor-aperture
              onClick={() => openLightbox(img)}
              className="group relative block w-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2"
            >
              <div className="overflow-hidden">
                <img
                  src={img.thumb ?? img.src}
                  alt={img.alt || img.title || "Gallery image"}
                  width={img.width}
                  height={img.height}
                  loading="lazy"
                  decoding="async"
                  className="h-auto w-full object-cover transition-[transform] duration-700 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:scale-[1.03]"
                  style={{ aspectRatio: `${img.width} / ${img.height}` }}
                />
              </div>
              <div className="absolute inset-0 bg-black/0 transition-colors duration-500 ease-out group-hover:bg-black/30" />
              {!["interiors", "animals"].includes(categorySlug?.toLowerCase() ?? "") &&
                (img.title || img.venue || img.sport || img.capturedAt || img.createdAt) && (
                <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-4 text-white">
                  {(img.title || img.venue || img.sport) && (
                    <p className="translate-y-2.5 text-sm opacity-0 transition-all duration-500 ease-out group-hover:-translate-y-[10px] group-hover:opacity-100">
                      {img.sport && !img.venue ? (
                        <>
                          {SPORTS.find((s) => normalizeSport(s.slug) === normalizeSport(img.sport!))?.label ?? img.sport}
                          {(img.title || img.alt) && (
                            <>
                              {" "}
                              <span className="text-white/80">//</span>{" "}
                              {img.title || img.alt}
                            </>
                          )}
                        </>
                      ) : (
                        <>
                          {img.title}
                          {img.venue && (
                            <>
                              {img.title ? " " : ""}
                              <span className="text-white/80">@</span>{" "}
                              {VENUES.find((v) => normalizeVenue(v.slug) === normalizeVenue(img.venue!))?.label ?? img.venue}
                            </>
                          )}
                        </>
                      )}
                    </p>
                  )}
                  {categorySlug?.toLowerCase() !== "food-drink" &&
                    (img.capturedAt || img.createdAt) && (
                    <p className="translate-y-2.5 text-xs text-white/70 opacity-0 transition-all duration-500 ease-out group-hover:-translate-y-[10px] group-hover:opacity-100">
                      {new Date(img.capturedAt || img.createdAt!).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  )}
                </div>
              )}
            </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ))}
      </motion.div>

      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="group fixed inset-0 z-[100] flex flex-col bg-zinc-950"
            data-cursor-aperture
            onClick={closeLightbox}
          >
            <div className="absolute left-0 right-0 top-0 z-20 flex items-center px-6 py-6 md:px-12">
              <div className="flex-1" />
              {filteredImages.length > 1 && (
                <p className="text-[10px] font-medium tracking-[0.3em] text-white/60">
                  {lightboxIndex !== null && lightboxIndex + 1} / {filteredImages.length}
                </p>
              )}
              <div className="flex flex-1 items-center justify-end gap-1">
                {(lightboxImage.camera ||
                  lightboxImage.lens ||
                  lightboxImage.exposure ||
                  lightboxImage.aperture ||
                  lightboxImage.iso != null) && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowExif((v) => !v);
                    }}
                    className={`flex h-10 w-10 shrink-0 items-center justify-center transition-colors ${
                      showExif ? "text-white" : "text-white/50 hover:text-white/80"
                    }`}
                    aria-label={showExif ? "Sakrij EXIF" : "Prikaži EXIF"}
                  >
                    <Camera className="h-5 w-5" strokeWidth={1.5} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeLightbox();
                  }}
                  className="flex h-10 w-10 shrink-0 items-center justify-center text-white/70 transition-all duration-200 hover:text-white"
                  aria-label="Close"
                >
                  <X className="h-6 w-6" strokeWidth={1.5} />
                </button>
              </div>
            </div>

            {hasPrev && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goPrev();
                }}
                className="absolute left-2 top-1/2 z-20 hidden -translate-y-1/2 p-2 text-white/30 transition-all duration-300 hover:scale-110 hover:text-white md:left-4 md:flex"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-12 w-12 md:h-14 md:w-14" strokeWidth={1.5} />
              </button>
            )}
            {hasNext && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goNext();
                }}
                className="absolute right-2 top-1/2 z-20 hidden -translate-y-1/2 p-2 text-white/30 transition-all duration-300 hover:scale-110 hover:text-white md:right-4 md:flex"
                aria-label="Next image"
              >
                <ChevronRight className="h-12 w-12 md:h-14 md:w-14" strokeWidth={1.5} />
              </button>
            )}

            <motion.div
              key={lightboxImage.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="relative z-10 flex min-h-0 flex-1 items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <div
                className="flex h-[100vh] shrink-0 items-center justify-center"
                style={{ maxWidth: "min(95vw, 2048px)" }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setShowCopyright(true);
                }}
              >
                <img
                  src={lightboxImage.src}
                  alt={lightboxImage.alt || lightboxImage.title || "Gallery image"}
                  className="max-h-full max-w-full select-none object-contain pointer-events-none"
                  draggable={false}
                />
              </div>

              <AnimatePresence>
                {showCopyright && (
                  <div
                    className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4"
                    onClick={() => setShowCopyright(false)}
                  >
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="max-w-sm rounded-xl border border-zinc-700 bg-zinc-900 px-6 py-5 text-center shadow-xl"
                      onClick={(e) => e.stopPropagation()}
                    >
                    <p className="text-sm font-medium text-zinc-200">
                      © All rights reserved
                    </p>
                    <p className="mt-2 text-xs text-zinc-500">
                      These images are protected by copyright. Downloading, copying, or distributing without permission is prohibited.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowCopyright(false)}
                      className="mt-4 rounded-lg bg-zinc-700 px-4 py-2 text-sm text-zinc-200 transition-colors hover:bg-zinc-600"
                    >
                      OK
                    </button>
                  </motion.div>
                </div>
                )}
              </AnimatePresence>

              <div
                className="absolute bottom-0 left-0 right-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.85)_0%,rgba(0,0,0,0.4)_25%,rgba(0,0,0,0.1)_50%,transparent_100%)] pb-10 pt-32 md:pb-12 md:pt-36"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mx-auto max-w-2xl px-6 text-center md:px-12">
                  {((!["interiors", "animals"].includes(categorySlug?.toLowerCase() ?? "") &&
                    (lightboxImage.title || lightboxImage.venue || lightboxImage.sport || lightboxImage.capturedAt || lightboxImage.createdAt)) ||
                    (showExif &&
                      (lightboxImage.camera ||
                        lightboxImage.lens ||
                        lightboxImage.exposure ||
                        lightboxImage.aperture ||
                        lightboxImage.iso != null))) && (
                    <div className="inline-block rounded-lg border border-white/10 bg-black/50 px-4 py-2 backdrop-blur-sm">
                      {!["interiors", "animals"].includes(categorySlug?.toLowerCase() ?? "") &&
                        (lightboxImage.title || lightboxImage.venue || lightboxImage.sport || lightboxImage.capturedAt || lightboxImage.createdAt) && (
                        <p className="text-[14px] font-medium leading-relaxed tracking-[0.15em] text-white/80">
                          {lightboxImage.title}
                          {lightboxImage.venue && (
                            <>
                              {lightboxImage.title ? " " : ""}
                              <span className="text-white/70">@</span>{" "}
                              {VENUES.find((v) => v.slug === lightboxImage.venue)?.label ?? lightboxImage.venue}
                            </>
                          )}
                          {lightboxImage.sport && !lightboxImage.venue && (
                            <>
                              {lightboxImage.title ? " " : ""}
                              <span className="text-white/70">@</span>{" "}
                              {SPORTS.find((s) => s.slug === lightboxImage.sport)?.label ?? lightboxImage.sport}
                            </>
                          )}
                          {categorySlug?.toLowerCase() !== "food-drink" &&
                            (lightboxImage.capturedAt || lightboxImage.createdAt) && (
                            <>
                              {(lightboxImage.venue || lightboxImage.sport) ? ", " : ""}
                              <span className="text-white/80">
                                {new Date(lightboxImage.capturedAt || lightboxImage.createdAt!).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })}
                              </span>
                            </>
                          )}
                        </p>
                      )}
                      {showExif &&
                        (lightboxImage.camera ||
                          lightboxImage.lens ||
                          lightboxImage.exposure ||
                          lightboxImage.aperture ||
                          lightboxImage.iso != null) && (
                          <p className={`text-[10px] font-medium tracking-[0.2em] text-white/80 ${!["interiors", "animals"].includes(categorySlug?.toLowerCase() ?? "") && (lightboxImage.title || lightboxImage.venue || lightboxImage.sport || lightboxImage.capturedAt || lightboxImage.createdAt) ? "mt-1" : ""}`}>
                            {[
                              lightboxImage.camera,
                              lightboxImage.lens,
                              lightboxImage.exposure,
                              lightboxImage.aperture,
                              lightboxImage.iso != null ? `ISO ${lightboxImage.iso}` : null,
                            ]
                              .filter(Boolean)
                              .join("  |  ")}
                          </p>
                        )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
