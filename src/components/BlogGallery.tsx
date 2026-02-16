"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import type { BlogGalleryImage } from "@/lib/blog";

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
  const touchStartX = useRef<number>(0);

  const imageColumns = useMemo(() => {
    const cols: (BlogGalleryImage & { index: number })[][] = Array.from(
      { length: columnCount },
      () => []
    );
    const heights: number[] = Array.from({ length: columnCount }, () => 0);
    images.forEach((img, i) => {
      const aspectRatio = img.width > 0 ? img.height / img.width : 1;
      const shortestIdx = heights.indexOf(Math.min(...heights));
      cols[shortestIdx].push({ ...img, index: i });
      heights[shortestIdx] += aspectRatio;
    });
    return cols;
  }, [images, columnCount]);

  const lightboxSrc =
    lightboxIndex !== null ? images[lightboxIndex]?.src ?? null : null;

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
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ))}
      </motion.div>

      <AnimatePresence>
        {lightboxSrc && (
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
              <div className="flex flex-1 items-center justify-end">
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
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <div
                className="flex h-[100vh] shrink-0 items-center justify-center"
                style={{ maxWidth: "min(95vw, 2048px)" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={lightboxSrc}
                  alt=""
                  className="max-h-full max-w-full select-none object-contain pointer-events-none"
                  draggable={false}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
