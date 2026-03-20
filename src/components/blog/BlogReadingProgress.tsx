"use client";

import { useEffect, useState } from "react";

const TARGET_SELECTOR = "[data-blog-reading-article]";

/**
 * Tanki indikator napretka čitanja kroz članak (ispod fiksnog headera).
 * Sakriven uz prefers-reduced-motion: reduce.
 */
export default function BlogReadingProgress() {
  const [progress, setProgress] = useState(0);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const el = document.querySelector<HTMLElement>(TARGET_SELECTOR);
    if (!el) return;

    setHidden(false);

    const compute = () => {
      const rect = el.getBoundingClientRect();
      const articleTop = rect.top + window.scrollY;
      const articleBottom = articleTop + el.offsetHeight;
      const readLine = window.scrollY + window.innerHeight;
      const range = articleBottom - articleTop;
      if (range <= 0) {
        setProgress(0);
        return;
      }
      const raw = (readLine - articleTop) / range;
      setProgress(Math.min(1, Math.max(0, raw)));
    };

    compute();

    const ro = new ResizeObserver(() => compute());
    ro.observe(el);

    window.addEventListener("scroll", compute, { passive: true });
    window.addEventListener("resize", compute, { passive: true });

    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", compute);
      window.removeEventListener("resize", compute);
    };
  }, []);

  if (hidden) return null;

  const pct = Math.round(progress * 100);

  return (
    <div
      className="pointer-events-none fixed left-0 right-0 top-16 z-[45] h-0.5 bg-zinc-200/80"
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Napredak čitanja članka"
    >
      <div
        className="h-full bg-zinc-900 transition-[width] duration-150 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
