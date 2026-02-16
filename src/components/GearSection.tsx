"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import type { GearItem } from "@/lib/gear";

const SWIPE_THRESHOLD = 50;
const BREAKPOINTS = [640, 768, 1024] as const;

function useColumnCount(): number {
  const [cols, setCols] = useState(2);
  useEffect(() => {
    const getCols = (w: number) => {
      if (w < BREAKPOINTS[0]) return 2;
      if (w < BREAKPOINTS[2]) return 2;
      return 3;
    };
    const update = () => setCols(getCols(window.innerWidth));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return cols;
}

interface GearSectionProps {
  items: GearItem[];
}

export default function GearSection({ items }: GearSectionProps) {
  const columnCount = useColumnCount();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const touchStartX = useRef<number>(0);

  const lightboxItem = useMemo(
    () => (lightboxIndex !== null ? items[lightboxIndex] ?? null : null),
    [lightboxIndex, items]
  );

  const openLightbox = useCallback(
    (item: GearItem) => {
      const idx = items.findIndex((i) => i.id === item.id);
      setLightboxIndex(idx >= 0 ? idx : 0);
    },
    [items]
  );

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  const goPrev = useCallback(() => {
    setLightboxIndex((i) => (i === null || i <= 0 ? i : i - 1));
  }, []);

  const goNext = useCallback(() => {
    setLightboxIndex((i) =>
      i === null || i >= items.length - 1 ? i : i + 1
    );
  }, [items.length]);

  const hasPrev = lightboxIndex !== null && lightboxIndex > 0;
  const hasNext = lightboxIndex !== null && lightboxIndex < items.length - 1;

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

  const columns = useMemo(() => {
    const cols: GearItem[][] = Array.from({ length: columnCount }, () => []);
    const heights: number[] = Array.from({ length: columnCount }, () => 0);
    items.forEach((item) => {
      const aspectRatio =
        item.width && item.height ? item.height / item.width : 4 / 3;
      const shortestIdx = heights.indexOf(Math.min(...heights));
      cols[shortestIdx].push(item);
      heights[shortestIdx] += aspectRatio;
    });
    return cols;
  }, [items, columnCount]);

  if (items.length === 0) return null;

  return (
    <section className="mt-16 border-t border-zinc-800 pt-16">
      <h2 className="mb-8 font-serif text-2xl font-light tracking-tight text-white">
        Gear
      </h2>
      <div className="prose prose-invert prose-lg max-w-xl mb-10 [&_p]:mb-0">
        <p className="text-zinc-400">I&apos;ll shoot you with:</p>
      </div>
      <div
        className="grid gap-4 sm:gap-6"
        style={{ gridTemplateColumns: `repeat(${columnCount}, 1fr)` }}
      >
        {columns.map((column, colIndex) => (
          <div key={colIndex} className="flex flex-col gap-4 sm:gap-6">
            {column.map((item) => {
              const content = (
                <div className="group relative overflow-hidden rounded-lg bg-zinc-900">
                  <div className="overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.src}
                      alt={item.alt}
                      loading="lazy"
                      decoding="async"
                      width={item.width}
                      height={item.height}
                      className="h-auto w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:scale-[1.03]"
                      style={
                        item.width && item.height
                          ? { aspectRatio: `${item.width} / ${item.height}` }
                          : undefined
                      }
                    />
                  </div>
                  <div className="absolute inset-0 bg-black/0 transition-colors duration-500 ease-out group-hover:bg-black/30" />
                  {item.title && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                      <p className="text-xs font-medium text-white">
                        {item.title}
                      </p>
                    </div>
                  )}
                </div>
              );

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    duration: 0.4,
                    ease: [0.25, 0.46, 0.45, 0.94],
                  }}
                >
                  <button
                    type="button"
                    onClick={() => openLightbox(item)}
                    className="block w-full text-left focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-950 rounded-lg cursor-pointer"
                  >
                    {content}
                  </button>
                </motion.div>
              );
            })}
          </div>
        ))}
      </div>

      <AnimatePresence>
        {lightboxItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] flex flex-col bg-zinc-950"
            onClick={closeLightbox}
          >
            <div className="absolute left-0 right-0 top-0 z-20 flex items-center px-6 py-6 md:px-12">
              <div className="flex-1" />
              {items.length > 1 && (
                <p className="text-[10px] font-medium tracking-[0.3em] text-white/60">
                  {lightboxIndex !== null && lightboxIndex + 1} / {items.length}
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
              key={lightboxItem.id}
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
                <img
                  src={lightboxItem.src}
                  alt={lightboxItem.alt}
                  className="max-h-full max-w-full select-none object-contain pointer-events-none"
                  draggable={false}
                />
              </div>

              {lightboxItem.title && (
                <div
                  className="absolute bottom-0 left-0 right-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.85)_0%,rgba(0,0,0,0.4)_25%,rgba(0,0,0,0.1)_50%,transparent_100%)] pb-10 pt-32 md:pb-12 md:pt-36"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="mx-auto max-w-2xl px-6 text-center md:px-12">
                    <div className="inline-block rounded-lg border border-white/10 bg-black/50 px-4 py-3 backdrop-blur-sm">
                      <p className="text-[14px] font-medium leading-relaxed tracking-[0.15em] text-white/80">
                        {lightboxItem.title}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
