"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

export interface LightboxMetaSpineProps {
  /** Bold primary line (e.g. image title). */
  title?: string;
  /** Rendered directly after the title, e.g. " @ Venue" or " — Description". Caller controls formatting/muting. */
  titleSuffix?: ReactNode;
  /** Pre-formatted date string, or omit to hide. */
  dateLabel?: string;
  showExif: boolean;
  camera?: string;
  lens?: string;
  exposure?: string;
  aperture?: string;
  iso?: number | string | null;
}

/**
 * Vertical "book spine" metadata panel for the lightbox: title/date on the left,
 * EXIF specs further along, rotated on desktop and horizontally scrollable when
 * content is taller than the viewport (chevron hints indicate more content).
 * Collapses to a compact horizontal bar below the image on mobile.
 */
export default function LightboxMetaSpine({
  title,
  titleSuffix,
  dateLabel,
  showExif,
  camera,
  lens,
  exposure,
  aperture,
  iso,
}: LightboxMetaSpineProps) {
  const spineScrollRef = useRef<HTMLDivElement>(null);
  const [spineHasMore, setSpineHasMore] = useState(false);
  const [spineHasLess, setSpineHasLess] = useState(false);

  const exifItems = (
    [
      ["Body", camera],
      ["Lens", lens],
      ["Shutter", exposure],
      ["Aperture", aperture],
      ["ISO", iso != null ? String(iso) : null],
    ] as [string, string | undefined | null][]
  ).filter((entry): entry is [string, string] => !!entry[1]);

  const hasTitleBlock = !!(title || titleSuffix || dateLabel);
  const hasExifBlock = showExif && exifItems.length > 0;

  useEffect(() => {
    const el = spineScrollRef.current;
    if (!el) {
      setSpineHasMore(false);
      setSpineHasLess(false);
      return;
    }
    const update = () => {
      setSpineHasMore(el.scrollWidth - el.clientWidth - el.scrollLeft > 4);
      setSpineHasLess(el.scrollLeft > 4);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [title, titleSuffix, dateLabel, showExif, camera, lens, exposure, aperture, iso]);

  if (!hasTitleBlock && !hasExifBlock) return null;

  return (
    <div className="shrink-0 overflow-hidden border-t border-white/10 md:w-16 md:border-r md:border-t-0">
      {/* Mobile: compact bar below the image */}
      <div className="flex w-full flex-col items-start gap-3 px-6 py-4 md:hidden">
        {hasTitleBlock && (
          <div className="text-left">
            <p className="text-[15px] font-semibold tracking-tight text-white">
              {title}
              {titleSuffix}
            </p>
            {dateLabel && (
              <p className="mt-0.5 text-[12px] text-white/50">{dateLabel}</p>
            )}
          </div>
        )}

        {hasExifBlock && (
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {exifItems.map(([label, value]) => (
              <div key={label} className="flex flex-col gap-0.5">
                <span className="text-[9px] uppercase tracking-[0.16em] text-white/45">{label}</span>
                <span className="font-mono text-[12px] text-white/90 whitespace-nowrap">{value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Desktop: vertical spine, book-spine style, scrollable when content is tall */}
      <div className="relative hidden h-full w-16 items-center justify-center overflow-hidden md:flex">
        <div
          ref={spineScrollRef}
          className="max-w-[78vh] shrink-0 overflow-x-auto overflow-y-hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden -rotate-90"
          onWheel={(e) => {
            e.currentTarget.scrollLeft += e.deltaY;
          }}
        >
          <div className="flex items-center gap-10 whitespace-nowrap px-1 py-5">
            {hasTitleBlock && (
              <div className="flex items-center gap-3">
                <span className="text-lg font-semibold tracking-tight text-white">
                  {title}
                  {titleSuffix}
                </span>
                {dateLabel && (
                  <span className="shrink-0 text-[13px] text-white/55">{dateLabel}</span>
                )}
              </div>
            )}

            {hasExifBlock && (
              <div className="flex items-center">
                {exifItems.map(([label, value]) => (
                  <div key={label} className="flex flex-col gap-1 border-l border-white/20 px-4 first:border-l-0 first:pl-0">
                    <span className="text-[9px] uppercase tracking-[0.16em] text-white/45">{label}</span>
                    <span className="font-mono text-[13px] text-white/95 whitespace-nowrap">{value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        {spineHasLess && (
          <div className="pointer-events-none absolute top-2 left-1/2 -translate-x-1/2 animate-pulse text-white/40">
            <ChevronUp className="h-4 w-4" strokeWidth={1.5} />
          </div>
        )}
        {spineHasMore && (
          <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 animate-pulse text-white/40">
            <ChevronDown className="h-4 w-4" strokeWidth={1.5} />
          </div>
        )}
      </div>
    </div>
  );
}
