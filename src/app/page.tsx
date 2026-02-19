import type { Metadata } from "next";
import { Suspense } from "react";
import { getGallery } from "@/lib/getGallery";
import { getPages } from "@/lib/pages";
import Header from "@/components/Header";
import HomeContent from "@/components/HomeContent";

export async function generateMetadata(): Promise<Metadata> {
  const pages = await getPages();
  const homePage = pages.home;
  const title = homePage?.seo?.metaTitle?.trim() || homePage?.title || "Drusany | Photography";
  const description = homePage?.seo?.metaDescription?.trim() || undefined;
  const keywords = homePage?.seo?.keywords?.trim()
    ? homePage.seo.keywords.split(",").map((k) => k.trim()).filter(Boolean)
    : undefined;
  return {
    title,
    description,
    keywords: keywords?.length ? keywords.join(", ") : undefined,
    openGraph: {
      title,
      description,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function HomePage() {
  const { images } = await getGallery();

  return (
    <div className="min-h-screen bg-zinc-950">
      <Suspense fallback={<div className="h-16" />}>
        <Header />
      </Suspense>
      <main className="pt-0">
        <Suspense fallback={<div className="min-h-screen" />}>
          <HomeContent images={images} />
        </Suspense>
      </main>
    </div>
  );
}
