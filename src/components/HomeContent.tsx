"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Suspense, useEffect } from "react";
import HeroSlider from "./HeroSlider";
import Gallery from "./Gallery";
import type { GalleryImage } from "@/lib/getGallery";

function normalizeCategory(cat: string): string {
  return cat.toLowerCase().replace(/\s*&\s*/g, "-").replace(/\s+/g, "-");
}

function normalizeVenue(v: string): string {
  return v.toLowerCase().replace(/\s+/g, "-").replace(/[čć]/g, "c").replace(/[š]/g, "s").replace(/[ž]/g, "z");
}

function normalizeSport(s: string): string {
  return s.toLowerCase().replace(/\s+/g, "-").replace(/[čć]/g, "c").replace(/[š]/g, "s").replace(/[ž]/g, "z");
}

interface HomeContentProps {
  images: GalleryImage[];
}

function HomeContentInner({ images }: HomeContentProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const category = searchParams.get("category");
  const venue = searchParams.get("venue");
  const sport = searchParams.get("sport");
  const foodDrink = searchParams.get("foodDrink");
  const imageSlug = searchParams.get("image");

  useEffect(() => {
    if (imageSlug && !category) {
      const img = images.find((i) => i.slug === imageSlug);
      if (img) {
        const catSlug = normalizeCategory(img.category);
        const params = new URLSearchParams();
        params.set("category", catSlug);
        params.set("image", imageSlug);
        if (catSlug === "concerts" && img.venue) {
          params.set("venue", normalizeVenue(img.venue));
        }
        if (catSlug === "sport" && img.sport) {
          params.set("sport", normalizeSport(img.sport));
        }
        router.replace(`${pathname}?${params.toString()}#gallery`, { scroll: false });
        return;
      }
    }
  }, [imageSlug, category, images, router, pathname]);

  useEffect(() => {
    if (!category) {
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
      history.scrollRestoration = "auto";
    } else {
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
    }
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, [category, venue, sport, foodDrink]);

  if (category) {
    return (
      <div className="min-h-screen bg-white">
        <section className="px-4 pt-20 pb-24 sm:px-6 sm:pb-32 md:pt-24 md:pb-40">
          <div className="mx-auto max-w-[1600px]">
            <Suspense fallback={<div className="min-h-[40vh]" />}>
              <Gallery images={images} />
            </Suspense>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden">
      <HeroSlider images={images} />
    </div>
  );
}

export default function HomeContent({ images }: HomeContentProps) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950" />}>
      <HomeContentInner images={images} />
    </Suspense>
  );
}
