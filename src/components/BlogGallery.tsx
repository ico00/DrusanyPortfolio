"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Camera } from "lucide-react";
import type { BlogGalleryImage } from "@/lib/blog";

const COPYRIGHT_START = 2026;

function getCopyrightYear(): string {
  const current = new Date().getFullYear();
  return current === COPYRIGHT_START
    ? `${COPYRIGHT_START}`
    : `${COPYRIGHT_START}-${current}`;
}

const SWIPE_THRESHOLD = 50;
const BREAKPOINTS = [640, 768, 1024] as const;
const INITIAL_COUNT = 24;
const LOAD_MORE_BATCH = 24;

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

interface BlogGalleryProps {
  images: BlogGalleryImage[];
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

export default function BlogGallery({ images }: BlogGalleryProps) {
  const columnCount = useColumnCount();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [showCopyright, setShowCopyright] = useState(false);
  const [showExif, setShowExif] = useState(false);
  const touchStartX = useRef<number>(0);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const needsProgressive = images.length > INITIAL_COUNT;
  const [visibleCount, setVisibleCount] = useState(() =>
    needsProgressive ? INITIAL_COUNT : images.length
  );
  const visibleImages = useMemo(
    () => images.slice(0, visibleCount),
    [images, visibleCount]
  );
  const hasMore = visibleCount < images.length;

  useEffect(() => {
    setVisibleCount(
      images.length > INITIAL_COUNT ? INITIAL_COUNT : images.length
    );
  }, [images.length, images[0]?.src]);

  useEffect(() => {
    if (!hasMore || !loadMoreRef.current) return;
    const el = loadMoreRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleCount((n) => Math.min(n + LOAD_MORE_BATCH, images.length));
          }
        });
      },
      { rootMargin: "200px", threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, images.length]);

  const imageColumns = useMemo(() => {
    const cols: (BlogGalleryImage & { index: number })[][] = Array.from(
      { length: columnCount },
      () => []
    );
    const heights: number[] = Array.from({ length: columnCount }, () => 0);
    visibleImages.forEach((img, i) => {
      const aspectRatio = img.width > 0 ? img.height / img.width : 1;
      const shortestIdx = heights.indexOf(Math.min(...heights));
      cols[shortestIdx].push({ ...img, index: i });
      heights[shortestIdx] += aspectRatio;
    });
    return cols;
  }, [visibleImages, columnCount]);

  const lightboxImage =
    lightboxIndex !== null ? images[lightboxIndex] ?? null : null;

  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index);
  }, []);

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  const goPrev = useCallback(() => {
    setLightboxIndex((i) => (i === null || i <= 0 ? i : i - 1));
  }, []);

  const goNext = useCallback(() => {
    setLightboxIndex((i) =>
      i === null || i >= images.length - 1 ? i : i + 1
    );
  }, [images.length]);

  const hasPrev = lightboxIndex !== null && lightboxIndex > 0;
  const hasNext = lightboxIndex !== null && lightboxIndex < images.length - 1;

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
    if (lightboxIndex !== null) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [lightboxIndex]);

  useEffect(() => {
    if (lightboxIndex === null) {
      setShowCopyright(false);
    }
  }, [lightboxIndex]);

  if (images.length === 0) return null;

  return (
    <div className="mt-12">
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
                  key={`${img.src}-${img.index}`}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  transition={{
                    duration: 0.4,
                    ease: [0.25, 0.46, 0.45, 0.94],
                  }}
                  className="overflow-hidden"
                >
                  <button
                    type="button"
                    data-cursor-hover
                    data-cursor-aperture
                    onClick={() => openLightbox(img.index)}
                    className="group relative block w-full overflow-hidden rounded-lg bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 focus:ring-offset-white"
                  >
                    <div className="overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.src}
                        alt=""
                        width={img.width}
                        height={img.height}
                        loading="lazy"
                        decoding="async"
                        className="h-auto w-full object-cover transition-[transform] duration-700 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:scale-[1.03]"
                        style={{
                          aspectRatio: `${img.width} / ${img.height}`,
                        }}
                      />
                    </div>
                    <div className="absolute inset-0 bg-black/0 transition-colors duration-500 ease-out group-hover:bg-black/30" />
                    {(img.title || img.description) && (
                      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-4 text-white">
                        <p className="translate-y-2.5 text-sm font-medium opacity-0 transition-all duration-500 ease-out group-hover:-translate-y-[10px] group-hover:opacity-100">
                          {img.title}
                          {img.title && img.description && " — "}
                          {img.description}
                        </p>
                      </div>
                    )}
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ))}
      </motion.div>

      {hasMore && (
        <div
          ref={loadMoreRef}
          className="flex min-h-[80px] items-center justify-center py-6"
          aria-live="polite"
          aria-label={`Učitano ${visibleCount} od ${images.length} slika`}
        >
          <span className="text-xs text-zinc-400">
            {visibleCount} / {images.length}
          </span>
        </div>
      )}

      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] flex flex-col bg-zinc-950"
            data-cursor-aperture
            onClick={closeLightbox}
          >
            <div className="absolute left-0 right-0 top-0 z-20 flex items-center px-6 py-6 md:px-12">
              <div className="flex-1" />
              {images.length > 1 && (
                <p className="text-[10px] font-medium tracking-[0.3em] text-white/60">
                  {lightboxIndex !== null && lightboxIndex + 1} / {images.length}
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
                  aria-label="Zatvori"
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
                aria-label="Prethodna"
              >
                <ChevronLeft
                  className="h-12 w-12 md:h-14 md:w-14"
                  strokeWidth={1.5}
                />
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
                aria-label="Sljedeća"
              >
                <ChevronRight
                  className="h-12 w-12 md:h-14 md:w-14"
                  strokeWidth={1.5}
                />
              </button>
            )}

            <motion.div
              key={lightboxIndex}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="relative z-10 flex min-h-0 flex-1 items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
              onContextMenu={(e) => {
                e.preventDefault();
                setShowCopyright(true);
              }}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <div
                className="flex h-[100vh] shrink-0 items-center justify-center"
                style={{ maxWidth: "min(95vw, 2048px)" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={lightboxImage.src}
                  alt=""
                  className="max-h-full max-w-full select-none object-contain pointer-events-none"
                  draggable={false}
                />
              </div>

              <AnimatePresence>
                {showCopyright && (
                  <div
                    className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
                    onClick={() => setShowCopyright(false)}
                  >
                    <motion.div
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                      className="max-w-xl min-w-[20rem] rounded-xl border border-zinc-700 bg-zinc-900 px-8 py-6 text-center shadow-xl"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="space-y-3">
                        <p className="font-serif text-lg tracking-tight text-white">
                          © {getCopyrightYear()} Ivica Drusany
                        </p>
                        <p className="mt-1.5 text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
                          Sva prava pridržana
                        </p>
                        <div className="mt-6 space-y-2 text-sm leading-relaxed text-zinc-400">
                          <p>Ove fotografije zaštićene su autorskim pravima.</p>
                          <p>Zabranjeno je preuzimanje, kopiranje ili distribucija bez dopuštenja.</p>
                          <p>
                            Za kupnju i korištenje fotografija, molimo ispunite{" "}
                            <Link
                              href="/contact"
                              className="border-b border-zinc-500 text-zinc-300 transition-colors hover:border-zinc-400 hover:text-white"
                              onClick={(e) => e.stopPropagation()}
                            >
                              kontaktni obrazac
                            </Link>
                            .
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowCopyright(false)}
                        className="mt-6 rounded-lg border border-zinc-600 bg-zinc-800 px-6 py-2.5 text-sm tracking-[0.1em] text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white"
                      >
                        Razumijem
                      </button>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

              {((lightboxImage.title || lightboxImage.description) ||
                (showExif &&
                  (lightboxImage.camera ||
                    lightboxImage.lens ||
                    lightboxImage.exposure ||
                    lightboxImage.aperture ||
                    lightboxImage.iso != null))) && (
                <div
                  className="absolute bottom-0 left-0 right-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.85)_0%,rgba(0,0,0,0.4)_25%,rgba(0,0,0,0.1)_50%,transparent_100%)] pb-10 pt-32 md:pb-12 md:pt-36"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="mx-auto max-w-2xl px-6 text-center md:px-12">
                    <div className="inline-block rounded-lg border border-white/10 bg-black/50 px-4 py-2 backdrop-blur-sm">
                      {(lightboxImage.title || lightboxImage.description) && (
                        <p className="text-[14px] font-medium leading-relaxed tracking-[0.1em] text-white/90">
                          {lightboxImage.title}
                          {lightboxImage.title && lightboxImage.description && " — "}
                          {lightboxImage.description}
                        </p>
                      )}
                      {showExif &&
                        (lightboxImage.camera ||
                          lightboxImage.lens ||
                          lightboxImage.exposure ||
                          lightboxImage.aperture ||
                          lightboxImage.iso != null) && (
                          <p
                            className={`text-[10px] font-medium tracking-[0.2em] text-white/80 ${
                              (lightboxImage.title || lightboxImage.description) ? "mt-1" : ""
                            }`}
                          >
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
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
