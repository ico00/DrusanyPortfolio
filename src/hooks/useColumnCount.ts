"use client";

import { useState, useEffect } from "react";

/** Isti pragovi kao Gallery / BlogGallery masonry */
const GALLERY_BREAKPOINTS = [640, 768, 1024] as const;

function galleryColumnCount(width: number): number {
  if (width < GALLERY_BREAKPOINTS[0]) return 1;
  if (width < GALLERY_BREAKPOINTS[1]) return 2;
  if (width < GALLERY_BREAKPOINTS[2]) return 3;
  return 4;
}

/** Press sekcija: 2 stupca ispod lg, 3 na širokim ekranima */
function pressColumnCount(width: number): number {
  if (width < GALLERY_BREAKPOINTS[0]) return 2;
  if (width < GALLERY_BREAKPOINTS[2]) return 2;
  return 3;
}

export type MasonryColumnPreset = "gallery" | "press";

const PRESET_INITIAL: Record<MasonryColumnPreset, number> = {
  gallery: 4,
  press: 2,
};

/**
 * Broj stupaca za balanced masonry grid (resize listener).
 * `gallery` – 1/2/3/4 (Portfolio, Blog galerija); `press` – 2/3 (About Press).
 */
export function useColumnCount(preset: MasonryColumnPreset = "gallery"): number {
  const [cols, setCols] = useState(PRESET_INITIAL[preset]);

  useEffect(() => {
    const compute =
      preset === "press" ? pressColumnCount : galleryColumnCount;
    const update = () => setCols(compute(window.innerWidth));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [preset]);

  return cols;
}
