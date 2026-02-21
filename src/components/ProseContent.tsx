"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

const QUOTE_CHAR = "\u201C"; // Lijevi tipografski navodnik (zaobljen)
const SWIPE_THRESHOLD = 50;

export default function ProseContent({
  html,
  className,
  id,
}: {
  html: string;
  className?: string;
  id?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageUrlsRef = useRef<string[]>([]);
  const touchStartX = useRef<number>(0);

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const lightboxImage =
    lightboxIndex !== null && imageUrls[lightboxIndex]
      ? imageUrls[lightboxIndex]
      : null;

  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index);
  }, []);

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  const goPrev = useCallback(() => {
    setLightboxIndex((i) => (i === null || i <= 0 ? i : i - 1));
  }, []);

  const goNext = useCallback(() => {
    setLightboxIndex((i) =>
      i === null || i >= imageUrls.length - 1 ? i : i + 1
    );
  }, [imageUrls.length]);

  const hasPrev = lightboxIndex !== null && lightboxIndex > 0;
  const hasNext = lightboxIndex !== null && lightboxIndex < imageUrls.length - 1;

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
    const el = containerRef.current;
    if (!el) return;

    const blockquotes = el.querySelectorAll("blockquote");
    blockquotes.forEach((bq) => {
      if (bq.querySelector(".quote-decor")) return;
      const span = document.createElement("span");
      span.className = "quote-decor";
      span.setAttribute("aria-hidden", "true");
      span.textContent = QUOTE_CHAR;
      bq.insertBefore(span, bq.firstChild);
    });

    const imgs = Array.from(el.querySelectorAll("img"));
    const urls: string[] = [];
    imgs.forEach((img) => {
      if (img.closest(".prose-img-wrapper")) return;
      const src = img.getAttribute("src");
      if (src) urls.push(src);

      const parent = img.parentNode;
      if (!parent) return;

      const wrapper = document.createElement("div");
      wrapper.className = "prose-img-wrapper cursor-pointer";
      wrapper.setAttribute("data-cursor-hover", "");
      wrapper.setAttribute("data-cursor-aperture", "");
      const alignment = img.getAttribute("data-text-alignment");
      if (alignment) {
        wrapper.setAttribute("data-text-alignment", alignment);
      } else {
        wrapper.setAttribute("data-text-alignment", "center");
      }
      parent.insertBefore(wrapper, img);
      wrapper.appendChild(img);

      if (src) {
        const index = urls.length - 1;
        wrapper.addEventListener("click", () => openLightbox(index));
      }
    });
    imageUrlsRef.current = urls;
    setImageUrls(urls);
  }, [html, openLightbox]);

  return (
    <>
      <div
        ref={containerRef}
        id={id}
        className={className}
        dangerouslySetInnerHTML={{ __html: html }}
      />

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
              {imageUrls.length > 1 && (
                <p className="text-[10px] font-medium tracking-[0.3em] text-white/60">
                  {lightboxIndex !== null && lightboxIndex + 1} / {imageUrls.length}
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
                  src={lightboxImage}
                  alt=""
                  className="max-h-full max-w-full select-none object-contain pointer-events-none"
                  draggable={false}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
