"use client";

import { useMemo, useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

const QUOTE_CHAR = "\u201C"; // Lijevi tipografski navodnik (zaobljen)
const SWIPE_THRESHOLD = 50;

function processProseHtml(html: string): { processedHtml: string; imageUrls: string[] } {
  const doc =
    typeof document !== "undefined"
      ? new DOMParser().parseFromString(html, "text/html")
      : (() => {
          const { parseHTML } = require("linkedom");
          const { document } = parseHTML(`<!DOCTYPE html><html><body>${html}</body></html>`);
          return document;
        })();
  const imageUrls: string[] = [];

  // Blockquote dekoracija
  doc.querySelectorAll("blockquote").forEach((bq) => {
    if (bq.querySelector(".quote-decor")) return;
    const span = doc.createElement("span");
    span.className = "quote-decor";
    span.setAttribute("aria-hidden", "true");
    span.textContent = QUOTE_CHAR;
    bq.insertBefore(span, bq.firstChild);
  });

  // Wrap slike – isto kao BlogGallery/Gallery: data-cursor-hover, data-cursor-aperture
  const imgs = Array.from(doc.querySelectorAll("img"));
  imgs.forEach((img) => {
    if (img.closest(".prose-img-wrapper")) return;
    const src = img.getAttribute("src");
    if (src) imageUrls.push(src);

    const parent = img.parentNode;
    if (!parent) return;

    const wrapper = doc.createElement("button");
    wrapper.type = "button";
    wrapper.className =
      "prose-img-wrapper cursor-pointer group relative block w-full overflow-hidden rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 focus:ring-offset-white";
    wrapper.setAttribute("data-cursor-hover", "");
    wrapper.setAttribute("data-cursor-aperture", "");
    if (src) wrapper.setAttribute("data-index", String(imageUrls.length - 1));
    const alignment = img.getAttribute("data-text-alignment");
    wrapper.setAttribute("data-text-alignment", alignment || "center");

    const insertParent = parent.nodeName === "P" ? parent.parentNode : parent;
    if (!insertParent) return;
    const insertBefore = parent.nodeName === "P" ? parent : img;
    insertParent.insertBefore(wrapper, insertBefore);
    wrapper.appendChild(img);
    img.setAttribute("data-cursor-aperture", "");
  });

  const bodyHtml = doc.body?.innerHTML ?? html;
  return { processedHtml: bodyHtml, imageUrls };
}

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
  const touchStartX = useRef<number>(0);

  const { processedHtml, imageUrls } = useMemo(
    () => processProseHtml(html),
    [html]
  );

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
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

  const handleContainerClick = useCallback(
    (e: React.MouseEvent) => {
      const btn = (e.target as HTMLElement).closest(
        ".prose-img-wrapper[data-index]"
      );
      if (btn) {
        e.preventDefault();
        e.stopPropagation();
        const idx = parseInt(btn.getAttribute("data-index") ?? "", 10);
        if (!isNaN(idx)) openLightbox(idx);
      }
    },
    [openLightbox]
  );

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

  return (
    <>
      <div
        ref={containerRef}
        id={id}
        className={className}
        dangerouslySetInnerHTML={{ __html: processedHtml }}
        onClick={handleContainerClick}
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
