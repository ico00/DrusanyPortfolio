"use client";

import { useEffect } from "react";
import Gallery from "./Gallery";
import type { GalleryImage } from "@/lib/getGallery";

interface CategoryGalleryPageProps {
  images: GalleryImage[];
  categorySlug: string;
}

export default function CategoryGalleryPage({
  images,
  categorySlug,
}: CategoryGalleryPageProps) {
  useEffect(() => {
    document.documentElement.style.overflow = "";
    document.body.style.overflow = "";
    history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    const t = setTimeout(() => window.scrollTo(0, 0), 50);
    return () => {
      clearTimeout(t);
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, [categorySlug]);

  return (
    <div className="min-h-screen bg-white">
      <section className="px-4 pt-20 pb-24 sm:px-6 sm:pb-32 md:pt-24 md:pb-40">
        <div className="mx-auto max-w-[1600px]">
          <Gallery images={images} categorySlug={categorySlug} />
        </div>
      </section>
    </div>
  );
}
